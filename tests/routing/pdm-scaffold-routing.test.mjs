import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildSkills } from "../../scripts/build-skill-catalog.mjs";

const targetSkill = "build-flow-pdmscaffold";

describe("build-flow-pdmscaffold routing", () => {
    it("uses unique explicit triggers and leaves adjacent workflows unclaimed", () => {
        const targetDocument = readSkill(targetSkill);
        const targetTriggers = readTriggers(targetSkill);
        const targetTriggerKeys = new Set(targetTriggers.map(normalizeTrigger));

        for (const { name: skillName } of buildSkills) {
            if (skillName === targetSkill) {
                continue;
            }
            const overlaps = readTriggers(skillName)
                .filter((trigger) => targetTriggerKeys.has(normalizeTrigger(trigger)));
            assert.deepEqual(overlaps, [], `trigger collision with ${skillName}`);
        }

        for (const broadTrigger of [
            "product plan",
            "personas",
            "requirements",
            "product brief",
            "discovery",
            "docs review",
            "plan review"
        ]) {
            assert.equal(targetTriggerKeys.has(normalizeTrigger(broadTrigger)), false, `broad trigger must remain unclaimed: ${broadTrigger}`);
        }

        assert.match(targetDocument, /Do not activate on the broad phrases/);
        assert.match(targetDocument, /build-recipe-discovery/);
        assert.match(targetDocument, /build-flow-goaldirectedux/);
        assert.match(targetDocument, /build-flow-plantune/);
        assert.match(targetDocument, /build-role-docengineer/);
    });
});

function readSkill(skillName) {
    const skill = buildSkills.find((entry) => entry.name === skillName);
    return readFileSync(`${skill.sourcePath}/SKILL.md`, "utf8");
}

function readTriggers(skillName) {
    return buildSkills.find((entry) => entry.name === skillName).activationExamples;
}

function normalizeTrigger(trigger) {
    return trigger.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}
