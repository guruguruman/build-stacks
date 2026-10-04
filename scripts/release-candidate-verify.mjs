import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const releaseCandidateCommands = [
    ["npm", "run", "quality:verify"],
    ["node", "scripts/host-neutral-source-verify.mjs"],
    ["node", "scripts/github-workflow-forward-test.mjs"],
    ["env", "BUILD_CODEX_SMOKE_EVIDENCE_LABEL=natural-ja", "node", "scripts/codex-skill-activation-smoke.mjs", "--all-skills", "--natural-ja"],
    ["env", "BUILD_CODEX_SMOKE_EVIDENCE_LABEL=natural-en", "node", "scripts/codex-skill-activation-smoke.mjs", "--all-skills", "--natural-en"],
    ["env", "BUILD_CODEX_SMOKE_EVIDENCE_LABEL=collisions-ja", "node", "scripts/codex-skill-activation-smoke.mjs", "--all-skills", "--collisions", "--natural-ja"],
    ["env", "BUILD_CODEX_SMOKE_EVIDENCE_LABEL=collisions-en", "node", "scripts/codex-skill-activation-smoke.mjs", "--all-skills", "--collisions", "--natural-en"],
    ["env", "BUILD_CODEX_BROWSER_EVIDENCE_LABEL=browser-core", "node", "scripts/codex-browser-core-smoke.mjs"]
];

if (isDirectExecution()) run();

function isDirectExecution() {
    return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function run() {
    for (const command of releaseCandidateCommands) {
        console.log(`$ ${command.join(" ")}`);
        const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });
        if (result.status !== 0) process.exit(result.status ?? 1);
    }
    const evidencePath = resolve(".build-stacks/evidence/release-candidate-verify.json");
    mkdirSync(dirname(evidencePath), { recursive: true });
    writeFileSync(evidencePath, `${JSON.stringify({
        status: "pass",
        completedAt: new Date().toISOString(),
        commands: releaseCandidateCommands.map((command) => command.join(" ")),
        routingEvidence: ["natural-ja", "natural-en", "collisions-ja", "collisions-en"],
        browserEvidence: "browser-core"
    }, null, 2)}\n`);
    console.log("release candidate verify ok");
}
