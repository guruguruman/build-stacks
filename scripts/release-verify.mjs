import { spawnSync } from "node:child_process";

const commands = [["npm", "run", "quality:verify"]];
const codexE2eCommands = [
    ["node", "scripts/codex-skill-activation-smoke.mjs"],
    ["node", "scripts/codex-skill-activation-smoke.mjs", "--all-skills", "--natural-ja"],
    ["node", "scripts/codex-skill-activation-smoke.mjs", "--all-skills", "--natural-en"],
    ["node", "scripts/codex-browser-core-smoke.mjs"]
];
if (process.env.BUILD_RELEASE_VERIFY_CODEX_E2E === "1") {
    commands.push(...codexE2eCommands);
}
else {
    console.log("Skipping Codex E2E smoke. Set BUILD_RELEASE_VERIFY_CODEX_E2E=1 to run it explicitly.");
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
