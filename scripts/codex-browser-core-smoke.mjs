import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";

const repoRoot = process.cwd();
const runRoot = resolve(process.env.PRODUCT_CODEX_BROWSER_SMOKE_ROOT ?? join(tmpdir(), `product-browser-core-smoke-${Date.now()}-${process.pid}`));
const packageRoot = join(runRoot, "package");
const appRoot = join(runRoot, "app");
const resultsRoot = join(runRoot, "results");
const reportsRoot = join(runRoot, "reports");
const fixtureRoot = join(runRoot, "fixture");
const runtimeRoot = join(runRoot, "runtime");
const fakeCodexHome = join(runtimeRoot, "codex-home");
const fakeHome = join(runtimeRoot, "home");
const agentBrowserSocketDir = join(runtimeRoot, "ab");
const realCodexHome = resolve(process.env.PRODUCT_CODEX_REAL_HOME ?? process.env.CODEX_HOME ?? join(process.env.HOME ?? tmpdir(), ".codex"));
const realCodexSkillsRoot = join(realCodexHome, "skills");
const realCodexSystemSkillsRoot = join(realCodexSkillsRoot, ".system");
const systemSkillsSnapshotRoot = join(runtimeRoot, "system-skills-snapshot");
const codexModel = process.env.PRODUCT_CODEX_BROWSER_MODEL ?? "gpt-5.5";
const codexReasoning = process.env.PRODUCT_CODEX_BROWSER_REASONING ?? "high";
const codexTimeoutMs = Number(process.env.PRODUCT_CODEX_BROWSER_TIMEOUT_MS ?? "600000") || 600000;
const codexIsolationConfigArgs = [
    "-c",
    "skills.bundled.enabled=false",
    "-c",
    "features.plugins=false",
    "-c",
    "features.apps=false",
    "-c",
    "features.tool_search=false",
    "-c",
    "features.tool_suggest=false"
];
const protectedPaths = [
    join(process.env.HOME ?? "", ".claude"),
    join(process.env.HOME ?? "", ".gstack"),
    realCodexSkillsRoot,
    join(repoRoot, ".claude"),
    join(repoRoot, "CLAUDE.md"),
    join(repoRoot, "AGENTS.md")
];

process.once("exit", cleanupCodexBrowserRuntime);

runCodexBrowserCoreSmoke().catch((error) => {
    console.error(error);
    process.exit(1);
});

async function runCodexBrowserCoreSmoke() {
    resetCodexBrowserSmokeWorkspace();
    prepareCodexBrowserRuntime();
    const preflight = captureCodexBrowserPreflight();
    let fixtureServer;
    try {
        prepareCodexBrowserPackage();
        prepareCodexBrowserApp();
        prepareBrowserFixture();
        runCodexBrowserCommand(["node", "scripts/apm-package-prepare.mjs", "--out", packageRoot], repoRoot, "package-prepare.log");
        runCodexBrowserCommand(["apm", "install", packageRoot, "--target", "codex", "--force"], appRoot, "apm-install.log");
        runCodexBrowserCommand(["apm", "compile", "--target", "codex"], appRoot, "apm-compile.log");
        fixtureServer = await startBrowserFixtureServer();
        const runs = [];
        runs.push(await runCodexBrowserSkill("product-browser-runner", buildBrowserRunnerPrompt(fixtureServer.url)));
        runs.push(await runCodexBrowserSkill("product-browser-qa", buildBrowserQaPrompt(fixtureServer.url)));
        const restoredSystemSkills = restoreCodexSystemSkillsSnapshot(preflight);
        const postflight = captureCodexBrowserPostflight(preflight);
        const summary = buildCodexBrowserSummary({ preflight, postflight, runs, fixtureUrl: fixtureServer.url, restoredSystemSkills });
        writeCodexBrowserReports(summary);
        console.log(`codex browser core smoke ${summary.status}: ${runRoot}`);
        if (summary.status !== "pass")
            process.exit(1);
    }
    finally {
        if (fixtureServer)
            fixtureServer.stop();
        cleanupCodexBrowserRuntime();
    }
}

