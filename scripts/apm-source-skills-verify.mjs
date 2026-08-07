import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildPackages, buildSkills, isValidBuildSkillName, packageClosure, skillsForPackage } from "./build-skill-catalog.mjs";

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
        if (!skill.activationExamples.some((example) => /[A-Za-z]/.test(example))) failures.push(`missing English activation example: ${skill.name}`);
        if (!skill.activationExamples.some((example) => /[\u3040-\u30ff\u3400-\u9fff]/u.test(example))) failures.push(`missing Japanese activation example: ${skill.name}`);
        if (!/^Please\s.+\.$/.test(skill.naturalActivationExamples?.en ?? "")) failures.push(`missing natural English activation request: ${skill.name}`);
        if (!/[\u3040-\u30ff\u3400-\u9fff]/u.test(skill.naturalActivationExamples?.ja ?? "")) failures.push(`missing natural Japanese activation request: ${skill.name}`);
        if (Object.values(skill.naturalActivationExamples ?? {}).some((example) => example.includes(skill.name))) failures.push(`natural activation request names the skill: ${skill.name}`);
        if (!["coordinator", "role", "support", "internal"].includes(skill.routingKind)) failures.push(`invalid routing kind: ${skill.name}`);
        if (skill.layer === "role" && !skill.roleStance) failures.push(`missing role stance: ${skill.name}`);
        if (skill.routingKind !== "coordinator" && skill.orchestrates.length > 0) failures.push(`only coordinators may orchestrate: ${skill.name}`);
        for (const dependency of skill.benefitsFrom) {
            if (!expectedNames.has(dependency)) failures.push(`unknown benefitsFrom edge: ${skill.name} -> ${dependency}`);
        }
        for (const dependency of skill.orchestrates) {
            if (!expectedNames.has(dependency)) failures.push(`unknown orchestration edge: ${skill.name} -> ${dependency}`);
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
    if (!/(?:^|[.!?]\s)(?:Use|Apply) when\b/.test(description)) failures.push(`description must state its activation intent: ${path}`);
    if (!/[\u3040-\u30ff\u3400-\u9fff]/u.test(description)) failures.push(`description must include a Japanese natural-language trigger: ${path}`);
    if (description.length > 1024) failures.push(`description exceeds 1024 characters: ${path}`);
    if (!/^[\x00-\x7F]+$/.test(declaredName ?? "")) failures.push(`frontmatter name must be ASCII-only: ${path}`);
    const lineCount = body.split("\n").length;
    const approximateTokens = Math.ceil(body.length / 4);
    if (lineCount > 500) failures.push(`${path} exceeds 500 lines: ${lineCount}`);
    if (approximateTokens > 5000) failures.push(`${path} exceeds the 5000-token budget: ~${approximateTokens}`);
    if (!body.includes(`# ${name}`)) failures.push(`wrong skill title: ${path}`);
    verifyLinks(path, body);
    const catalogEntry = buildSkills.find((skill) => skill.name === name);
    if (catalogEntry?.package !== packageId) failures.push(`catalog package mismatch: ${name}`);
    verifySkillResources(directory, catalogEntry);
}

function verifySkillResources(directory, catalogEntry) {
    if (!catalogEntry) {
        failures.push(`missing catalog entry for source skill: ${directory}`);
        return;
    }
    const availableNames = new Set(packageClosure(catalogEntry.package).map((skill) => skill.name));
    const knownNames = new Set(buildSkills.map((skill) => skill.name));
    for (const path of collectTextFiles(directory)) {
        const body = readFileSync(path, "utf8");
        if (/product-(browser|flow|guard|internal|recipe|role|runtime|source)-|\.product-build-stacks/.test(body)) {
            failures.push(`legacy build-stacks identifier: ${path}`);
        }
        if (path.includes(`${join("references", "")}`) && path.endsWith(".md")) verifyLinks(path, body);
        verifyCrossSkillResourcePaths(path, body);
        const referencedNames = new Set([...body.matchAll(/\bbuild-(?:browser|flow|guard|internal|recipe|role|runtime|source)-[a-z0-9-]+\b/g)].map((match) => match[0]));
        for (const referencedName of referencedNames) {
            if (!knownNames.has(referencedName) || availableNames.has(referencedName)) continue;
            if (!catalogEntry.benefitsFrom.includes(referencedName)) {
                failures.push(`undeclared optional skill reference: ${catalogEntry.name} -> ${referencedName} (${path})`);
            }
        }
    }
}

function verifyCrossSkillResourcePaths(path, body) {
    for (const match of body.matchAll(/`((?:\.\.\/)+build-[a-z0-9-]+\/references\/[A-Za-z0-9._-]+\.md)`/g)) {
        const resolved = resolve(dirname(path), match[1]);
        if (!existsSync(resolved)) failures.push(`broken cross-skill resource path in ${path}: ${match[1]}`);
    }
}

function collectTextFiles(root) {
    const files = [];
    walkTextFiles(root, files);
    return files;
}

function walkTextFiles(current, files) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) walkTextFiles(path, files);
        else if (entry.isFile() && /\.(?:md|mjs|js|py|sh|ya?ml|json|toml)$/.test(path)) files.push(path);
    }
}

function verifyLinks(path, body) {
    for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = match[1].split("#")[0];
        if (!target || /^(https?:|mailto:)/.test(target)) continue;
        const resolved = resolve(dirname(path), target);
        if (!existsSync(resolved)) failures.push(`broken relative link in ${path}: ${target}`);
    }
}
