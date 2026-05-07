import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const packageOut = readCliOption("--out") ?? "tmp/product-build-stacks-package";

const packageSourcePaths = [
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

const requiredPackagePaths = [
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
  ".cursor",
  ".github/skills",
  ".opencode"
];

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

rmSync(packageOut, { recursive: true, force: true });
mkdirSync(packageOut, { recursive: true });

for (const path of packageSourcePaths) {
  if (!existsSync(path)) continue;
  const target = join(packageOut, path);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(path, target, { recursive: true });
}

sanitizeLocalPackageManifests(packageOut);
verifyLocalPackageShape(packageOut);

console.log(`prepared product-build-stacks package at ${packageOut}`);

function readCliOption(name: string) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function verifyLocalPackageShape(root: string) {
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

function sanitizeLocalPackageManifests(root: string) {
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