function resetCodexBrowserSmokeWorkspace() {
    rmSync(runRoot, { recursive: true, force: true });
    mkdirSync(packageRoot, { recursive: true });
    mkdirSync(appRoot, { recursive: true });
    mkdirSync(resultsRoot, { recursive: true });
    mkdirSync(reportsRoot, { recursive: true });
    mkdirSync(fixtureRoot, { recursive: true });
    mkdirSync(runtimeRoot, { recursive: true });
}

function prepareCodexBrowserRuntime() {
    mkdirSync(fakeCodexHome, { recursive: true });
    mkdirSync(fakeHome, { recursive: true });
    mkdirSync(agentBrowserSocketDir, { recursive: true });
    const copiedFiles = [];
    const authFile = join(realCodexHome, "auth.json");
    if (existsSync(authFile)) {
        cpSync(authFile, join(fakeCodexHome, "auth.json"));
        copiedFiles.push("auth.json");
    }
    if (existsSync(realCodexSystemSkillsRoot)) {
        cpSync(realCodexSystemSkillsRoot, systemSkillsSnapshotRoot, { recursive: true, preserveTimestamps: true });
    }
    writeFileSync(join(reportsRoot, "runtime.json"), `${JSON.stringify({
        fakeCodexHome,
        fakeHome,
        agentBrowserSocketDir,
        realCodexHome,
        copiedFiles,
        systemSkillsSnapshot: existsSync(systemSkillsSnapshotRoot),
        codexModel,
        codexReasoning,
        sandbox: "danger-full-access",
        ignoreUserConfig: true,
        isolationConfigArgs: codexIsolationConfigArgs
    }, null, 2)}\n`);
}

function cleanupCodexBrowserRuntime() {
    rmSync(runtimeRoot, { recursive: true, force: true });
}

function restoreCodexSystemSkillsSnapshot(preflight) {
    const beforeState = preflight.protectedPaths.find((state) => state.path === realCodexSkillsRoot);
    let restored = false;
    if (existsSync(systemSkillsSnapshotRoot)) {
        rmSync(realCodexSystemSkillsRoot, { recursive: true, force: true });
        cpSync(systemSkillsSnapshotRoot, realCodexSystemSkillsRoot, { recursive: true, preserveTimestamps: true });
        restoreCodexBrowserTreeTimes(realCodexSystemSkillsRoot, preflight.codexSystemSkillsTree);
        restored = true;
    }
    if (beforeState?.exists && typeof beforeState.mtimeMs === "number") {
        const time = new Date(beforeState.mtimeMs);
        utimesSync(realCodexSkillsRoot, time, time);
    }
    if (preflight.codexSystemSkillsRoot?.exists && typeof preflight.codexSystemSkillsRoot.mtimeMs === "number") {
        const time = new Date(preflight.codexSystemSkillsRoot.mtimeMs);
        utimesSync(realCodexSystemSkillsRoot, time, time);
    }
    return restored;
}

function captureCodexBrowserPreflight() {
    return {
        generatedAt: new Date().toISOString(),
        protectedPaths: protectedPaths.map(readCodexBrowserPathState),
        codexSystemSkillsRoot: readCodexBrowserPathState(realCodexSystemSkillsRoot),
        codexSystemSkillsTree: readCodexBrowserTreeState(realCodexSystemSkillsRoot),
        repoStatusShort: readCodexBrowserRepoStatus()
    };
}

function captureCodexBrowserPostflight(preflight) {
    const postflight = {
        generatedAt: new Date().toISOString(),
        protectedPaths: protectedPaths.map(readCodexBrowserPathState),
        codexSystemSkillsTree: readCodexBrowserTreeState(realCodexSystemSkillsRoot),
        repoStatusShort: readCodexBrowserRepoStatus()
    };
    postflight.protectedPathDiffs = postflight.protectedPaths
        .map((after, index) => ({ before: preflight.protectedPaths[index], after }))
        .filter(({ before, after }) => !isSamePathState(before, after));
    postflight.codexSystemSkillsTreeChanged = !isSameTreeState(preflight.codexSystemSkillsTree, postflight.codexSystemSkillsTree);
    postflight.repoStatusChanged = preflight.repoStatusShort !== postflight.repoStatusShort;
    postflight.status = postflight.protectedPathDiffs.length === 0 && !postflight.codexSystemSkillsTreeChanged && !postflight.repoStatusChanged ? "pass" : "fail";
    return postflight;
}

