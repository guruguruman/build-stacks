import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
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
run(["apm", "compile"]);
const agentsPath = join(workspaceRoot, "AGENTS.md");
if (!existsSync(agentsPath)) throw new Error("APM compile did not generate AGENTS.md");
const agentsBody = readFileSync(agentsPath, "utf8");
for (const expected of ["# build-core-language", "# build-core-routing"]) {
    if (!agentsBody.includes(expected)) throw new Error(`generated AGENTS.md missing ${expected}`);
}
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
