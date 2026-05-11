import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { productSkills, isValidProductSkillName } from "./apm-skill-list.mjs";
const sourceSkillRoot = ".apm/skills";
const expectedSkillNames = new Set(productSkills.map((skill) => skill.name));
const sourceSkillDocumentFailures = [];
checkProductSkillCatalog();
if (sourceSkillDocumentFailures.length > 0) {
    console.error(sourceSkillDocumentFailures.join("\n"));
    process.exit(1);
}
console.log(`source skill documents verify ok: ${productSkills.length} product skills`);
function checkProductSkillCatalog() {
    for (const skill of productSkills) {
        checkAuthoredSkillDocument(skill.name);
    }
    if (existsSync(sourceSkillRoot)) {
        for (const entry of readdirSync(sourceSkillRoot, { withFileTypes: true })) {
            if (entry.isDirectory() && !expectedSkillNames.has(entry.name)) {
                sourceSkillDocumentFailures.push(`unexpected source skill: ${entry.name}`);
            }
        }
    }
}
function checkAuthoredSkillDocument(skillName) {
    if (!isValidProductSkillName(skillName)) {
        sourceSkillDocumentFailures.push(`invalid skill name: ${skillName}`);
    }
    const file = join(sourceSkillRoot, skillName, "SKILL.md");
    if (!existsSync(file)) {
        sourceSkillDocumentFailures.push(`missing source skill: ${file}`);
        return;
    }
    const body = readFileSync(file, "utf8");
    if (!body.startsWith("---\n")) {
        sourceSkillDocumentFailures.push(`missing frontmatter: ${file}`);
    }
    if (!body.includes(`name: ${skillName}`)) {
        sourceSkillDocumentFailures.push(`missing frontmatter name: ${file}`);
    }
    if (!body.includes("description: ")) {
        sourceSkillDocumentFailures.push(`missing frontmatter description: ${file}`);
    }
    if (!body.includes(`# ${skillName}`)) {
        sourceSkillDocumentFailures.push(`wrong title: ${file}`);
    }
}
