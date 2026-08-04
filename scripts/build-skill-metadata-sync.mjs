import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildSkills } from "./build-skill-catalog.mjs";

const mode = process.argv.includes("--write") ? "write" : "verify";
const failures = [];

for (const skill of buildSkills) {
    const path = join("packages", skill.package, ".apm", "skills", skill.name, "agents", "openai.yaml");
    const expected = renderMetadata(skill);
    if (mode === "write") {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, expected);
        continue;
    }
    if (!existsSync(path)) {
        failures.push(`missing skill UI metadata: ${path}`);
        continue;
    }
    if (readFileSync(path, "utf8") !== expected) failures.push(`stale skill UI metadata: ${path}`);
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
