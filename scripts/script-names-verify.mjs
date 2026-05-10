import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const scriptNamingFailures = [];
const scriptRoot = "scripts";
const scriptRules = [
    {
        file: "apm-installed-skills-sync.mjs",
        target: "installed skill folders",
        operation: "sync",
        purpose: "Compare or sync checked-in skill folders with a fresh `apm install --target all` result.",
        legacyNames: ["apm-installed-host-skill-outputs-sync.mjs", legacyName("apm", "skill-outputs-sync"), legacyName("apm", "generated-sync")]
    },
    {
        file: "apm-source-skills-verify.mjs",
        target: "source `.apm/skills/*/SKILL.md` files",
        operation: "verify",
        purpose: "Validate the APM skill list against source skill frontmatter, titles, and product naming rules.",
        legacyNames: ["apm-source-skill-documents-verify.mjs", legacyName("skill", "sources-verify"), legacyName("apm", "skills-verify")]
    },
    {
        file: "apm-package-prepare.mjs",
        target: "local APM package",
        operation: "prepare",
        purpose: "Create a clean local package for install smoke tests.",
        legacyNames: ["apm-consumer-install-package-stage.mjs", legacyName("apm", "package-stage"), legacyName("apm", "consumer-package-stage")]
    },
    {
        file: "apm-skill-install-smoke.mjs",
        target: "skill folders installed by APM",
        operation: "smoke",
        purpose: "Install the local package into a temporary app and verify deployed skill roots.",
        legacyNames: ["apm-consumer-skill-install-smoke.mjs", legacyName("apm", "consumer-smoke"), legacyName("apm", "consumer-install-smoke")]
    },
    {
        file: "apm-package-verify.mjs",
        target: "APM package",
        operation: "verify",
        purpose: "Verify package shape, browser policy docs, stale runtime references, script names, and install behavior.",
        legacyNames: ["apm-distribution-package-contract-verify.mjs", legacyName("apm", "package-contract-verify")]
    },
    {
        file: "agent-browser-smoke.mjs",
        target: "official `agent-browser`",
        operation: "smoke",
        purpose: "Run a live localhost open/snapshot/screenshot/close smoke and verify a concrete screenshot artifact.",
        legacyNames: ["agent-browser-localhost-fixture-smoke.mjs", legacyName("browser", "live-smoke")]
    },
    {
        file: "codex-skill-activation-smoke.mjs",
        target: "Codex skill activation",
        operation: "smoke",
        purpose: "Install the local package into a temporary Codex app and verify skill discovery/activation.",
        legacyNames: ["skill-activation-smoke.mjs", "codex-skill-discovery-activation-smoke.mjs", legacyName("codex", "e2e"), legacyName("codex", "skills-smoke")]
    },
    {
        file: "codex-browser-core-smoke.mjs",
        target: "Codex browser core",
        operation: "smoke",
        purpose: "Run product browser skills against a local fixture through isolated Codex danger-full-access browser runs.",
        legacyNames: ["codex-browser-smoke.mjs", "browser-core-codex-smoke.mjs", legacyName("codex", "browser-smoke")]
    },
    {
        file: "script-names-verify.mjs",
        target: "script names",
        operation: "verify",
        purpose: "Enforce this file naming rule and block stale script names.",
        legacyNames: ["script-inventory-naming-check.mjs", legacyName("script", "names-check"), legacyName("script", "naming-check"), "scripts/repo/check-script-naming.mjs"]
    },
    {
        file: "apm-skill-list.mjs",
        target: "APM skill list",
        operation: "module",
        purpose: "Export skill metadata and name validation.",
        legacyNames: ["product-skill-catalog.mjs", legacyName("product", "skills")]
    },
    {
        file: "release-verify.mjs",
        target: "release gate",
        operation: "verify",
        purpose: "Run the full release gate command list.",
        legacyNames: ["release-readiness-check.mjs", legacyName("release", "check")]
    },
    {
        file: "repo-secret-scan.mjs",
        target: "repository secret exposure",
        operation: "scan",
        purpose: "Scan working tree and git history for secrets or private paths.",
        legacyNames: ["repository-secret-exposure-scan.mjs", "scripts/secret-scan.mjs"]
    }
];
const operationPattern = buildOperationPattern(scriptRules);
const genericFunctionPattern = /^\s*(?:async\s+)?function\s+(main|run|check|assert|write|parse)\s*\(/;
checkScriptNamingDoc();
checkFlatScriptNames();
checkNoLegacyScriptReferences();
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
function checkNoLegacyScriptReferences() {
    const legacyNames = [
        "scripts/apm/check-compliance.mjs",
        "scripts/apm/check-skills.mjs",
        "scripts/apm/generate-skills.mjs",
        "scripts/apm/stage-package.mjs",
        "scripts/browser/smoke-live.mjs",
        "scripts/codex/smoke-skills.mjs",
        "scripts/product/skill-catalog.mjs",
        "scripts/repo/check-script-naming.mjs",
        "scripts/secret-scan.mjs",
        legacyName("host", "skills-generate"),
        legacyName("gen", "skill-docs"),
        legacyName("skill", "check"),
        legacyName("apm", "compliance-check"),
        legacyName("stage", "apm-package"),
        legacyName("parity", "check"),
        ...scriptRules.flatMap((rule) => rule.legacyNames ?? [])
    ];
    const files = [
        "README.md",
        "PLAN.md",
        "apm.yml",
        "package.json",
        ".github/workflows/apm-verify.yml",
        ...collectFiles("docs", (path) => /\.(md|json|ya?ml)$/.test(path)),
        ...collectFiles(".apm", (path) => /\.(md|tmpl|mjs|ts|json|ya?ml)$/.test(path)),
        ...collectFiles("tests", (path) => /\.(mjs|ts|md)$/.test(path)),
        ...collectFiles("scripts", (path) => path.endsWith(".mjs") && !path.endsWith("script-names-verify.mjs"))
    ];
    for (const file of files) {
        if (!existsSync(file))
            continue;
        const body = readFileSync(file, "utf8");
        for (const legacy of unique(legacyNames)) {
            reportLegacyScriptMatches(file, body, legacy, `contains legacy script name: ${legacy}`);
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
function reportLineMatches(file, body, needle, message) {
    const lines = body.split("\n");
    for (let index = 0; index < lines.length; index++) {
        if (lines[index].includes(needle))
            scriptNamingFailures.push(`${file}:${index + 1} ${message}`);
    }
}
function reportLegacyScriptMatches(file, body, scriptName, message) {
    const lines = body.split("\n");
    const pattern = scriptName.includes("/")
        ? new RegExp(escapeRegExp(scriptName), "g")
        : new RegExp(`(^|[^A-Za-z0-9-])${escapeRegExp(scriptName)}([^A-Za-z0-9-]|$)`, "g");
    for (let index = 0; index < lines.length; index++) {
        pattern.lastIndex = 0;
        if (pattern.test(lines[index]))
            scriptNamingFailures.push(`${file}:${index + 1} ${message}`);
    }
}
function buildOperationPattern(rules) {
    const operations = unique(rules.map((rule) => rule.operation).filter((operation) => operation !== "module")).sort();
    return new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-(${operations.join("|")})\\.mjs$`);
}
function unique(values) {
    return [...new Set(values)];
}
function legacyName(prefix, suffix) {
    return `${prefix}-${suffix}.mjs`;
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
