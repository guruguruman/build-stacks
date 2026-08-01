import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const scriptNamingFailures = [];
const scriptRoot = "scripts";
const scriptRules = [
    {
        file: "apm-contract.mjs",
        target: "APM version, targets, and generated roots",
        operation: "module",
        purpose: "Export the pinned APM contract shared by generation, verification, and smoke scripts."
    },
    {
        file: "apm-installed-skills-sync.mjs",
        target: "installed skill folders",
        operation: "sync",
        purpose: "Compare or sync checked-in converged skill folders with a clean APM install."
    },
    {
        file: "apm-source-skills-verify.mjs",
        target: "source `.apm/skills/*/SKILL.md` files",
        operation: "verify",
        purpose: "Validate the APM skill list against source skill frontmatter, titles, and product naming rules."
    },
    {
        file: "apm-package-prepare.mjs",
        target: "local APM package",
        operation: "prepare",
        purpose: "Create a clean local package for install smoke tests."
    },
    {
        file: "apm-skill-install-smoke.mjs",
        target: "skill folders installed by APM",
        operation: "smoke",
        purpose: "Install the local package into a temporary app and verify deployed skill roots."
    },
    {
        file: "apm-package-verify.mjs",
        target: "APM package",
        operation: "verify",
        purpose: "Verify package shape, browser policy docs, script names, and install behavior."
    },
    {
        file: "agent-browser-smoke.mjs",
        target: "official `agent-browser`",
        operation: "smoke",
        purpose: "Run a live localhost open/snapshot/screenshot/close smoke and verify a concrete screenshot artifact."
    },
    {
        file: "codex-skill-activation-smoke.mjs",
        target: "Codex skill activation",
        operation: "smoke",
        purpose: "Install the local package into a temporary Codex app and verify skill discovery/activation."
    },
    {
        file: "codex-browser-core-smoke.mjs",
        target: "Codex browser core",
        operation: "smoke",
        purpose: "Run product browser skills against a local fixture through isolated Codex danger-full-access browser runs."
    },
    {
        file: "script-names-verify.mjs",
        target: "script names",
        operation: "verify",
        purpose: "Enforce this file naming rule."
    },
    {
        file: "apm-skill-list.mjs",
        target: "APM skill list",
        operation: "module",
        purpose: "Export skill metadata and name validation."
    },
    {
        file: "release-quality-verify.mjs",
        target: "release quality gate",
        operation: "verify",
        purpose: "Run the mandatory deterministic, install, browser, secret, and diff quality checks."
    },
    {
        file: "release-verify.mjs",
        target: "release gate",
        operation: "verify",
        purpose: "Run the default release gate command list; heavy Codex E2E smoke is opt-in."
    },
    {
        file: "repo-secret-scan.mjs",
        target: "repository secret exposure",
        operation: "scan",
        purpose: "Scan working tree and git history for secrets or private paths."
    },
    {
        file: "repo-whitespace-verify.mjs",
        target: "repository whitespace",
        operation: "verify",
        purpose: "Check unstaged, staged, and untracked files for Git whitespace errors."
    }
];
const operationPattern = buildOperationPattern(scriptRules);
const genericFunctionPattern = /^\s*(?:async\s+)?function\s+(main|run|check|assert|write|parse)\s*\(/;
checkScriptNamingDoc();
checkFlatScriptNames();
checkNoBareGenericFunctionNames();
if (scriptNamingFailures.length > 0) {
    console.error(scriptNamingFailures.join("\n"));
    process.exit(1);
}
console.log("script names verify ok");
function checkScriptNamingDoc() {
    const docPath = "docs/script-naming-convention.md";
    if (!existsSync(docPath)) {
        scriptNamingFailures.push(`missing script naming rules: ${docPath}`);
        return;
    }
    const body = readFileSync(docPath, "utf8");
    for (const phrase of ["<target-object>-<operation>.mjs", "run<UseCase>()"]) {
        if (!body.includes(phrase))
            scriptNamingFailures.push(`${docPath} missing naming rule phrase: ${phrase}`);
    }
    for (const rule of scriptRules) {
        const row = `| \`${rule.file}\` | ${rule.target} | ${rule.operation} | ${rule.purpose} |`;
        if (!body.includes(row))
            scriptNamingFailures.push(`${docPath} missing script rule row: ${rule.file}`);
    }
}
function checkFlatScriptNames() {
    if (!existsSync(scriptRoot)) {
        scriptNamingFailures.push(`missing script root: ${scriptRoot}`);
        return;
    }
    const expectedScriptNames = new Set(scriptRules.map((rule) => rule.file));
    const moduleScriptNames = new Set(scriptRules.filter((rule) => rule.operation === "module").map((rule) => rule.file));
    for (const entry of readdirSync(scriptRoot, { withFileTypes: true })) {
        const path = join(scriptRoot, entry.name);
        if (entry.isDirectory()) {
            scriptNamingFailures.push(`${path} must not exist; keep scripts flat`);
            continue;
        }
        if (!entry.isFile() || !entry.name.endsWith(".mjs"))
            continue;
        if (!expectedScriptNames.has(entry.name)) {
            scriptNamingFailures.push(`${path} is not in the allowed script list`);
        }
        if (!moduleScriptNames.has(entry.name) && !operationPattern.test(entry.name)) {
            scriptNamingFailures.push(`${path} must use <target-object>-<operation>.mjs naming`);
        }
    }
    for (const expected of expectedScriptNames) {
        if (!existsSync(join(scriptRoot, expected))) {
            scriptNamingFailures.push(`missing expected script: ${join(scriptRoot, expected)}`);
        }
    }
}
function checkNoBareGenericFunctionNames() {
    for (const file of collectFiles(scriptRoot, (path) => path.endsWith(".mjs"))) {
        const lines = readFileSync(file, "utf8").split("\n");
        for (let index = 0; index < lines.length; index++) {
            if (genericFunctionPattern.test(lines[index])) {
                scriptNamingFailures.push(`${file}:${index + 1} has a bare generic function name`);
            }
        }
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
function buildOperationPattern(rules) {
    const operations = unique(rules.map((rule) => rule.operation).filter((operation) => operation !== "module")).sort();
    return new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-(${operations.join("|")})\\.mjs$`);
}
function unique(values) {
    return [...new Set(values)];
}
