const commands = [
  ["bunx", "tsc", "--noEmit"],
  ["bun", "test"],
  ["bun", "run", "scripts/apm-source-skills-verify.ts"],
  ["bun", "run", "scripts/release-license-verify.ts"],
  ["bun", "run", "scripts/apm-installed-skills-sync.ts", "--verify"],
  ["bun", "run", "scripts/apm-package-verify.ts"],
  ["apm", "audit", "--ci"],
  ["apm", "compile", "--validate", "--local-only"],
  ["bun", "run", "scripts/apm-skill-install-smoke.ts", "--target", "codex"],
  ["bun", "run", "scripts/apm-skill-install-smoke.ts", "--target", "all"],
  ["bun", "run", "scripts/codex-skill-activation-smoke.ts", "--all-skills"],
  ["bun", "run", "browser:smoke"],
  ["bun", "run", "scripts/repo-secret-scan.ts"]
];

for (const command of commands) {
  console.log(`$ ${command.join(" ")}`);
  const result = Bun.spawnSync(command, {
    stdout: "inherit",
    stderr: "inherit"
  });
  if (result.exitCode !== 0) process.exit(result.exitCode ?? 1);
}

console.log("release verify ok");
