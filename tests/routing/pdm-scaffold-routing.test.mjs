import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sourceRoot = ".apm/skills";
const targetSkill = "product-flow-pdmscaffold";

describe("product-flow-pdmscaffold routing", () => {
    it("uses unique explicit triggers and leaves adjacent workflows unclaimed", () => {
        const targetDocument = readSkill(targetSkill);
        const targetTriggers = readTriggers(targetDocument);
        const targetTriggerKeys = new Set(targetTriggers.map(normalizeTrigger));

        for (const skillName of sourceSkillNames()) {
            if (skillName === targetSkill) {
                continue;
            }
            const overlaps = readTriggers(readSkill(skillName))
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
        assert.match(targetDocument, /product-recipe-discovery/);
        assert.match(targetDocument, /product-flow-goaldirectedux/);
        assert.match(targetDocument, /product-flow-plantune/);
        assert.match(targetDocument, /product-role-docengineer/);
    });
});

function sourceSkillNames() {
    return readdirSync(sourceRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

function readSkill(skillName) {
    return readFileSync(join(sourceRoot, skillName, "SKILL.md"), "utf8");
}

function readTriggers(document) {
    const block = document.split("\ntriggers:\n", 2)[1]?.split("\n---\n", 1)[0] ?? "";
    return block
        .split("\n")
        .map((line) => line.match(/^  - (.+)$/)?.[1])
        .filter(Boolean);
}

function normalizeTrigger(trigger) {
    return trigger.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}
