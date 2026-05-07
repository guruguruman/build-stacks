import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { productSkills } from "./apm-skill-list";

type Mode = "verify" | "write";

const mode: Mode = process.argv.includes("--write") ? "write" : "verify";
const workspaceRoot = ".product-build-stacks/tmp/apm-installed-skills-sync";
const packageOut = join(workspaceRoot, "package");
const consumerOut = join(workspaceRoot, "consumer");
const expectedSkillNames = productSkills.map((skill) => skill.name).sort();
const installedSkillRoots = [
  ".agents/skills",
  ".claude/skills",
  ".cursor/skills",
  ".github/skills",
  ".opencode/skills"
];

resetWorkspace();
runApmInstalledSkillCommand(["bun", "run", "scripts/apm-package-prepare.ts", "--out", packageOut], ".");
mkdirSync(consumerOut, { recursive: true });
runApmInstalledSkillCommand(["apm", "init", "--yes"], consumerOut);
runApmInstalledSkillCommand(["apm", "install", "--target", "all", "../package"], consumerOut);

const failures: string[] = [];

for (const root of installedSkillRoots) {
  const deployedRoot = join(consumerOut, root);
  verifySkillRoot(deployedRoot, `APM output ${root}`);

  if (mode === "write") {
    mkdirSync(dirname(root), { recursive: true });
    emptyDirectory(root);
    mkdirSync(root, { recursive: true });
    cpSync(deployedRoot, root, { recursive: true });
    continue;
  }

  verifySkillRoot(root, `repo output ${root}`);
  compareTrees(deployedRoot, root, root);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`${mode === "write" ? "synced" : "verified"} APM installed skill folders for ${expectedSkillNames.length} skills`);

function resetWorkspace() {
  rmSync(workspaceRoot, { recursive: true, force: true });
  mkdirSync(workspaceRoot, { recursive: true });
}

function runApmInstalledSkillCommand(command: string[], cwd: string) {
  const result = Bun.spawnSync(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  if (result.exitCode !== 0) {
    throw new Error([
      `command failed: ${command.join(" ")}`,
      `cwd: ${cwd}`,
      result.stdout.toString().trim(),
      result.stderr.toString().trim()
    ].filter(Boolean).join("\n"));
  }
}

function verifySkillRoot(root: string, label: string) {
  if (!existsSync(root)) {
    failures.push(`${label} missing: ${root}`);
    return;
  }
  const actual = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (actual.join("\n") !== expectedSkillNames.join("\n")) {
    failures.push(`${label} skill set mismatch:\nexpected=${expectedSkillNames.join(",")}\nactual=${actual.join(",")}`);
  }
  for (const skillName of expectedSkillNames) {
    const file = join(root, skillName, "SKILL.md");
    if (!existsSync(file)) failures.push(`${label} missing ${file}`);
  }
}

function compareTrees(expectedRoot: string, actualRoot: string, label: string) {
  const expectedFiles = collectFiles(expectedRoot).sort();
  const actualFiles = collectFiles(actualRoot).sort();
  if (expectedFiles.join("\n") !== actualFiles.join("\n")) {
    failures.push(`${label} generated file list drift:\nexpected=${expectedFiles.join(",")}\nactual=${actualFiles.join(",")}`);
    return;
  }
  for (const file of expectedFiles) {
    const expected = readFileSync(join(expectedRoot, file), "utf8");
    const actual = readFileSync(join(actualRoot, file), "utf8");
    if (expected !== actual) failures.push(`${label}/${file} differs from APM install output`);
  }
}

function collectFiles(root: string) {
  const files: string[] = [];
  if (!existsSync(root)) return files;
  walk(root, root, files);
  return files;
}

function emptyDirectory(root: string) {
  if (!existsSync(root)) return;
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const result = Bun.spawnSync(["rm", "-rf", path], { stdout: "pipe", stderr: "pipe" });
    if (result.exitCode !== 0) {
      throw new Error(`failed to remove generated output ${path}\n${result.stderr.toString().trim()}`);
    }
  }
}

function walk(root: string, current: string, files: string[]) {
  for (const entry of readdirSync(current)) {
    if (entry === ".DS_Store") continue;
    const path = join(current, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(root, path, files);
    } else if (stat.isFile()) {
      files.push(relative(root, path));
    }
  }
}
