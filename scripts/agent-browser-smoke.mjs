import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const repoRoot = process.cwd();
const browserRunId = process.env.AGENT_BROWSER_RUN_ID ?? `ci-${Date.now()}`;
const repoChecksum = computeRepoChecksum(repoRoot);
const browserRunChecksum = computeRepoChecksum(browserRunId);
const browserSession = `ps-${repoChecksum}-${browserRunChecksum}`;
const browserSocketDir = process.env.BUILD_BROWSER_SOCKET_DIR ?? `/tmp/agent-browser-${repoChecksum}`;
const browserSmokeRoot = join(repoRoot, ".build-stacks", "live-smoke");
const fixtureSiteRoot = join(browserSmokeRoot, "site");
const screenshotOutputDir = join(repoRoot, ".build-stacks", "artifacts", "browser", "screenshots");
const screenshotOutputRoot = resolve(screenshotOutputDir);
const browserDownloadDir = join(repoRoot, ".build-stacks", "browser", "downloads");
const fixtureMarker = "Product Stacks Browser Live Smoke";
mkdirSync(fixtureSiteRoot, { recursive: true });
mkdirSync(screenshotOutputDir, { recursive: true });
mkdirSync(browserDownloadDir, { recursive: true });
mkdirSync(browserSocketDir, { recursive: true });
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
    if (!screenshotPath)
        throw new Error("screenshot succeeded but no concrete PNG path was found");
    console.log(JSON.stringify({
        ok: true,
        session: browserSession,
        url,
        screenshotPath: resolve(screenshotPath)
    }, null, 2));
}
finally {
    try {
        await runAgentBrowserCommand(["--json", "--session", browserSession, "close"], "close", { allowFailure: true });
    }
    finally {
        await fixtureServer.stop();
        if (process.env.BUILD_BROWSER_SMOKE_KEEP !== "1") {
            rmSync(browserSmokeRoot, { recursive: true, force: true });
        }
    }
}
async function runAgentBrowserCommand(args, label, options = {}) {
    return runCommand(["agent-browser", ...args], label, options);
}
async function runCommand(command, label, options = {}) {
    const proc = spawn(command[0], command.slice(1), {
        cwd: repoRoot,
        env: {
            ...process.env,
            AGENT_BROWSER_SOCKET_DIR: browserSocketDir
        },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
    }, 120000);
    const [stdout, stderr, exitCode] = await Promise.all([
        collectStream(proc.stdout),
        collectStream(proc.stderr),
        new Promise((resolve) => proc.on("close", (code) => resolve(code ?? 1)))
    ]).finally(() => clearTimeout(timer));
    const reportedExitCode = timedOut ? 124 : exitCode;
    if (!options.allowFailure && reportedExitCode !== 0) {
        throw new Error(`${label} failed (${reportedExitCode})\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
    return { exitCode: reportedExitCode, stdout, stderr };
}
function collectStream(stream) {
    return new Promise((resolve, reject) => {
        let body = "";
        stream.setEncoding("utf8");
        stream.on("data", (chunk) => {
            body += chunk;
        });
        stream.on("error", reject);
        stream.on("end", () => resolve(body));
    });
}
function assertAgentBrowserSuccess(result, label) {
    let json;
    try {
        json = JSON.parse(result.stdout);
    }
    catch (error) {
        throw new Error(`${label} returned non-JSON stdout\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}\nparse error: ${error}`);
    }
    if (!isRecord(json) || json.success !== true) {
        throw new Error(`${label} returned JSON but not success=true\n${result.stdout}`);
    }
    return { stdout: result.stdout, stderr: result.stderr, json };
}
function findConcreteScreenshotPath(json, dir, before) {
    for (const value of extractStrings(json)) {
        if (value.endsWith(".png") && isConcreteScreenshotArtifact(value))
            return value;
    }
    const after = collectPngFiles(dir);
    const created = [...after].filter((path) => !before.has(path)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    return created[0];
}
function isConcreteScreenshotArtifact(path) {
    const resolved = resolve(path);
    return resolved.startsWith(`${screenshotOutputRoot}/`) && existsSync(resolved);
}
function* extractStrings(value) {
    if (typeof value === "string") {
        yield value;
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value)
            yield* extractStrings(item);
        return;
    }
    if (isRecord(value)) {
        for (const item of Object.values(value))
            yield* extractStrings(item);
    }
}
function collectPngFiles(dir) {
    if (!existsSync(dir))
        return new Set();
    return new Set(readdirSync(dir)
        .filter((name) => name.endsWith(".png"))
        .map((name) => join(dir, name)));
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function computeRepoChecksum(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index++) {
        hash = (hash + value.charCodeAt(index) * (index + 1)) >>> 0;
    }
    return String(hash);
}
function startFixtureServer() {
    return new Promise((resolve, reject) => {
        const requested = Number(process.env.BUILD_BROWSER_SMOKE_PORT ?? 41731);
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
        server.on("error", (error) => {
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
