import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { expectedApmVersion, retiredLegacySkillRoots, targetSkillRoots, verifyApmCliVersion } from "./apm-contract.mjs";
import { buildPackages, buildSkills, packageClosure } from "./build-skill-catalog.mjs";

const packagesMode = process.argv.includes("--packages");
const target = readCliOption("--target") ?? "codex";
const label = packagesMode ? "packages" : target;
const workspaceRoot = `.build-stacks/tmp/apm-skill-install-smoke-${label}`;
const packageOut = resolve(workspaceRoot, "package");
const evidencePath = `.build-stacks/evidence/apm-skill-install-smoke-${label}.json`;
const runs = [];
const failures = [];

if (!(target in targetSkillRoots)) throw new Error(`unsupported APM ${expectedApmVersion} target for build-stacks smoke: ${target}`);
verifyApmCliVersion();
rmSync(workspaceRoot, { recursive: true, force: true });
mkdirSync(workspaceRoot, { recursive: true });
run(["node", "scripts/apm-package-prepare.mjs", "--out", packageOut], ".");

if (packagesMode) {
    for (const pkg of buildPackages) runInstall(pkg.id, resolve(packageOut, pkg.path), packageClosure(pkg.id).map((skill) => skill.name));
} else {
    runInstall("root", packageOut, buildSkills.map((skill) => skill.name));
}

mkdirSync(dirnameOf(evidencePath), { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify({ target, packagesMode, packageOut, runs, failures }, null, 2)}\n`);
if (failures.length > 0) {
    console.error(failures.join("\n"));
    console.error(`evidence: ${evidencePath}`);
    process.exit(1);
}
console.log(`consumer smoke ok: mode=${label} runs=${runs.length} evidence=${evidencePath}`);

function runInstall(name, source, expectedNames) {
    const consumerOut = resolve(workspaceRoot, `consumer-${name}`);
    mkdirSync(consumerOut, { recursive: true });
    run(["apm", "init", "--yes"], consumerOut);
    run(["apm", "install", "--target", target, source], consumerOut);
    const expected = [...expectedNames].sort();
    const installed = {};
    for (const root of targetSkillRoots[target]) {
        const skillRoot = join(consumerOut, root);
        const actual = existsSync(skillRoot)
            ? readdirSync(skillRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
            : [];
        installed[root] = actual;
        if (actual.join("\n") !== expected.join("\n")) failures.push(`${name}/${root}: expected ${expected.length} skills, got ${actual.length}`);
    }
    for (const root of retiredLegacySkillRoots) {
        if (existsSync(join(consumerOut, root))) failures.push(`${name}: created retired skill root ${root}`);
    }
    for (const bundle of [".agents/skills/build-stacks", ".claude/skills/build-stacks", ".kiro/skills/build-stacks"]) {
        if (existsSync(join(consumerOut, bundle))) failures.push(`${name}: created forbidden root bundle ${bundle}`);
    }
    runs.push({ name, source, expectedSkillCount: expected.length, consumerOut, installed });
}

function run(command, cwd) {
    const result = spawnSync(command[0], command.slice(1), { cwd, encoding: "utf8" });
    if (result.status !== 0) {
        throw new Error([`command failed: ${command.join(" ")}`, `cwd: ${cwd}`, result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n"));
    }
}

function readCliOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}

function dirnameOf(path) {
    return path.slice(0, path.lastIndexOf("/"));
}
