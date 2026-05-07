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
    for (const forbidden of [
        "~/.claude/skills/" + "product-stacks",
        ".claude/skills/" + "product-stacks",
        "~/" + ".gstack",
        "consumer-installed product-build-stacks skill directory/bin",
        "product-stacks-config",
        "product-stacks-update-check",
        "product-stacks-model-benchmark"
    ]) {
        if (body.includes(forbidden))
            sourceSkillDocumentFailures.push(`${file} contains unshipped helper reference: ${forbidden}`);
    }
    const metadataPath = join(sourceSkillRoot, skillName, "references/gstack-adaptation.json");
    if (!existsSync(metadataPath)) {
        sourceSkillDocumentFailures.push(`missing adaptation metadata: ${metadataPath}`);
    }
    else {
        const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
        if (metadata.product !== skillName)
            sourceSkillDocumentFailures.push(`${metadataPath} product mismatch`);
        if (metadata.license !== "MIT")
            sourceSkillDocumentFailures.push(`${metadataPath} license must be MIT`);
    }
}
