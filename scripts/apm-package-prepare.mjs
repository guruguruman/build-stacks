import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const packageOut = readCliOption("--out") ?? "tmp/build-stacks-package";
const packageSourcePaths = [
    ".apmignore",
    "apm.yml",
    "packages",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "docs",
    "package.json",
    "package-lock.json",
    "scripts"
];
const requiredPackagePaths = ["apm.yml", "packages", "README.md", "LICENSE", "CHANGELOG.md", "package.json", "scripts"];
const forbiddenPackagePaths = [
    "SKILL.md", "SKILL.md.tmpl", "tests", "node_modules", "apm_modules", "tmp", ".product", ".build-stacks",
    ".agents", ".claude", ".kiro", ".cursor", ".github", ".opencode"
];

rmSync(packageOut, { recursive: true, force: true });
mkdirSync(packageOut, { recursive: true });
for (const path of packageSourcePaths) {
    if (!existsSync(path)) continue;
    const target = join(packageOut, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(path, target, { recursive: true });
}

for (const path of requiredPackagePaths) {
    if (!existsSync(join(packageOut, path))) throw new Error(`prepared package missing required path: ${path}`);
}
for (const path of forbiddenPackagePaths) {
    if (existsSync(join(packageOut, path))) throw new Error(`prepared package includes forbidden path: ${path}`);
}

console.log(`prepared build-stacks package at ${packageOut}`);

function readCliOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
