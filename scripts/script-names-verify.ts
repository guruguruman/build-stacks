import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type ScriptOperation = "audit" | "module" | "port" | "prepare" | "scan" | "smoke" | "sync" | "verify";

type ScriptRule = {
  file: string;
  target: string;
  operation: ScriptOperation;
  purpose: string;
  legacyNames?: string[];
};

const scriptNamingFailures: string[] = [];
const scriptRoot = "scripts";
const scriptRules: ScriptRule[] = [
  {
    file: "apm-installed-skills-sync.ts",
    target: "installed skill folders",
    operation: "sync",
    purpose: "Compare or sync checked-in skill folders with a fresh `apm install --target all` result.",
    legacyNames: ["apm-installed-host-skill-outputs-sync.ts", legacyName("apm", "skill-outputs-sync"), legacyName("apm", "generated-sync")]
  },
  {
    file: "apm-source-skills-verify.ts",
    target: "source `.apm/skills/*/SKILL.md` files",
    operation: "verify",
    purpose: "Validate the APM skill list against source skill frontmatter, titles, and adaptation metadata.",
    legacyNames: ["apm-source-skill-documents-verify.ts", legacyName("skill", "sources-verify"), legacyName("apm", "skills-verify")]
  },
  {
    file: "apm-package-prepare.ts",
    target: "local APM package",
    operation: "prepare",
    purpose: "Create a clean local package for install smoke tests.",
    legacyNames: ["apm-consumer-install-package-stage.ts", legacyName("apm", "package-stage"), legacyName("apm", "consumer-package-stage")]
  },
  {
    file: "apm-skill-install-smoke.ts",
    target: "skill folders installed by APM",
    operation: "smoke",
    purpose: "Install the local package into a temporary app and verify deployed skill roots.",
    legacyNames: ["apm-consumer-skill-install-smoke.ts", legacyName("apm", "consumer-smoke"), legacyName("apm", "consumer-install-smoke")]
  },
  {
    file: "apm-package-verify.ts",
    target: "APM package",
    operation: "verify",
    purpose: "Verify package shape, browser policy docs, stale runtime references, script names, and install behavior.",
    legacyNames: ["apm-distribution-package-contract-verify.ts", legacyName("apm", "package-contract-verify")]
  },
  {
    file: "agent-browser-smoke.ts",
    target: "official `agent-browser`",
    operation: "smoke",
    purpose: "Run a live localhost open/snapshot/screenshot/close smoke and verify a concrete screenshot artifact.",
    legacyNames: ["agent-browser-localhost-fixture-smoke.ts", legacyName("browser", "live-smoke")]
  },
  {
    file: "codex-skill-activation-smoke.ts",
    target: "Codex skill activation",
    operation: "smoke",
    purpose: "Install the local package into a temporary Codex app and verify skill discovery/activation.",
    legacyNames: ["skill-activation-smoke.ts", "codex-skill-discovery-activation-smoke.ts", legacyName("codex", "e2e"), legacyName("codex", "skills-smoke")]
  },
  {
    file: "gstack-skill-mapping-verify.ts",
    target: "gstack legacy skill mapping",
    operation: "verify",
    purpose: "Verify mapping coverage and usability docs.",
    legacyNames: ["gstack-product-skill-mapping-check.ts", legacyName("gstack", "mapping-check")]
  },
  {
    file: "gstack-fidelity-audit.ts",
    target: "product fidelity against upstream gstack",
    operation: "audit",
    purpose: "Fetch upstream gstack tree data and report adapted/partial fidelity.",
    legacyNames: ["gstack-product-fidelity-audit.ts", legacyName("gstack", "fidelity-check")]
  },
  {
    file: "gstack-skill-template-port.ts",
    target: "upstream gstack skill templates being ported to product skills",
    operation: "port",
    purpose: "Fetch upstream gstack skill templates and adapt them into `.apm/skills`.",
    legacyNames: ["gstack-skill-templates-to-product-port.ts", legacyName("gstack", "skill-templates-port"), legacyName("gstack", "skills-port"), legacyName("gstack", "port-skill")]
  },
  {
    file: "release-license-verify.ts",
    target: "release license files",
    operation: "verify",
    purpose: "Verify license files, release notes, and adaptation metadata license fields.",
    legacyNames: ["release-license-notices-verify.ts"]
  },
  {
    file: "script-names-verify.ts",
    target: "script names",
    operation: "verify",
    purpose: "Enforce this file naming rule and block stale script names.",
    legacyNames: ["script-inventory-naming-check.ts", legacyName("script", "names-check"), legacyName("script", "naming-check"), "scripts/repo/check-script-naming.ts"]
  },
  {
    file: "apm-skill-list.ts",
    target: "APM skill list",
    operation: "module",
    purpose: "Export skill metadata and name validation.",
    legacyNames: ["product-skill-catalog.ts", legacyName("product", "skills")]
  },
  {
    file: "release-verify.ts",
    target: "release gate",
    operation: "verify",
    purpose: "Run the full release gate command list.",
    legacyNames: ["release-readiness-check.ts", legacyName("release", "check")]
  },
  {
    file: "repo-secret-scan.ts",
    target: "repository secret exposure",
    operation: "scan",
    purpose: "Scan working tree and git history for secrets or private paths.",
    legacyNames: ["repository-secret-exposure-scan.ts", "scripts/secret-scan.ts"]
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
  for (const phrase of ["<target-object>-<operation>.ts", "run<UseCase>()"]) {
    if (!body.includes(phrase)) scriptNamingFailures.push(`${docPath} missing naming rule phrase: ${phrase}`);
  }
  for (const rule of scriptRules) {
    const row = `| \`${rule.file}\` | ${rule.target} | ${rule.operation} | ${rule.purpose} |`;
    if (!body.includes(row)) scriptNamingFailures.push(`${docPath} missing script rule row: ${rule.file}`);
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
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    if (!expectedScriptNames.has(entry.name)) {
      scriptNamingFailures.push(`${path} is not in the allowed script list`);
    }
    if (!moduleScriptNames.has(entry.name) && !operationPattern.test(entry.name)) {
      scriptNamingFailures.push(`${path} must use <target-object>-<operation>.ts naming`);
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
    "scripts/apm/check-compliance.ts",
    "scripts/apm/check-skills.ts",
    "scripts/apm/generate-skills.ts",
    "scripts/apm/stage-package.ts",
    "scripts/browser/smoke-live.ts",
    "scripts/codex/smoke-skills.ts",
    "scripts/gstack/audit-fidelity.ts",
    "scripts/gstack/check-mapping.ts",
    "scripts/gstack/port-skills.ts",
    "scripts/product/skill-catalog.ts",
    "scripts/repo/check-script-naming.ts",
    "scripts/secret-scan.ts",
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
    ...collectFiles(".apm", (path) => /\.(md|tmpl|ts|json|ya?ml)$/.test(path)),
    ...collectFiles("tests", (path) => /\.(ts|md)$/.test(path)),
    ...collectFiles("scripts", (path) => path.endsWith(".ts") && !path.endsWith("script-names-verify.ts"))
  ];

  for (const file of files) {
    if (!existsSync(file)) continue;
    const body = readFileSync(file, "utf8");
    for (const legacy of unique(legacyNames)) {
      reportLegacyScriptMatches(file, body, legacy, `contains legacy script name: ${legacy}`);
    }
  }
}

function checkNoBareGenericFunctionNames() {
  for (const file of collectFiles(scriptRoot, (path) => path.endsWith(".ts"))) {
    const lines = readFileSync(file, "utf8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      if (genericFunctionPattern.test(lines[index])) {
        scriptNamingFailures.push(`${file}:${index + 1} has a bare generic function name`);
      }
    }
  }
}

function collectFiles(root: string, predicate: (path: string) => boolean) {
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
    if (lines[index].includes(needle)) scriptNamingFailures.push(`${file}:${index + 1} ${message}`);
  }
}

function reportLegacyScriptMatches(file: string, body: string, scriptName: string, message: string) {
  const lines = body.split("\n");
  const pattern = scriptName.includes("/")
    ? new RegExp(escapeRegExp(scriptName), "g")
    : new RegExp(`(^|[^A-Za-z0-9-])${escapeRegExp(scriptName)}([^A-Za-z0-9-]|$)`, "g");
  for (let index = 0; index < lines.length; index++) {
    pattern.lastIndex = 0;
    if (pattern.test(lines[index])) scriptNamingFailures.push(`${file}:${index + 1} ${message}`);
  }
}

function buildOperationPattern(rules: ScriptRule[]) {
  const operations = unique(rules.map((rule) => rule.operation).filter((operation) => operation !== "module")).sort();
  return new RegExp(`^[a-z0-9]+(?:-[a-z0-9]+)*-(${operations.join("|")})\\.ts$`);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function legacyName(prefix: string, suffix: string) {
  return `${prefix}-${suffix}.ts`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
