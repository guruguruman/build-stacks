import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { expectedApmVersion, retiredLegacySkillRoots, targetSkillRoots, verifyApmCliVersion } from "./apm-contract.mjs";
import { productSkills } from "./apm-skill-list.mjs";
const target = readCliOption("--target") ?? "codex";
const workspaceRoot = `.product-build-stacks/tmp/apm-skill-install-smoke-${target}`;
const packageOut = join(workspaceRoot, "package");
const consumerOut = join(workspaceRoot, "consumer");
const evidencePath = `.product-build-stacks/evidence/apm-skill-install-smoke-${target}.json`;
const expectedSkillNames = productSkills.map((skill) => skill.name).sort();
if (!(target in targetSkillRoots)) {
    throw new Error(`unsupported APM ${expectedApmVersion} target for product-build-stacks smoke: ${target}`);
}
verifyApmCliVersion();
rmSync(workspaceRoot, { recursive: true, force: true });
mkdirSync(consumerOut, { recursive: true });
runConsumerInstallCommand(["node", "scripts/apm-package-prepare.mjs", "--out", packageOut], ".");
runConsumerInstallCommand(["apm", "init", "--yes"], consumerOut);
runConsumerInstallCommand(["apm", "install", "--target", target, "../package"], consumerOut);
const failures = [];
const installed = {};
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
    ".kiro/skills/product-build-stacks"
]) {
    if (existsSync(join(consumerOut, rootBundle)))
        failures.push(`consumer install created forbidden root bundle: ${rootBundle}`);
}
for (const legacyRoot of retiredLegacySkillRoots) {
    if (existsSync(join(consumerOut, legacyRoot)))
        failures.push(`consumer install created retired legacy skill root: ${legacyRoot}`);
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
function readCliOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline)
        return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
function runConsumerInstallCommand(command, cwd) {
    const result = spawnSync(command[0], command.slice(1), {
        cwd,
        encoding: "utf8"
    });
    if (result.status !== 0) {
        throw new Error([
            `command failed: ${command.join(" ")}`,
            `cwd: ${cwd}`,
            result.stdout.trim(),
            result.stderr.trim()
        ].filter(Boolean).join("\n"));
    }
}
