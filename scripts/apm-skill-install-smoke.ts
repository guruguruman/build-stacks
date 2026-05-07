import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { productSkills } from "./apm-skill-list";

const target = readCliOption("--target") ?? "codex";
const workspaceRoot = `.product-build-stacks/tmp/apm-skill-install-smoke-${target}`;
const packageOut = join(workspaceRoot, "package");
const consumerOut = join(workspaceRoot, "consumer");
const evidencePath = `.product-build-stacks/evidence/apm-skill-install-smoke-${target}.json`;
const expectedSkillNames = productSkills.map((skill) => skill.name).sort();
const targetSkillRoots: Record<string, string[]> = {
  agents: [".agents/skills"],
  codex: [".agents/skills"],
  claude: [".claude/skills"],
  cursor: [".cursor/skills"],
  copilot: [".github/skills"],
  vscode: [".github/skills"],
  opencode: [".opencode/skills"],
  all: [".agents/skills", ".claude/skills", ".cursor/skills", ".github/skills", ".opencode/skills"]
};

if (!(target in targetSkillRoots)) {
  throw new Error(`unsupported APM 0.9.1 target for product-build-stacks smoke: ${target}`);
}

rmSync(workspaceRoot, { recursive: true, force: true });
mkdirSync(consumerOut, { recursive: true });

runConsumerInstallCommand(["bun", "run", "scripts/apm-package-prepare.ts", "--out", packageOut], ".");
runConsumerInstallCommand(["apm", "init", "--yes"], consumerOut);
runConsumerInstallCommand(["apm", "install", "--target", target, "../package"], consumerOut);

const failures: string[] = [];
const installed: Record<string, string[]> = {};

for (const root of targetSkillRoots[target]) {
  const skillRoot = join(consumerOut, root);
  if (!existsSync(skillRoot)) {
    failures.push(`missing installed skill root: ${root}`);
    installed[root] = [];
    continue;
  }
  const actual = readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  installed[root] = actual;
  if (actual.join("\n") !== expectedSkillNames.join("\n")) {
    failures.push(`${root} skill set mismatch: expected ${expectedSkillNames.length}, got ${actual.length}`);
  }
}

for (const rootBundle of [
  ".agents/skills/product-build-stacks",
  ".agents/skills/product-build-stacks-package",
  ".claude/skills/product-build-stacks",
  ".cursor/skills/product-build-stacks",
  ".github/skills/product-build-stacks",
  ".opencode/skills/product-build-stacks"
]) {
  if (existsSync(join(consumerOut, rootBundle))) failures.push(`consumer install created forbidden root bundle: ${rootBundle}`);
}

mkdirSync(".product-build-stacks/evidence", { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify({
  target,
  packageOut,
  consumerOut,
  expectedSkillCount: expectedSkillNames.length,
  installed,
  failures
}, null, 2)}\n`);

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`evidence: ${evidencePath}`);
  process.exit(1);
}

console.log(`consumer smoke ok: target=${target} skills=${expectedSkillNames.length} evidence=${evidencePath}`);

function readCliOption(name: string) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runConsumerInstallCommand(command: string[], cwd: string) {
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
