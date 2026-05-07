import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const repoRoot = process.cwd();
const browserRunId = process.env.AGENT_BROWSER_RUN_ID ?? `ci-${Date.now()}`;
const repoChecksum = computeRepoChecksum(repoRoot);
const browserSession = `product-stacks-public-${repoChecksum}-${browserRunId}`;
const browserSmokeRoot = join(repoRoot, ".product-build-stacks", "live-smoke");
const fixtureSiteRoot = join(browserSmokeRoot, "site");
const screenshotOutputDir = join(repoRoot, ".product-build-stacks", "artifacts", "browser", "screenshots");
const screenshotOutputRoot = resolve(screenshotOutputDir);
const browserDownloadDir = join(repoRoot, ".product-build-stacks", "browser", "downloads");
const fixtureMarker = "Product Stacks Browser Live Smoke";

mkdirSync(fixtureSiteRoot, { recursive: true });
mkdirSync(screenshotOutputDir, { recursive: true });
mkdirSync(browserDownloadDir, { recursive: true });
writeFileSync(join(fixtureSiteRoot, "index.html"), `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${fixtureMarker}</title>
  </head>
  <body>
    <main>
      <h1>${fixtureMarker}</h1>
      <p data-testid="smoke-copy">official agent-browser live smoke fixture</p>
    </main>
  </body>
</html>
`);

const fixtureServer = await startFixtureServer();

try {
  await runCommand(["agent-browser", "--version"], "version");
  const url = `http://127.0.0.1:${fixtureServer.port}/index.html`;
  const before = collectPngFiles(screenshotOutputDir);

  assertAgentBrowserSuccess(await runAgentBrowserCommand([
    "--json",
    "--content-boundaries",
    "--screenshot-dir",
    screenshotOutputDir,
    "--download-path",
    browserDownloadDir,
    "--max-output",
    "50000",
    "--session",
    browserSession,
    "open",
    url
  ], "open"), "open");

  const snapshot = assertAgentBrowserSuccess(await runAgentBrowserCommand([
    "--json",
    "--content-boundaries",
    "--session",
    browserSession,
    "snapshot",
    "-i"
  ], "snapshot"), "snapshot");
  if (!snapshot.stdout.includes(fixtureMarker)) {
    throw new Error(`snapshot did not include smoke marker: ${fixtureMarker}`);
  }

  const screenshot = assertAgentBrowserSuccess(await runAgentBrowserCommand([
    "--json",
    "--screenshot-dir",
    screenshotOutputDir,
    "--session",
    browserSession,
    "screenshot"
  ], "screenshot"), "screenshot");
  const screenshotPath = findConcreteScreenshotPath(screenshot.json, screenshotOutputDir, before);
  if (!screenshotPath) throw new Error("screenshot succeeded but no concrete PNG path was found");

  console.log(JSON.stringify({
    ok: true,
    session: browserSession,
    url,
    screenshotPath: resolve(screenshotPath)
  }, null, 2));
} finally {
  try {
    await runAgentBrowserCommand(["--json", "--session", browserSession, "close"], "close", { allowFailure: true });
  } finally {
    await fixtureServer.stop();
    if (process.env.PRODUCT_BROWSER_SMOKE_KEEP !== "1") {
      rmSync(browserSmokeRoot, { recursive: true, force: true });
    }
  }
}

async function runAgentBrowserCommand(args: string[], label: string, options: { allowFailure?: boolean } = {}) {
  return runCommand(["agent-browser", ...args], label, options);
}

async function runCommand(command: string[], label: string, options: { allowFailure?: boolean } = {}) {
  const proc = Bun.spawn(command, {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe"
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGTERM");
  }, 120000);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited
  ]).finally(() => clearTimeout(timer));
  const reportedExitCode = timedOut ? 124 : exitCode;
  if (!options.allowFailure && reportedExitCode !== 0) {
    throw new Error(`${label} failed (${reportedExitCode})\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  }
  return { exitCode: reportedExitCode, stdout, stderr };
}

function assertAgentBrowserSuccess(result: { stdout: string; stderr: string }, label: string) {
  let json: unknown;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`${label} returned non-JSON stdout\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}\nparse error: ${error}`);
  }
  if (!isRecord(json) || json.success !== true) {
    throw new Error(`${label} returned JSON but not success=true\n${result.stdout}`);
  }
  return { stdout: result.stdout, stderr: result.stderr, json };
}

function findConcreteScreenshotPath(json: unknown, dir: string, before: Set<string>) {
  for (const value of extractStrings(json)) {
    if (value.endsWith(".png") && isConcreteScreenshotArtifact(value)) return value;
  }
  const after = collectPngFiles(dir);
  const created = [...after].filter((path) => !before.has(path)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return created[0];
}

function isConcreteScreenshotArtifact(path: string) {
  const resolved = resolve(path);
  return resolved.startsWith(`${screenshotOutputRoot}/`) && existsSync(resolved);
}

function* extractStrings(value: unknown): Generator<string> {
  if (typeof value === "string") {
    yield value;
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) yield* extractStrings(item);
    return;
  }
  if (isRecord(value)) {
    for (const item of Object.values(value)) yield* extractStrings(item);
  }
}

function collectPngFiles(dir: string) {
  if (!existsSync(dir)) return new Set<string>();
  return new Set(
    readdirSync(dir)
      .filter((name) => name.endsWith(".png"))
      .map((name) => join(dir, name))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function computeRepoChecksum(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash + value.charCodeAt(index) * (index + 1)) >>> 0;
  }
  return String(hash);
}

function startFixtureServer() {
  return new Promise<{ port: number; stop: () => Promise<void> }>((resolve, reject) => {
    const requested = Number(process.env.PRODUCT_BROWSER_SMOKE_PORT ?? 41731);
    let offset = 0;
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== "/" && url.pathname !== "/index.html") {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("not found");
        return;
      }
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(readFileSync(join(fixtureSiteRoot, "index.html")));
    });
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" && offset < 20) {
        offset += 1;
        server.listen(requested + offset, "127.0.0.1");
        return;
      }
      reject(error);
    });
    server.listen(requested, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("fixture server did not expose a TCP port"));
        return;
      }
      resolve({
        port: address.port,
        stop: () => new Promise((stopResolve, stopReject) => {
          server.close((error) => error ? stopReject(error) : stopResolve());
        })
      });
    });
  });
}