function readCodexBrowserPathState(path) {
    try {
        const stat = statSync(path);
        return {
            path,
            exists: true,
            mtimeMs: stat.mtimeMs,
            size: stat.size,
            mode: stat.mode,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile()
        };
    }
    catch (error) {
        if (error?.code === "ENOENT")
            return { path, exists: false };
        return { path, exists: false, error: String(error) };
    }
}

function isSamePathState(left, right) {
    if (left.exists !== right.exists)
        return false;
    if (!left.exists && !right.exists)
        return true;
    return Math.abs(left.mtimeMs - right.mtimeMs) < 2
        && left.size === right.size
        && left.mode === right.mode
        && left.isDirectory === right.isDirectory
        && left.isFile === right.isFile;
}

function readCodexBrowserTreeState(root) {
    const rootState = readCodexBrowserPathState(root);
    if (!rootState.exists || !rootState.isDirectory) {
        return {
            root,
            exists: rootState.exists,
            rootState,
            entries: []
        };
    }
    const entries = [];
    walkCodexBrowserTreeState(root, root, entries);
    entries.sort((left, right) => left.rel.localeCompare(right.rel));
    return {
        root,
        exists: true,
        rootState,
        entries
    };
}

function walkCodexBrowserTreeState(root, current, entries) {
    for (const name of readdirSync(current).sort()) {
        const path = join(current, name);
        const stat = lstatSync(path);
        const entry = {
            rel: path.slice(root.length + 1),
            mtimeMs: stat.mtimeMs,
            size: stat.size,
            mode: stat.mode,
            type: stat.isDirectory() ? "directory" : stat.isFile() ? "file" : stat.isSymbolicLink() ? "symlink" : "other"
        };
        if (stat.isFile()) {
            entry.sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
        }
        entries.push(entry);
        if (stat.isDirectory()) {
            walkCodexBrowserTreeState(root, path, entries);
        }
    }
}

function isSameTreeState(left, right) {
    if (!left || !right)
        return false;
    if (left.exists !== right.exists)
        return false;
    if (!left.exists && !right.exists)
        return true;
    if (!isSamePathState(left.rootState, right.rootState))
        return false;
    if (left.entries.length !== right.entries.length)
        return false;
    return left.entries.every((leftEntry, index) => isSameTreeEntry(leftEntry, right.entries[index]));
}

function isSameTreeEntry(left, right) {
    return left.rel === right.rel
        && left.type === right.type
        && Math.abs(left.mtimeMs - right.mtimeMs) < 2
        && left.size === right.size
        && left.mode === right.mode
        && left.sha256 === right.sha256;
}

function restoreCodexBrowserTreeTimes(root, tree) {
    if (!tree?.exists)
        return;
    const deepestFirst = [...tree.entries].sort((left, right) => pathDepth(right.rel) - pathDepth(left.rel));
    for (const entry of deepestFirst) {
        const path = join(root, entry.rel);
        if (!existsSync(path))
            continue;
        const time = new Date(entry.mtimeMs);
        utimesSync(path, time, time);
    }
    if (existsSync(root) && typeof tree.rootState?.mtimeMs === "number") {
        const time = new Date(tree.rootState.mtimeMs);
        utimesSync(root, time, time);
    }
}

function pathDepth(path) {
    return path.split("/").length;
}

function readCodexBrowserRepoStatus() {
    const result = spawnSync("git", ["status", "--short"], { cwd: repoRoot, encoding: "utf8" });
    return result.status === 0 ? result.stdout : `ERROR ${result.status}: ${result.stderr}`;
}

function prepareCodexBrowserPackage() {
    // The real package is staged by apm-package-prepare after workspace setup.
}

function prepareCodexBrowserApp() {
    writeFileSync(join(appRoot, "README.md"), "# product browser core smoke app\n");
    writeFileSync(join(appRoot, "apm.yml"), `name: product-browser-core-smoke
version: 0.0.0
target: codex

dependencies:
  apm: []
  mcp: []

devDependencies:
  apm: []
  mcp: []
`);
}

