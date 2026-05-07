import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const failures: string[] = [];
const scannedFiles: string[] = [];
const publicReleaseRoots = [
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
  "scripts",
  ".agents/skills",
  ".claude/skills",
  ".cursor/skills",
  ".github/skills",
  ".github/workflows",
  ".opencode/skills"
];
const skipDirs = new Set(["node_modules", "apm_modules", "tmp", ".product-build-stacks", ".git"]);
const secretPatterns = [
  { name: "OpenAI key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Authorization header", pattern: /authorization:\s*bearer\s+[A-Za-z0-9._-]{12,}/i },
  { name: "Cookie header", pattern: /\bcookie:\s*[^`\n]{12,}/i },
  { name: "Private home path", pattern: /\/Users\/(?!t-kato\/dev\/personal\/product-stacks\b)[A-Za-z0-9._-]+\// }
];
const textFilePattern = /\.(md|json|ya?ml|ts|tsx|js|sh|txt|lock|gitignore|apmignore)$/;
const textFileNames = new Set(["README.md", "LICENSE", "CHANGELOG.md", "THIRD_PARTY_NOTICES.md", ".apmignore"]);

for (const root of publicReleaseRoots) {
  if (!existsSync(root)) {
    failures.push(`public release scan root missing: ${root}`);
    continue;
  }
  if (statSync(root).isDirectory()) {
    walk(root);
  } else {
    scanFile(root);
  }
}

if (existsSync(".git")) {
  const result = Bun.spawnSync(["git", "log", "--all", "-p", "--", "."], {
    stdout: "pipe",
    stderr: "pipe"
  });
  if (result.exitCode !== 0) {
    failures.push(`git history scan failed:\n${result.stderr.toString().trim()}`);
  } else {
    scanText("<git-history>", result.stdout.toString());
  }
} else {
  failures.push("git history scan unavailable: .git is required for public release secret scan");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`secret scan ok: ${scannedFiles.length} working-tree files scanned`);

function walk(root: string) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path);
    } else if (entry.isFile()) {
      scanFile(path);
    }
  }
}

function scanFile(path: string) {
  const name = path.split("/").at(-1) ?? path;
  if (!textFilePattern.test(path) && !textFileNames.has(name)) return;
  scannedFiles.push(path);
  scanText(path, readFileSync(path, "utf8"));
}

function scanText(label: string, body: string) {
  const lines = body.split("\n");
  for (let index = 0; index < lines.length; index++) {
    for (const { name, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[index])) failures.push(`${label}:${index + 1} possible secret/private data: ${name}`);
    }
  }
}
