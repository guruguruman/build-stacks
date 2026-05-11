import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const apmPackageFailures = [];
const publicPackageScripts = {
    build: "node scripts/apm-installed-skills-sync.mjs --write",
    "generated:verify": "node scripts/apm-installed-skills-sync.mjs --verify",
    "browser:doctor": "agent-browser --version",
    "browser:smoke": "node scripts/agent-browser-smoke.mjs",
    "skill:verify": "node scripts/apm-source-skills-verify.mjs",
    "apm:verify": "node scripts/apm-package-verify.mjs",
    "smoke:codex": "node scripts/apm-skill-install-smoke.mjs --target codex",
    "smoke:all": "node scripts/apm-skill-install-smoke.mjs --target all",
    "release:verify": "node scripts/release-verify.mjs",
    test: "node --test"
};
const installedSkillRoots = [
    ".agents/skills",
    ".claude/skills",
    ".cursor/skills",
    ".github/skills",
    ".opencode/skills"
];
checkNoRootSkillBundle();
checkNoForbiddenPackageRoots();
checkManifestShape();
verifyBrowserRunnerSkillPolicy();
checkReadmeConsumerInstallGuidance();
verifyPublicPackageScripts();
verifySourceSkillDocuments();
verifyScriptNamingRules();
verifyApmLockfileDeployedFiles();
checkBrowserPolicyReferences();
checkBrowserSkillSessionSetup();
verifyPreparedPackageInstall();
if (apmPackageFailures.length > 0) {
    console.error(apmPackageFailures.join("\n"));
    process.exit(1);
}
console.log("apm package verify ok");
function checkNoRootSkillBundle() {
    for (const path of ["SKILL.md", "SKILL.md.tmpl"]) {
        if (existsSync(path)) {
            apmPackageFailures.push(`root ${path} must not exist; it makes APM install this repo as one skill bundle`);
        }
    }
}
function checkNoForbiddenPackageRoots() {
    const forbiddenPaths = [
        "browser",
        "tests/browser",
        "bin/product-browser",
        "bin/product-config",
        "bin/product-ledger",
        "bin/product-review-log"
    ];
    for (const path of forbiddenPaths) {
        if (existsSync(path))
            apmPackageFailures.push(`public package must not include repository runtime path: ${path}`);
    }
}
function checkManifestShape() {
    const apmBody = readFileSync("apm.yml", "utf8");
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    if (!apmBody.includes("version: 1.0.0"))
        apmPackageFailures.push("apm.yml must declare version: 1.0.0");
    if (!apmBody.includes("target: all"))
        apmPackageFailures.push("apm.yml must declare target: all");
    if (packageJson.version !== "1.0.0")
        apmPackageFailures.push("package.json version must be 1.0.0");
    for (const forbidden of ["type: hybrid", "includes:"]) {
        reportLineMatches("apm.yml", apmBody, forbidden, `contains unsupported manifest field: ${forbidden}`);
    }
}
function verifyBrowserRunnerSkillPolicy() {
    const path = ".apm/skills/product-browser-runner/SKILL.md";
    if (!existsSync(path)) {
        apmPackageFailures.push(`missing ${path}`);
        return;
    }
    const body = readFileSync(path, "utf8");
    for (const phrase of [
        "official `agent-browser`",
        "`product-browser-runner` is a Skill and policy layer",
        "command -v agent-browser",
        "agent-browser --version",
        "_ABR_RUN_ID=\"$(printf '%s' \"${AGENT_BROWSER_RUN_ID:-local}\" | cksum | awk '{print $1}')\"",
        "_ABR_SESSION=\"ps-${_ABR_REPO_ID}-${_ABR_RUN_ID}\"",
        "Do not use `--session-name` for public work",
        "PRODUCT_BROWSER_EVIDENCE_DIR=\"${EVAL_EVIDENCE_DIR:-.product-build-stacks/artifacts/browser}\"",
        "AGENT_BROWSER_SOCKET_DIR=\"${PRODUCT_BROWSER_SOCKET_DIR:-/tmp/agent-browser-${_ABR_REPO_ID}}\"",
        "mkdir -p \"$AGENT_BROWSER_SOCKET_DIR\"",
        "export AGENT_BROWSER_SOCKET_DIR",
        "agent-browser --json --content-boundaries --screenshot-dir \"$PRODUCT_BROWSER_EVIDENCE_DIR/screenshots\" --session \"$_ABR_SESSION\" open <url>",
        "agent-browser --json --content-boundaries --session \"$_ABR_SESSION\" snapshot -i",
        "agent-browser --json --screenshot-dir \"$PRODUCT_BROWSER_EVIDENCE_DIR/screenshots\" --session \"$_ABR_SESSION\" screenshot",
        "agent-browser --json --session \"$_ABR_SESSION\" console",
        "agent-browser --json --session \"$_ABR_SESSION\" errors",
        "agent-browser --json --session \"$_ABR_SESSION\" network requests",
        "agent-browser --json --session \"$_ABR_SESSION\" close",
        "do not ask for a separate approval",
        "browser_activation: executed | blocked | report_only | not_applicable",
        "Product Browser Posture",
        "product-browser-auth",
        "untrusted",
        "\"source\": \"agent-browser\"",
        "\"trusted\": false"
    ]) {
        if (!body.includes(phrase))
            apmPackageFailures.push(`${path} missing policy phrase: ${phrase}`);
    }
    for (const forbidden of ["agent-browser-runner", "@your-org/agent-browser-runner", "Do not call `agent-browser` directly"]) {
        reportLineMatches(path, body, forbidden, `contains stale browser runtime policy: ${forbidden}`);
    }
}
function checkReadmeConsumerInstallGuidance() {
    const file = "README.md";
    if (!existsSync(file)) {
        apmPackageFailures.push(`missing ${file}`);
        return;
    }
    const body = readFileSync(file, "utf8");
    for (const phrase of [
        "brew install agent-browser",
        "npm i -g agent-browser",
        "agent-browser --version",
        "agent-browser install",
        "apm install guruguruman/product-build-stacks#v1.0.0 --target all",
        "Commit `apm.yml` and `apm.lock.yaml`",
        ".product-build-stacks/",
        "apm audit --ci",
        "apm compile --validate --local-only",
        "product-browser-runner",
        "Use official `agent-browser`; do not rely on repository-local browser runtime directories in consumer repos"
    ]) {
        if (!body.includes(phrase))
            apmPackageFailures.push(`${file} missing README install instruction: ${phrase}`);
    }
    for (const forbidden of ["@your-org/agent-browser-runner", "pnpm agent-browser-runner", "Do not call `agent-browser` directly"]) {
        reportLineMatches(file, body, forbidden, `contains stale README browser instruction: ${forbidden}`);
    }
}
function verifyPublicPackageScripts() {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    verifyScriptSurface("package.json", packageJson.scripts ?? {});
    verifyScriptSurface("apm.yml", readApmYamlScripts());
    for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
        if (String(command).includes("browser/src")) {
            apmPackageFailures.push(`package.json script ${name} must not invoke root browser/src`);
        }
    }
}
function verifyScriptSurface(label, scripts) {
    for (const [name, command] of Object.entries(publicPackageScripts)) {
        if (scripts?.[name] !== command) {
            apmPackageFailures.push(`${label} script ${name} must be ${command}`);
        }
    }
    const scriptNames = Object.keys(scripts ?? {});
    const expectedNames = Object.keys(publicPackageScripts);
    if ([...scriptNames].sort().join(",") !== [...expectedNames].sort().join(",")) {
        apmPackageFailures.push(`${label} exposes unsupported APM-facing scripts: ${scriptNames.join(", ")}`);
    }
}
function readApmYamlScripts() {
    const body = readFileSync("apm.yml", "utf8");
    const scripts = {};
    const lines = body.split("\n");
    const start = lines.findIndex((line) => line.trim() === "scripts:");
    if (start === -1)
        return scripts;
    for (const line of lines.slice(start + 1)) {
        if (/^\S/.test(line))
            break;
        if (!line.trim())
            continue;
        const match = line.match(/^\s{2}([A-Za-z0-9:_-]+):\s*"([^"]*)"\s*$/);
        if (match)
            scripts[match[1]] = match[2];
    }
    return scripts;
}
function verifyScriptNamingRules() {
    runComplianceCommand(["node", "scripts/script-names-verify.mjs"], ".");
}
function verifySourceSkillDocuments() {
    runComplianceCommand(["node", "scripts/apm-source-skills-verify.mjs"], ".");
}
function verifyApmLockfileDeployedFiles() {
    const path = "apm.lock.yaml";
    const expected = collectInstalledSkillRoots().sort();
    if (!existsSync(path)) {
        if (expected.length === 0)
            return;
        apmPackageFailures.push(`missing ${path}`);
        return;
    }
    const actual = readLockLocalDeployedFiles(path).sort();
    if (actual.join("\n") !== expected.join("\n")) {
        apmPackageFailures.push(`${path} local_deployed_files must match current installed skill roots:\nexpected=${expected.join(",")}\nactual=${actual.join(",")}`);
    }
}
function collectInstalledSkillRoots() {
    const roots = [];
    for (const root of installedSkillRoots) {
        if (!existsSync(root))
            continue;
        for (const entry of readdirSync(root, { withFileTypes: true })) {
            if (entry.isDirectory() && existsSync(join(root, entry.name, "SKILL.md"))) {
                roots.push(join(root, entry.name));
            }
        }
    }
    return roots;
}
function readLockLocalDeployedFiles(path) {
    const lines = readFileSync(path, "utf8").split("\n");
    const start = lines.findIndex((line) => line.trim() === "local_deployed_files:");
    if (start === -1)
        return [];
    const values = [];
    for (const line of lines.slice(start + 1)) {
        if (!line.trim())
            continue;
        if (!line.startsWith("- "))
            break;
        values.push(line.slice(2).trim());
    }
    return values;
}
function checkBrowserPolicyReferences() {
    const files = [
        "AGENTS.md",
        "CLAUDE.md",
        "README.md",
        "apm.yml",
        "package.json",
        "docs/release-acceptance-scenarios.md",
        "docs/release-acceptance-skill-matrix.md",
        "CHANGELOG.md",
        ...collectFiles(".apm/skills", (file) => /\.(md|tmpl|mjs|ts)$/.test(file)),
        ...collectFiles("scripts", (file) => file.endsWith(".mjs") && !file.endsWith("scripts/apm-package-verify.mjs"))
    ];
    const forbidden = [
        "~/.claude/skills/product-stacks",
        ".product/",
        "type: hybrid",
        "@your-org/product-" + "browser-runner",
        "@your-org/agent-browser-runner",
        "../agent-browser-runner",
        "agent-browser-runner",
        "file://<path-to-finalized.html>",
        "\"mode\":\"cdp\"",
        "--mode action --approved",
        "Mode: headed",
        "Do not call `agent-browser` directly"
    ];
    for (const file of files) {
        if (!existsSync(file))
            continue;
        const body = readFileSync(file, "utf8");
        for (const needle of forbidden) {
            reportLineMatches(file, body, needle, `contains forbidden reference: ${needle}`);
        }
        reportRegexMatches(file, body, /\bagent-browser\s+(open|snapshot|screenshot|console|errors|network|tab|click|fill|press|select|scroll|wait|download|close|stream|session)\b[^\n]*--json\b/, "contains non-canonical agent-browser option order; global options must precede the command");
        reportRegexMatches(file, body, /\bagent-browser\b[^\n]*--session-name\b/, "contains persistent agent-browser session-name in public browser policy");
    }
}
function checkBrowserSkillSessionSetup() {
    const files = collectFiles(".apm/skills", (file) => /\.(md|tmpl)$/.test(file));
    for (const file of files) {
        const body = readFileSync(file, "utf8");
        if (body.includes("$_ABR_SESSION") && !body.includes("_ABR_ROOT=")) {
            apmPackageFailures.push(`${file} uses $_ABR_SESSION without repo/run scoped public session setup`);
        }
        if (body.includes("$_ABR_SESSION") && body.includes("agent-browser --json session")) {
            apmPackageFailures.push(`${file} checks the default agent-browser session instead of $_ABR_SESSION`);
        }
    }
}
function verifyPreparedPackageInstall() {
    const packageOut = "tmp/product-build-stacks-package";
    const consumerOut = "tmp/product-build-stacks-consumer";
    rmSync(packageOut, { recursive: true, force: true });
    rmSync(consumerOut, { recursive: true, force: true });
    runComplianceCommand(["node", "scripts/apm-package-prepare.mjs", "--out", packageOut], ".");
    verifyPreparedPackageShape(packageOut);
    runComplianceCommand(["mkdir", "-p", consumerOut], ".");
    runComplianceCommand(["apm", "init", "--yes"], consumerOut);
    runComplianceCommand(["apm", "install", "--target", "codex", "../product-build-stacks-package"], consumerOut);
    runComplianceCommand(["apm", "install", "--target", "all", "../product-build-stacks-package"], consumerOut);
    const rootBundleCandidates = [
        join(consumerOut, ".agents/skills/product-build-stacks-package"),
        join(consumerOut, ".agents/skills/product-stacks-package"),
        join(consumerOut, ".opencode/skills/product-build-stacks-package")
    ];
    for (const path of rootBundleCandidates) {
        if (existsSync(path))
            apmPackageFailures.push(`consumer install created forbidden root bundle: ${path}`);
    }
    const browserRunner = join(consumerOut, ".agents/skills/product-browser-runner/SKILL.md");
    if (!existsSync(browserRunner)) {
        apmPackageFailures.push(`consumer install did not deploy ${browserRunner}`);
    }
    else {
        const body = readFileSync(browserRunner, "utf8");
        if (!body.includes("official `agent-browser`")) {
            apmPackageFailures.push(`consumer install deployed ${browserRunner}, but it does not mention official agent-browser`);
        }
        if (body.includes("agent-browser-runner")) {
            apmPackageFailures.push(`consumer install deployed ${browserRunner}, but it still mentions agent-browser-runner`);
        }
    }
}
function verifyPreparedPackageShape(root) {
    const required = [
        ".apm",
        ".apmignore",
        "apm.yml",
        "README.md",
        "LICENSE",
        "CHANGELOG.md",
        "docs",
        "package.json",
        "package-lock.json",
        "scripts"
    ];
    const forbidden = [
        "SKILL.md",
        "SKILL.md.tmpl",
        "browser",
        "bin",
        "tests",
        "node_modules",
        "apm_modules",
        "tmp",
        ".product",
        ".product-build-stacks",
        ".agents",
        ".claude",
        ".cursor",
        ".github/skills",
        ".opencode"
    ];
    for (const path of required) {
        if (!existsSync(join(root, path)))
            apmPackageFailures.push(`prepared package missing required path: ${path}`);
    }
    for (const path of forbidden) {
        if (existsSync(join(root, path)))
            apmPackageFailures.push(`prepared package includes forbidden path: ${path}`);
    }
    const packagePath = join(root, "package.json");
    if (existsSync(packagePath)) {
        const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
        const scriptNames = Object.keys(packageJson.scripts ?? {});
        const expectedNames = Object.keys(publicPackageScripts);
        if (scriptNames.sort().join(",") !== expectedNames.sort().join(",")) {
            apmPackageFailures.push(`prepared package exposes unsafe scripts: ${scriptNames.join(", ")}`);
        }
    }
}
function runComplianceCommand(command, cwd) {
    const result = spawnSync(command[0], command.slice(1), {
        cwd,
        encoding: "utf8"
    });
    if (result.status !== 0) {
        apmPackageFailures.push([
            `command failed: ${command.join(" ")}`,
            `cwd: ${cwd}`,
            result.stdout.trim(),
            result.stderr.trim()
        ].filter(Boolean).join("\n"));
    }
}
function collectFiles(root, predicate) {
    const files = [];
    if (!existsSync(root))
        return files;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
        const path = join(root, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(path, predicate));
        }
        else if (predicate(path)) {
            files.push(path);
        }
    }
    return files;
}
function reportLineMatches(file, body, needle, message) {
    const lines = body.split("\n");
    for (let index = 0; index < lines.length; index++) {
        if (lines[index].includes(needle))
            apmPackageFailures.push(`${file}:${index + 1} ${message}`);
    }
}
function reportRegexMatches(file, body, pattern, message) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);
    const lines = body.split("\n");
    for (let index = 0; index < lines.length; index++) {
        regex.lastIndex = 0;
        if (regex.test(lines[index]))
            apmPackageFailures.push(`${file}:${index + 1} ${message}`);
    }
}