function prepareBrowserFixture() {
    writeFileSync(join(fixtureRoot, "index.html"), `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Product Browser Core Fixture</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #172026; background: #f6f7f9; }
    main { max-width: 960px; margin: 0 auto; background: #fff; border: 1px solid #d8dee4; padding: 24px; border-radius: 8px; }
    label { display: block; margin: 12px 0 4px; font-weight: 700; }
    input, select, button { font: inherit; padding: 10px 12px; border: 1px solid #9aa4af; border-radius: 6px; }
    button { background: #0f766e; color: white; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #d8dee4; padding: 10px; text-align: left; }
    .success { display: none; margin-top: 16px; padding: 12px; border: 1px solid #16a34a; background: #ecfdf5; color: #14532d; border-radius: 6px; }
    .success[data-visible="true"] { display: block; }
  </style>
</head>
<body>
  <main>
    <h1>欠勤対応 QA Fixture</h1>
    <p id="status">API確認待ち</p>
    <form id="absence-form">
      <label for="store">店舗</label>
      <select id="store" name="store">
        <option>渋谷店</option>
        <option>池袋店</option>
      </select>
      <label for="employee">欠勤者</label>
      <input id="employee" name="employee" value="佐藤" autocomplete="off">
      <label for="shift">対象シフト</label>
      <input id="shift" name="shift" value="金曜 17:00-21:00" autocomplete="off">
      <button id="submit-absence" type="submit">代替候補を確認</button>
    </form>
    <div class="success" id="success-state" role="status">代替候補を提示しました</div>
    <table aria-label="代替候補">
      <thead><tr><th>候補</th><th>スキル</th><th>労務リスク</th></tr></thead>
      <tbody>
        <tr><td>田中</td><td>レジ / 閉店</td><td>低</td></tr>
        <tr><td>鈴木</td><td>品出し / 応援可</td><td>中</td></tr>
      </tbody>
    </table>
  </main>
  <script>
    console.log("fixture-console-ready");
    fetch("/api/status").then((response) => response.json()).then((data) => {
      document.getElementById("status").textContent = data.message;
      console.log("fixture-network-ok", data.message);
    });
    document.getElementById("absence-form").addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("success-state").dataset.visible = "true";
      console.log("fixture-form-submitted");
    });
  </script>
</body>
</html>
`);
    writeFileSync(join(fixtureRoot, "server.cjs"), `const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "index.html"));
const server = http.createServer((request, response) => {
  if (request.url === "/api/status") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, message: "API確認済み" }));
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  console.log(JSON.stringify({ url: "http://127.0.0.1:" + address.port + "/" }));
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
`);
}

function startBrowserFixtureServer() {
    return new Promise((resolvePromise, rejectPromise) => {
        const proc = spawn("node", [join(fixtureRoot, "server.cjs")], {
            cwd: fixtureRoot,
            stdio: ["ignore", "pipe", "pipe"]
        });
        let stderr = "";
        proc.stderr.setEncoding("utf8");
        proc.stderr.on("data", (chunk) => {
            stderr += chunk;
        });
        proc.stdout.setEncoding("utf8");
        proc.stdout.once("data", (chunk) => {
            try {
                const payload = JSON.parse(chunk.trim());
                resolvePromise({
                    url: payload.url,
                    stop: () => proc.kill("SIGTERM")
                });
            }
            catch (error) {
                rejectPromise(new Error(`failed to parse fixture server output: ${chunk}\n${stderr}\n${error}`));
            }
        });
        proc.on("error", rejectPromise);
        proc.on("exit", (code) => {
            if (code !== 0)
                rejectPromise(new Error(`fixture server exited before ready: ${code}\n${stderr}`));
        });
    });
}

function buildBrowserRunnerPrompt(url) {
    return [
        "product-browser-runner を明示的に使用してください。",
        `この評価では /tmp の fixture URL ${url} に対する read-only browser evidence 取得を承認します。`,
        "official agent-browser で open, snapshot, screenshot, console, network を実行してください。",
        "成果物はこの app の .product-build-stacks/artifacts/browser 配下に保存してください。",
        "auth、cookie import、deploy、外部サービス write は禁止です。",
        "browser を実行していない場合は executed と書かないでください。",
        "最終出力には findings, decisions, evidence, residual risk, next handoff, browser_activation を含めてください。",
        "browser_activation は executed | blocked | report_only | not_applicable の単一値にしてください。"
    ].join("\n");
}

