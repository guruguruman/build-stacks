import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const releaseQualityCommands = [
    ["npm", "test"],
    ["npm", "run", "skill:verify"],
    ["npm", "run", "metadata:verify"],
    ["npm", "run", "stack:verify"],
    ["npm", "run", "generated:verify"],
    ["npm", "run", "apm:verify"],
    ["apm", "audit", "--ci"],
    ["node", "scripts/apm-compile-verify.mjs"],
    ["npm", "run", "smoke:codex"],
    ["npm", "run", "smoke:all"],
    ["npm", "run", "smoke:packages"],
    ["npm", "run", "smoke:codex-activation-install"],
    ["npm", "run", "browser:doctor"],
    ["npm", "run", "browser:smoke"],
    ["node", "scripts/repo-secret-scan.mjs"],
    ["node", "scripts/repo-whitespace-verify.mjs"]
];

if (isDirectExecution())
    runReleaseQualityVerification();

function isDirectExecution() {
    return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function runReleaseQualityVerification() {
    for (const command of releaseQualityCommands) {
        console.log(`$ ${command.join(" ")}`);
        const result = spawnSync(command[0], command.slice(1), {
            stdout: "inherit",
            stderr: "inherit"
        });
        if (result.status !== 0)
            process.exit(result.status ?? 1);
    }
    console.log("release quality verify ok");
}
