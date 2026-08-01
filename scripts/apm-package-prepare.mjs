import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
const packageOut = readCliOption("--out") ?? "tmp/product-build-stacks-package";
const packageSourcePaths = [
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
const requiredPackagePaths = [
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
const forbiddenPackagePaths = [
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
    ".kiro",
    ".cursor",
    ".github/skills",
    ".opencode"
];
const publicPackageScripts = {
    build: "node scripts/apm-installed-skills-sync.mjs --write",
    "generated:verify": "node scripts/apm-installed-skills-sync.mjs --verify",
    "browser:doctor": "agent-browser doctor --offline --quick",
    "browser:smoke": "node scripts/agent-browser-smoke.mjs",
    "skill:verify": "node scripts/apm-source-skills-verify.mjs",
    "apm:verify": "node scripts/apm-package-verify.mjs",
    "smoke:codex": "node scripts/apm-skill-install-smoke.mjs --target codex",
    "smoke:all": "node scripts/apm-skill-install-smoke.mjs --target all",
    "quality:verify": "node scripts/release-quality-verify.mjs",
    "release:verify": "node scripts/release-verify.mjs",
    test: "node --test"
};
rmSync(packageOut, { recursive: true, force: true });
mkdirSync(packageOut, { recursive: true });
for (const path of packageSourcePaths) {
    if (!existsSync(path))
        continue;
    const target = join(packageOut, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(path, target, { recursive: true });
}
sanitizeLocalPackageManifests(packageOut);
verifyLocalPackageShape(packageOut);
console.log(`prepared product-build-stacks package at ${packageOut}`);
function readCliOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline)
        return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
function verifyLocalPackageShape(root) {
    for (const path of requiredPackagePaths) {
        if (!existsSync(join(root, path))) {
            throw new Error(`prepared package missing required path: ${path}`);
        }
    }
    for (const path of forbiddenPackagePaths) {
        if (existsSync(join(root, path))) {
            throw new Error(`prepared package includes forbidden path: ${path}`);
        }
    }
}
function sanitizeLocalPackageManifests(root) {
    const packagePath = join(root, "package.json");
    if (existsSync(packagePath)) {
        const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
        packageJson.scripts = publicPackageScripts;
        writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
    }
    const apmPath = join(root, "apm.yml");
    if (existsSync(apmPath)) {
        const body = readFileSync(apmPath, "utf8");
        const scriptsBlock = [
            "scripts:",
            ...Object.entries(publicPackageScripts).map(([name, command]) => `  ${name}: "${command}"`)
        ].join("\n");
        const next = body.replace(/scripts:\n(?:  .+\n)+\n?dependencies:/, `${scriptsBlock}\n\ndependencies:`);
        writeFileSync(apmPath, next);
    }
}