function buildBrowserQaPrompt(url) {
    return [
        "product-browser-qa を明示的に使用してください。",
        `この評価では /tmp の fixture URL ${url} に対するフォーム入力とクリック操作を承認します。`,
        "official agent-browser でページを開き、snapshot/screenshot/console/network evidence を取り、欠勤フォームを送信して success state を確認してください。",
        "成果物はこの app の .product-build-stacks/artifacts/browser 配下に保存してください。",
        "auth、cookie import、deploy、外部サービス write は禁止です。",
        "browser を実行していない場合は executed と書かないでください。",
        "最終出力には findings, decisions, evidence, residual risk, next handoff, browser_activation を含めてください。",
        "browser_activation は executed | blocked | report_only | not_applicable の単一値にしてください。"
    ].join("\n");
}

async function runCodexBrowserSkill(skillName, prompt) {
    const runDir = join(resultsRoot, skillName);
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, "prompt.txt"), prompt);
    const finalPath = join(runDir, "final.md");
    const eventsPath = join(runDir, "events.jsonl");
    const stderrPath = join(runDir, "stderr.log");
    const command = [
        "codex",
        "exec",
        "-m",
        codexModel,
        "-c",
        `model_reasoning_effort="${codexReasoning}"`,
        "-c",
        "approval_policy=\"never\"",
        "-s",
        "danger-full-access",
        "--skip-git-repo-check",
        "--ephemeral",
        "--ignore-rules",
        "--ignore-user-config",
        ...codexIsolationConfigArgs,
        "--json",
        "-C",
        appRoot,
        "-o",
        finalPath,
        prompt
    ];
    const result = await runCodexBrowserCommandAsync(command, appRoot, eventsPath, stderrPath, {
        timeoutMs: codexTimeoutMs,
        extraEnv: {
            CODEX_HOME: fakeCodexHome,
            HOME: fakeHome,
            EVAL_EVIDENCE_DIR: join(appRoot, ".product-build-stacks", "artifacts", "browser"),
            AGENT_BROWSER_SOCKET_DIR: agentBrowserSocketDir
        }
    });
    const finalText = existsSync(finalPath) ? readFileSync(finalPath, "utf8") : "";
    const activation = parseBrowserActivation(finalText);
    const evidenceFiles = collectCodexBrowserFiles(join(appRoot, ".product-build-stacks", "artifacts", "browser"));
    const summary = {
        skillName,
        command,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        finalPath,
        eventsPath,
        stderrPath,
        browserActivation: activation,
        evidenceFiles,
        finalTextHash: createHash("sha256").update(finalText).digest("hex")
    };
    writeFileSync(join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    return summary;
}

function runCodexBrowserCommand(command, cwd, logName) {
    const result = spawnSync(command[0], command.slice(1), {
        cwd,
        encoding: "utf8",
        env: process.env
    });
    writeFileSync(join(resultsRoot, logName), renderCodexBrowserCommandLog(command, result.stdout ?? "", result.stderr ?? "", result.status ?? 1));
    if (result.status !== 0)
        throw new Error(`${command.join(" ")} failed; see ${join(resultsRoot, logName)}`);
}

function runCodexBrowserCommandAsync(command, cwd, eventsPath, stderrPath, options) {
    return new Promise((resolvePromise) => {
        const child = spawn(command[0], command.slice(1), {
            cwd,
            env: {
                ...process.env,
                ...options.extraEnv
            },
            stdio: ["ignore", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
            setTimeout(() => child.kill("SIGKILL"), 5000).unref();
        }, options.timeoutMs);
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
            stdout += chunk;
        });
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
        });
        child.on("close", (code) => {
            clearTimeout(timer);
            mkdirSync(dirname(eventsPath), { recursive: true });
            writeFileSync(eventsPath, stdout);
            writeFileSync(stderrPath, stderr);
            resolvePromise({
                exitCode: timedOut ? 124 : code ?? 1,
                timedOut
            });
        });
    });
}

function renderCodexBrowserCommandLog(command, stdout, stderr, exitCode) {
    return [
        `$ ${command.map(shellQuoteCodexBrowserArg).join(" ")}`,
        "",
        "## stdout",
        stdout,
        "## stderr",
        stderr,
        `## exitCode\n${exitCode}`
    ].join("\n");
}

