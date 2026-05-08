import { spawnSync } from "node:child_process";

const commands = [
    ["npm", "test"],
    ["node", "scripts/apm-source-skills-verify.mjs"],
    ["node", "scripts/release-license-verify.mjs"],
    ["node", "scripts/apm-installed-skills-sync.mjs", "--verify"],
    ["node", "scripts/apm-package-verify.mjs"],
    ["apm", "audit", "--ci"],
    ["apm", "compile", "--validate", "--local-only"],
    ["node", "scripts/apm-skill-install-smoke.mjs", "--target", "codex"],
    ["node", "scripts/apm-skill-install-smoke.mjs", "--target", "all"],
    ["node", "scripts/codex-skill-activation-smoke.mjs"],
    ["npm", "run", "browser:smoke"],
    ["node", "scripts/codex-browser-core-smoke.mjs"],
    ["node", "scripts/repo-secret-scan.mjs"]
];
for (const command of commands) {
    console.log(`$ ${command.join(" ")}`);
    const result = spawnSync(command[0], command.slice(1), {
        stdout: "inherit",
        stderr: "inherit"
    });
    if (result.status !== 0)
        process.exit(result.status ?? 1);
}
console.log("release verify ok");
