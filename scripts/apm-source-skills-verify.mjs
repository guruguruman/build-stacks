import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { productSkills, isValidProductSkillName } from "./apm-skill-list.mjs";

const sourceSkillRoot = ".apm/skills";
const expectedSkillNames = new Set(productSkills.map((skill) => skill.name));
const sourceSkillDocumentFailures = [];
const requiredFrontmatterKeys = [
    "name",
    "preamble-tier",
    "version",
    "description",
    "benefits-from",
    "triggers"
];
const highPreambleFlowSkills = new Set([
    "product-flow-designconsult",
    "product-flow-goaldirectedux",
    "product-flow-designshotgun",
    "product-flow-infradesign",
    "product-flow-landingreport",
    "product-flow-mobileuifinish",
    "product-flow-pdmscaffold",
    "product-flow-plantune",
    "product-flow-securitygate",
    "product-flow-skillify",
    "product-flow-webuifinish"
]);

checkProductSkillCatalog();

if (sourceSkillDocumentFailures.length > 0) {
    console.error(sourceSkillDocumentFailures.join("\n"));
    process.exit(1);
}

console.log(`source skill documents verify ok: ${productSkills.length} product skills`);

function checkProductSkillCatalog() {
    for (const skill of productSkills) {
        checkAuthoredSkillDocument(skill);
    }
    if (existsSync(sourceSkillRoot)) {
        for (const entry of readdirSync(sourceSkillRoot, { withFileTypes: true })) {
            if (entry.isDirectory() && !expectedSkillNames.has(entry.name)) {
                sourceSkillDocumentFailures.push(`unexpected source skill: ${entry.name}`);
            }
        }
    }
}

function checkAuthoredSkillDocument(skill) {
    const skillName = skill.name;
    if (!isValidProductSkillName(skillName)) {
        sourceSkillDocumentFailures.push(`invalid skill name: ${skillName}`);
    }
    const file = join(sourceSkillRoot, skillName, "SKILL.md");
    if (!existsSync(file)) {
        sourceSkillDocumentFailures.push(`missing source skill: ${file}`);
        return;
    }
    const body = readFileSync(file, "utf8");
    const frontmatter = parseFrontmatter(body);
    if (!frontmatter) {
        if (!body.startsWith("---\n")) {
            sourceSkillDocumentFailures.push(`missing frontmatter: ${file}`);
        }
        else {
            sourceSkillDocumentFailures.push(`unterminated frontmatter: ${file}`);
        }
        return;
    }
    verifyFrontmatterSchema(file, skill, frontmatter);
    if (!body.includes(`# ${skillName}`)) {
        sourceSkillDocumentFailures.push(`wrong title: ${file}`);
    }
}

function parseFrontmatter(body) {
    if (!body.startsWith("---\n")) {
        return null;
    }
    const end = body.indexOf("\n---\n", 4);
    if (end === -1) {
        return null;
    }
    return body.slice(4, end).split("\n");
}

function verifyFrontmatterSchema(file, skill, frontmatterLines) {
    const skillName = skill.name;
    const keyEntries = collectFrontmatterKeys(frontmatterLines);
    const actualKeys = keyEntries.map((entry) => entry.key);
    if (actualKeys.join("\n") !== requiredFrontmatterKeys.join("\n")) {
        sourceSkillDocumentFailures.push(`${file} frontmatter keys must be ${requiredFrontmatterKeys.join(", ")}`);
    }
    if (actualKeys.includes("allowed-tools")) {
        sourceSkillDocumentFailures.push(`${file} must not declare allowed-tools; product skills should not restrict host tool availability`);
    }
    const values = new Map(keyEntries.map((entry) => [entry.key, entry.value]));
    if (values.get("name") !== skillName) {
        sourceSkillDocumentFailures.push(`frontmatter name mismatch: ${file}`);
    }
    const expectedTier = expectedPreambleTier(skill);
    if (values.get("preamble-tier") !== expectedTier) {
        sourceSkillDocumentFailures.push(`${file} preamble-tier must be ${expectedTier} for ${skill.layer} layer`);
    }
    if (values.get("version") !== "1.0.0") {
        sourceSkillDocumentFailures.push(`invalid frontmatter version: ${file}`);
    }
    if (values.get("description") !== "|") {
        sourceSkillDocumentFailures.push(`description must be block scalar: ${file}`);
    }
    verifyDescriptionBlock(file, frontmatterLines, keyEntries);
    if (!isInlineArray(values.get("benefits-from"))) {
        sourceSkillDocumentFailures.push(`benefits-from must be an inline array: ${file}`);
    }
    const triggers = collectListValues(frontmatterLines, keyEntries, "triggers");
    if (triggers.length === 0) {
        sourceSkillDocumentFailures.push(`triggers must include at least one item: ${file}`);
    }
}

function expectedPreambleTier(skill) {
    if (skill.layer === "recipe" || skill.layer === "role") {
        return "3";
    }
    if (skill.layer === "flow") {
        return highPreambleFlowSkills.has(skill.name) ? "3" : "2";
    }
    if (skill.layer === "guard" || skill.layer === "internal") {
        return "1";
    }
    return "2";
}

function collectFrontmatterKeys(lines) {
    const entries = [];
    for (let index = 0; index < lines.length; index += 1) {
        const match = lines[index].match(/^([a-z][a-z0-9-]*):(?:\s*(.*))?$/);
        if (!match) {
            continue;
        }
        entries.push({ key: match[1], value: match[2] ?? "", index });
    }
    return entries;
}

function verifyDescriptionBlock(file, lines, keyEntries) {
    const description = collectBlock(lines, keyEntries, "description").join("\n");
    for (const requiredText of ["Use when", "Proactively suggest", "Voice triggers"]) {
        if (!description.includes(requiredText)) {
            sourceSkillDocumentFailures.push(`description missing "${requiredText}": ${file}`);
        }
    }
}

function collectListValues(lines, keyEntries, key) {
    return collectBlock(lines, keyEntries, key)
        .map((line) => line.match(/^-\s+(.+)$/)?.[1])
        .filter(Boolean);
}

function collectBlock(lines, keyEntries, key) {
    const startEntry = keyEntries.find((entry) => entry.key === key);
    if (!startEntry) {
        return [];
    }
    const nextEntry = keyEntries.find((entry) => entry.index > startEntry.index);
    const end = nextEntry ? nextEntry.index : lines.length;
    return lines.slice(startEntry.index + 1, end)
        .filter((line) => line.startsWith("  "))
        .map((line) => line.slice(2));
}

function isInlineArray(value) {
    return /^\[[^\]]*\]$/.test(value ?? "");
}
