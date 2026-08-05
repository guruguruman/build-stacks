import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildSkills } from "./build-skill-catalog.mjs";

const mode = process.argv.includes("--write") ? "write" : "verify";
const failures = [];

for (const skill of buildSkills) {
    const skillPath = join(skill.sourcePath, "SKILL.md");
    const path = join(skill.sourcePath, "agents", "openai.yaml");
    const expected = renderMetadata(skill);
    if (mode === "write") {
        syncSkillDescription(skillPath, skill, true);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, expected);
        continue;
    }
    syncSkillDescription(skillPath, skill, false);
    if (!existsSync(path)) {
        failures.push(`missing skill UI metadata: ${path}`);
        continue;
    }
    if (readFileSync(path, "utf8") !== expected) failures.push(`stale skill UI metadata: ${path}`);
}

function syncSkillDescription(path, skill, write) {
    const body = readFileSync(path, "utf8");
    const expected = `description: ${JSON.stringify(renderSkillDescription(skill))}`;
    const actual = body.match(/^description:.*$/m)?.[0];
    if (write) {
        if (!actual) throw new Error(`missing skill description: ${path}`);
        const next = body.replace(/^description:.*$/m, expected);
        if (next !== body) writeFileSync(path, next);
        return;
    }
    if (actual !== expected) failures.push(`stale skill description: ${path}`);
}

function renderSkillDescription(skill) {
    const examples = skill.activationExamples.filter((example) => example !== skill.name).slice(0, 4);
    return `${skill.summary} Use when the user asks to ${skill.action}. Common requests include ${examples.map((example) => JSON.stringify(example)).join(", ")}.`;
}

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log(`${mode === "write" ? "synced" : "verified"} UI metadata for ${buildSkills.length} build skills`);

function renderMetadata(skill) {
    const { displayName, shortDescription, defaultPrompt } = skill.interface;
    if (shortDescription.length < 25 || shortDescription.length > 64) {
        throw new Error(`${skill.name} short_description must be 25-64 characters`);
    }
    if (!defaultPrompt.includes(`$${skill.name}`)) {
        throw new Error(`${skill.name} default_prompt must mention $${skill.name}`);
    }
    return [
        "interface:",
        `  display_name: ${JSON.stringify(displayName)}`,
        `  short_description: ${JSON.stringify(shortDescription)}`,
        `  default_prompt: ${JSON.stringify(defaultPrompt)}`,
        ""
    ].join("\n");
}
