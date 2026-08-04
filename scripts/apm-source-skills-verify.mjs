import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildPackages, buildSkills, isValidBuildSkillName, skillsForPackage } from "./build-skill-catalog.mjs";

const failures = [];
const expectedNames = new Set(buildSkills.map((skill) => skill.name));
const allowedSkillRootEntries = new Set(["SKILL.md", "agents", "scripts", "references", "assets"]);

verifyCatalog();
verifySourceSkills();

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log(`source skill documents verify ok: ${buildSkills.length} build skills across ${buildPackages.length} packages`);

function verifyCatalog() {
    if (expectedNames.size !== buildSkills.length) failures.push("canonical catalog contains duplicate skill names");
    for (const skill of buildSkills) {
        if (!isValidBuildSkillName(skill.name)) failures.push(`invalid skill name: ${skill.name}`);
        if (!buildPackages.some((pkg) => pkg.id === skill.package)) failures.push(`unknown package for ${skill.name}: ${skill.package}`);
        if (skill.activationExamples.length === 0) failures.push(`missing activation examples: ${skill.name}`);
        for (const dependency of skill.benefitsFrom) {
            if (!expectedNames.has(dependency)) failures.push(`unknown benefitsFrom edge: ${skill.name} -> ${dependency}`);
        }
    }
}

function verifySourceSkills() {
    for (const pkg of buildPackages) {
        const root = join(pkg.path, ".apm", "skills");
        const expected = new Set(skillsForPackage(pkg.id).map((skill) => skill.name));
        if (!existsSync(root)) {
            failures.push(`missing package skill root: ${root}`);
            continue;
        }
        const actual = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
        for (const name of expected) if (!actual.includes(name)) failures.push(`missing source skill: ${join(root, name)}`);
        for (const name of actual) if (!expected.has(name)) failures.push(`unexpected source skill in ${pkg.id}: ${name}`);
        for (const name of actual) verifySkill(pkg.id, join(root, name));
    }
}

function verifySkill(packageId, directory) {
    const name = directory.split("/").at(-1);
    const path = join(directory, "SKILL.md");
    if (!existsSync(path)) {
        failures.push(`missing SKILL.md: ${directory}`);
        return;
    }
    for (const entry of readdirSync(directory)) {
        if (!allowedSkillRootEntries.has(entry)) failures.push(`${directory} contains non-standard root entry: ${entry}`);
    }
    const body = readFileSync(path, "utf8");
    const match = body.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) {
        failures.push(`invalid frontmatter: ${path}`);
        return;
    }
    const frontmatter = match[1];
    const keys = [...frontmatter.matchAll(/^([a-z][a-z0-9-]*):/gm)].map((entry) => entry[1]);
    if (keys.join(",") !== "name,description") failures.push(`${path} frontmatter must contain only name and description`);
    const declaredName = frontmatter.match(/^name:\s*([^\n]+)$/m)?.[1]?.replace(/^['"]|['"]$/g, "");
    if (declaredName !== name) failures.push(`frontmatter name mismatch: ${path}`);
    const descriptionRaw = frontmatter.match(/^description:\s*(.+)$/m)?.[1];
    let description = "";
    try {
        description = descriptionRaw?.startsWith('"') ? JSON.parse(descriptionRaw) : descriptionRaw ?? "";
    } catch {
        failures.push(`description must be a valid quoted scalar: ${path}`);
    }
    if (!description.startsWith("Use when") && !description.startsWith("Apply when")) failures.push(`description must be intent-first: ${path}`);
    if (description.length > 1024) failures.push(`description exceeds 1024 characters: ${path}`);
    if (!/^[\x00-\x7F]*$/.test(frontmatter)) failures.push(`frontmatter must be ASCII-only: ${path}`);
    const lineCount = body.split("\n").length;
    const approximateTokens = Math.ceil(body.length / 4);
    if (lineCount > 500) failures.push(`${path} exceeds 500 lines: ${lineCount}`);
    if (approximateTokens > 5000) failures.push(`${path} exceeds the 5000-token budget: ~${approximateTokens}`);
    if (!body.includes(`# ${name}`)) failures.push(`wrong skill title: ${path}`);
    if (/product-(browser|flow|guard|internal|recipe|role|runtime|source)-|\.product-build-stacks/.test(body)) failures.push(`legacy build-stacks identifier: ${path}`);
    verifyLinks(path, body);
    const catalogEntry = buildSkills.find((skill) => skill.name === name);
    if (catalogEntry?.package !== packageId) failures.push(`catalog package mismatch: ${name}`);
}

function verifyLinks(path, body) {
    for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = match[1].split("#")[0];
        if (!target || /^(https?:|mailto:)/.test(target)) continue;
        const resolved = resolve(dirname(path), target);
        if (!existsSync(resolved)) failures.push(`broken relative link in ${path}: ${target}`);
    }
}
