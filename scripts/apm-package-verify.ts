import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const apmPackageFailures: string[] = [];
const publicPackageScripts = {
  build: "bun run scripts/apm-installed-skills-sync.ts --write",
  "generated:verify": "bun run scripts/apm-installed-skills-sync.ts --verify",
  "browser:doctor": "agent-browser --version",
  "browser:smoke": "bun run scripts/agent-browser-smoke.ts",
  "skill:verify": "bun run scripts/apm-source-skills-verify.ts",
  "apm:verify": "bun run scripts/apm-package-verify.ts",
  "smoke:codex": "bun run scripts/apm-skill-install-smoke.ts --target codex",
  "smoke:all": "bun run scripts/apm-skill-install-smoke.ts --target all",
  "release:verify": "bun run scripts/release-verify.ts"
};

checkNoRootSkillBundle();
checkNoRootLegacyRuntime();
checkManifestShape();
verifyBrowserRunnerSkillPolicy();
checkReadmeConsumerInstallGuidance();
verifyPublicPackageScripts();
verifyScriptNamingRules();
checkNoForbiddenRuntimeReferences();
checkBrowserSkillSessionSetup();
verifyPreparedPackageInstall();
verifyReleaseLicenseCompleteness();

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

function checkNoRootLegacyRuntime() {
  const forbiddenPaths = [
    "browser",
    "tests/browser",
    "bin/product-browser",
    "bin/product-config",
    "bin/product-ledger",
    "bin/product-review-log"
  ];
  for (const path of forbiddenPaths) {
    if (existsSync(path)) apmPackageFailures.push(`legacy root runtime path must not exist: ${path}`);
  }
}

function checkManifestShape() {
  const apmBody = readFileSync("apm.yml", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  if (!apmBody.includes("version: 1.0.0")) apmPackageFailures.push("apm.yml must declare version: 1.0.0");
  if (!apmBody.includes("target: all")) apmPackageFailures.push("apm.yml must declare target: all");
  if (packageJson.version !== "1.0.0") apmPackageFailures.push("package.json version must be 1.0.0");
  for (const forbidden of ["type: hybrid", "includes:"]) {
    reportLineMatches("apm.yml", apmBody, forbidden, `contains obsolete manifest field: ${forbidden}`);
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
    "_ABR_SESSION=\"product-stacks-public-${_ABR_REPO_ID}-${AGENT_BROWSER_RUN_ID:-local}\"",
    "Do not use `--session-name` for public work",
    "agent-browser --json --content-boundaries --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session \"$_ABR_SESSION\" open <url>",
    "agent-browser --json --content-boundaries --session \"$_ABR_SESSION\" snapshot -i",
    "agent-browser --json --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session \"$_ABR_SESSION\" screenshot",
    "agent-browser --json --session \"$_ABR_SESSION\" console",
    "agent-browser --json --session \"$_ABR_SESSION\" errors",
    "agent-browser --json --session \"$_ABR_SESSION\" network requests",
    "agent-browser --json --session \"$_ABR_SESSION\" close",
    "explicit approval",
    "safe",
    "auth",
    "action",
    "admin",
    "untrusted",
    "\"source\": \"agent-browser\"",
    "\"trusted\": false"
  ]) {
    if (!body.includes(phrase)) apmPackageFailures.push(`${path} missing policy phrase: ${phrase}`);
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
    "Do not use stale root `browser/`, root `bin/`, or `bin/product-browser` runtime files"
  ]) {
    if (!body.includes(phrase)) apmPackageFailures.push(`${file} missing README install instruction: ${phrase}`);
  }
  for (const forbidden of ["@your-org/agent-browser-runner", "pnpm agent-browser-runner", "Do not call `agent-browser` directly"]) {
    reportLineMatches(file, body, forbidden, `contains stale README browser instruction: ${forbidden}`);
  }
}

function verifyPublicPackageScripts() {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  for (const [name, command] of Object.entries(publicPackageScripts)) {
    if (packageJson.scripts?.[name] !== command) {
      apmPackageFailures.push(`package.json script ${name} must be ${command}`);
    }
  }
  const scriptNames = Object.keys(packageJson.scripts ?? {});
  const expectedNames = Object.keys(publicPackageScripts);
  if (scriptNames.sort().join(",") !== expectedNames.sort().join(",")) {
    apmPackageFailures.push(`package.json exposes unsupported APM-facing scripts: ${scriptNames.join(", ")}`);
  }

  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    if (String(command).includes("browser/src")) {
      apmPackageFailures.push(`package.json script ${name} must not invoke root browser/src`);
    }
  }

  const apmBody = readFileSync("apm.yml", "utf8");
  for (const unsafe of ["parity:check", "fidelity:check", "gstack:port", "codex:e2e", "test:browser", "test:golden", "test:guards"]) {
    if (apmBody.includes(`${unsafe}:`)) apmPackageFailures.push(`apm.yml exposes unsupported APM-facing script: ${unsafe}`);
  }
}

function verifyScriptNamingRules() {
  runComplianceCommand(["bun", "run", "scripts/script-names-verify.ts"], ".");
}

