import { spawnSync } from "node:child_process";

const commands = [
    ["npm", "test"],
    ["node", "scripts/apm-source-skills-verify.mjs"],
    ["node", "scripts/apm-installed-skills-sync.mjs", "--verify"],
    ["node", "scripts/apm-package-verify.mjs"],
    ["apm", "audit", "--ci"],
    ["apm", "compile", "--validate", "--local-only"],
    ["node", "scripts/apm-skill-install-smoke.mjs", "--target", "codex"],
    ["node", "scripts/apm-skill-install-smoke.mjs", "--target", "all"],
    ["npm", "run", "browser:smoke"],
    ["node", "scripts/repo-secret-scan.mjs"]
];
const codexE2eCommands = [
    ["node", "scripts/codex-skill-activation-smoke.mjs"],
    ["node", "scripts/codex-browser-core-smoke.mjs"]
];
if (process.env.PRODUCT_RELEASE_VERIFY_CODEX_E2E === "1") {
    commands.splice(commands.length - 1, 0, ...codexE2eCommands);
}
else {
    console.log("Skipping Codex E2E smoke. Set PRODUCT_RELEASE_VERIFY_CODEX_E2E=1 to run it explicitly.");
}
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