function parseBrowserActivation(text) {
    for (const pattern of [
        /browser_activation\s*:\s*`?(executed|blocked|report_only|not_applicable)`?/i,
        /browser_activation\s*\*{0,2}\s*\n\s*`?(executed|blocked|report_only|not_applicable)`?/i
    ]) {
        const match = text.match(pattern);
        if (match?.[1])
            return match[1].toLowerCase();
    }
    return "missing";
}

function collectCodexBrowserFiles(root) {
    const files = [];
    if (!existsSync(root))
        return files;
    walkCodexBrowserFiles(root, root, files);
    return files.sort();
}

function walkCodexBrowserFiles(root, current, files) {
    for (const entry of spawnSync("find", [current, "-maxdepth", "1", "-mindepth", "1"], { encoding: "utf8" }).stdout.split("\n").filter(Boolean)) {
        const stat = statSync(entry);
        if (stat.isDirectory()) {
            walkCodexBrowserFiles(root, entry, files);
        }
        else if (stat.isFile()) {
            files.push(entry.slice(root.length + 1));
        }
    }
}

function buildCodexBrowserSummary({ preflight, postflight, runs, fixtureUrl, restoredSystemSkills }) {
    const runFailures = [];
    for (const run of runs) {
        if (run.exitCode !== 0)
            runFailures.push(`${run.skillName}: codex exec exited ${run.exitCode}`);
        if (run.browserActivation !== "executed")
            runFailures.push(`${run.skillName}: browser_activation is ${run.browserActivation}, expected executed`);
        if (run.evidenceFiles.length === 0)
            runFailures.push(`${run.skillName}: no browser evidence files under app .product-build-stacks/artifacts/browser`);
    }
    const failures = [
        ...runFailures,
        ...(postflight.codexSystemSkillsTreeChanged ? ["real Codex system skills tree changed during danger-full-access browser smoke"] : []),
        ...(postflight.status === "pass" ? [] : ["protected path or repo status changed during danger-full-access browser smoke"])
    ];
    return {
        status: failures.length === 0 ? "pass" : "fail",
        runRoot,
        fixtureUrl,
        restoredSystemSkills,
        failures,
        preflight,
        postflight,
        runs
    };
}

function writeCodexBrowserReports(summary) {
    writeFileSync(join(reportsRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    writeFileSync(join(reportsRoot, "browser-core-summary.md"), [
        "# Codex Browser Core Smoke",
        "",
        `Status: **${summary.status}**`,
        "",
        `Run root: \`${runRoot}\``,
        `Fixture URL: \`${summary.fixtureUrl}\``,
        `Sandbox for browser runs: \`danger-full-access\``,
        `Model: \`${codexModel}\``,
        `Reasoning: \`${codexReasoning}\``,
        `Restored real Codex system skills snapshot: \`${summary.restoredSystemSkills}\``,
        "",
        "## Runs",
        "",
        "| Skill | Exit | browser_activation | Evidence files |",
        "| --- | --- | --- | --- |",
        ...summary.runs.map((run) => `| ${run.skillName} | ${run.exitCode} | ${run.browserActivation} | ${run.evidenceFiles.length} |`),
        "",
        "## Failures",
        "",
        summary.failures.length ? summary.failures.map((failure) => `- ${failure}`).join("\n") : "None.",
        "",
        "## Environment Hygiene",
        "",
        `Postflight: **${summary.postflight.status}**`,
        `Codex system skills tree changed: **${summary.postflight.codexSystemSkillsTreeChanged ? "yes" : "no"}**`,
        "",
        "| Path | Changed |",
        "| --- | --- |",
        ...summary.postflight.protectedPaths.map((state) => {
            const changed = summary.postflight.protectedPathDiffs.some((diff) => diff.after.path === state.path);
            return `| ${state.path} | ${changed ? "yes" : "no"} |`;
        })
    ].join("\n"));
}

function shellQuoteCodexBrowserArg(value) {
    if (/^[A-Za-z0-9_./:=@-]+$/.test(value))
        return value;
    return `'${value.replaceAll("'", "'\\''")}'`;
}