function checkNoForbiddenRuntimeReferences() {
  const files = [
    "README.md",
    "apm.yml",
    "package.json",
    "docs/release-acceptance-scenarios.md",
    "docs/release-acceptance-skill-matrix.md",
    "CHANGELOG.md",
    "THIRD_PARTY_NOTICES.md",
    ...collectFiles(".apm/skills", (file) => /\.(md|tmpl|ts)$/.test(file)),
    ...collectFiles("scripts", (file) => file.endsWith(".ts") && !file.endsWith("scripts/apm-package-verify.ts"))
  ];
  const forbidden = [
    "~/.claude/skills/product-stacks",
    "~/.gstack",
    ".product/",
    "type: hybrid",
    "future runner-managed",
    "currently degraded",
    "intentionally degraded",
    "experimental",
    "browser/src/cli.ts",
    `browser/dist/${legacyBrowserCommandName()}`,
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
    if (!existsSync(file)) continue;
    const body = readFileSync(file, "utf8");
    for (const needle of forbidden) {
      reportLineMatches(file, body, needle, `contains forbidden reference: ${needle}`);
    }
    reportRegexMatches(
      file,
      body,
      new RegExp(`\\b${escapeRegExp(legacyBrowserCommandName())}\\s+`),
      "contains legacy browser CLI wording"
    );
    reportRegexMatches(
      file,
      body,
      /\bagent-browser\s+(open|snapshot|screenshot|console|errors|network|tab|click|fill|press|select|scroll|wait|download|close|stream|session)\b[^\n]*--json\b/,
      "contains non-canonical agent-browser option order; global options must precede the command"
    );
    reportRegexMatches(
      file,
      body,
      /\bagent-browser\b[^\n]*--session-name\b/,
      "contains persistent agent-browser session-name in public browser policy"
    );
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

  runComplianceCommand(["bun", "run", "scripts/apm-package-prepare.ts", "--out", packageOut], ".");
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
    if (existsSync(path)) apmPackageFailures.push(`consumer install created forbidden root bundle: ${path}`);
  }

  const browserRunner = join(consumerOut, ".agents/skills/product-browser-runner/SKILL.md");
  if (!existsSync(browserRunner)) {
    apmPackageFailures.push(`consumer install did not deploy ${browserRunner}`);
  } else {
    const body = readFileSync(browserRunner, "utf8");
    if (!body.includes("official `agent-browser`")) {
      apmPackageFailures.push(`consumer install deployed ${browserRunner}, but it does not mention official agent-browser`);
    }
    if (body.includes("agent-browser-runner")) {
      apmPackageFailures.push(`consumer install deployed ${browserRunner}, but it still mentions agent-browser-runner`);
    }
  }
}

function verifyPreparedPackageShape(root: string) {
  const required = [
    ".apm",
    ".apmignore",
    "apm.yml",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "CHANGELOG.md",
    "docs",
    "package.json",
    "tsconfig.json",
    "bun.lock",
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
    if (!existsSync(join(root, path))) apmPackageFailures.push(`prepared package missing required path: ${path}`);
  }

  for (const path of forbidden) {
    if (existsSync(join(root, path))) apmPackageFailures.push(`prepared package includes forbidden path: ${path}`);
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

  const apmPath = join(root, "apm.yml");
  if (existsSync(apmPath)) {
    const body = readFileSync(apmPath, "utf8");
    for (const unsafe of ["parity:check", "fidelity:check", "gstack:port", "codex:e2e", "test:browser", "test:golden", "test:guards"]) {
      if (body.includes(`${unsafe}:`)) apmPackageFailures.push(`prepared apm.yml exposes unsafe script: ${unsafe}`);
    }
  }
}

function verifyReleaseLicenseCompleteness() {
  runComplianceCommand(["bun", "run", "scripts/release-license-verify.ts"], ".");
}

function runComplianceCommand(command: string[], cwd: string) {
  const result = Bun.spawnSync(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  if (result.exitCode !== 0) {
    apmPackageFailures.push([
      `command failed: ${command.join(" ")}`,
      `cwd: ${cwd}`,
      result.stdout.toString().trim(),
      result.stderr.toString().trim()
    ].filter(Boolean).join("\n"));
  }
}

function collectFiles(root: string, predicate: (file: string) => boolean) {
  const files: string[] = [];
  if (!existsSync(root)) return files;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path, predicate));
    } else if (predicate(path)) {
      files.push(path);
    }
  }
  return files;
}

function reportLineMatches(file: string, body: string, needle: string, message: string) {
  const lines = body.split("\n");
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].includes(needle)) apmPackageFailures.push(`${file}:${index + 1} ${message}`);
  }
}

function reportRegexMatches(file: string, body: string, pattern: RegExp, message: string) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const lines = body.split("\n");
  for (let index = 0; index < lines.length; index++) {
    regex.lastIndex = 0;
    if (regex.test(lines[index])) apmPackageFailures.push(`${file}:${index + 1} ${message}`);
  }
}

function legacyBrowserCommandName() {
  return "product-" + "browser";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
