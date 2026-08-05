import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { verifyApmCliVersion } from "./apm-contract.mjs";

const workspaceRoot = resolve(".build-stacks/tmp/apm-compile-verify");

verifyApmCliVersion();
rmSync(workspaceRoot, { recursive: true, force: true });
mkdirSync(workspaceRoot, { recursive: true });
for (const path of ["apm.yml", "apm.lock.yaml", "packages"]) {
    cpSync(path, join(workspaceRoot, path), { recursive: true });
}

run(["apm", "install", "--frozen", "--target", "all"]);
run(["apm", "compile", "--validate"]);

console.log(`apm compile verify ok: ${workspaceRoot}`);

function run(command) {
    const result = spawnSync(command[0], command.slice(1), {
        cwd: workspaceRoot,
        encoding: "utf8"
    });
    if (result.status !== 0) {
        throw new Error([
            `command failed: ${command.join(" ")}`,
            result.stdout.trim(),
            result.stderr.trim()
        ].filter(Boolean).join("\n"));
    }
}
