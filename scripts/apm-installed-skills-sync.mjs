import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { installedSkillRoots, retiredLegacySkillRoots, verifyApmCliVersion } from "./apm-contract.mjs";
import { buildSkills } from "./build-skill-catalog.mjs";
const mode = process.argv.includes("--write") ? "write" : "verify";
const workspaceRoot = ".build-stacks/tmp/apm-installed-skills-sync";
const packageOut = join(workspaceRoot, "package");
const consumerOut = join(workspaceRoot, "consumer");
const expectedSkillNames = buildSkills.map((skill) => skill.name).sort();
verifyApmCliVersion();
resetWorkspace();
runApmInstalledSkillCommand(["node", "scripts/apm-package-prepare.mjs", "--out", packageOut], ".");
mkdirSync(consumerOut, { recursive: true });
runApmInstalledSkillCommand(["apm", "init", "--yes"], consumerOut);
runApmInstalledSkillCommand(["apm", "install", "--target", "all", "../package"], consumerOut);
const failures = [];
for (const root of installedSkillRoots) {
    const deployedRoot = join(consumerOut, root);
    verifySkillRoot(deployedRoot, `APM output ${root}`);
    if (mode === "write") {
        mkdirSync(dirname(root), { recursive: true });
        emptyDirectory(root);
        mkdirSync(root, { recursive: true });
        cpSync(deployedRoot, root, { recursive: true });
        continue;
    }
    verifySkillRoot(root, `repo output ${root}`);
    compareTrees(deployedRoot, root, root);
}
for (const root of retiredLegacySkillRoots) {
    if (mode === "write") {
        rmSync(root, { recursive: true, force: true });
    }
    else if (existsSync(root)) {
        failures.push(`retired legacy skill root must be removed: ${root}`);
    }
}
if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}
console.log(`${mode === "write" ? "synced" : "verified"} APM installed skill folders for ${expectedSkillNames.length} skills`);
function resetWorkspace() {
    rmSync(workspaceRoot, { recursive: true, force: true });
    mkdirSync(workspaceRoot, { recursive: true });
}
function runApmInstalledSkillCommand(command, cwd) {
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
function verifySkillRoot(root, label) {
    if (!existsSync(root)) {
        failures.push(`${label} missing: ${root}`);
        return;
    }
    const actual = readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    if (actual.join("\n") !== expectedSkillNames.join("\n")) {
        failures.push(`${label} skill set mismatch:\nexpected=${expectedSkillNames.join(",")}\nactual=${actual.join(",")}`);
    }
    for (const skillName of expectedSkillNames) {
        const file = join(root, skillName, "SKILL.md");
        if (!existsSync(file))
            failures.push(`${label} missing ${file}`);
    }
}
function compareTrees(expectedRoot, actualRoot, label) {
    const expectedFiles = collectFiles(expectedRoot).sort();
    const actualFiles = collectFiles(actualRoot).sort();
    if (expectedFiles.join("\n") !== actualFiles.join("\n")) {
        failures.push(`${label} generated file list drift:\nexpected=${expectedFiles.join(",")}\nactual=${actualFiles.join(",")}`);
        return;
    }
    for (const file of expectedFiles) {
        const expected = readFileSync(join(expectedRoot, file), "utf8");
        const actual = readFileSync(join(actualRoot, file), "utf8");
        if (expected !== actual)
            failures.push(`${label}/${file} differs from APM install output`);
    }
}
function collectFiles(root) {
    const files = [];
    if (!existsSync(root))
        return files;
    walk(root, root, files);
    return files;
}
function emptyDirectory(root) {
    if (!existsSync(root))
        return;
    for (const entry of readdirSync(root)) {
        const path = join(root, entry);
        const result = spawnSync("rm", ["-rf", path], { encoding: "utf8" });
        if (result.status !== 0) {
            throw new Error(`failed to remove generated output ${path}\n${result.stderr.trim()}`);
        }
    }
}
function walk(root, current, files) {
    for (const entry of readdirSync(current)) {
        if (entry === ".DS_Store")
            continue;
        const path = join(current, entry);
        const stat = statSync(path);
        if (stat.isDirectory()) {
            walk(root, path, files);
        }
        else if (stat.isFile()) {
            files.push(relative(root, path));
        }
    }
}
