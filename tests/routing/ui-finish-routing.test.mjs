import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { buildSkills } from "../../scripts/build-skill-catalog.mjs";

const webSkill = "build-flow-webuifinish";
const mobileSkill = "build-flow-mobileuifinish";

describe("UI finish routing", () => {
    it("keeps Web and Mobile finish triggers explicit and collision-free", () => {
        const targetNames = new Set([webSkill, mobileSkill]);
        const targetTriggers = new Map();

        for (const skillName of targetNames) {
            for (const trigger of readTriggers(skillName)) {
                const key = normalizeTrigger(trigger);
                assert.equal(targetTriggers.has(key), false, `UI finish trigger collision: ${trigger}`);
                targetTriggers.set(key, skillName);
            }
        }

        for (const { name: skillName } of buildSkills) {
            if (targetNames.has(skillName)) {
                continue;
            }
            const overlaps = readTriggers(skillName)
                .filter((trigger) => targetTriggers.has(normalizeTrigger(trigger)));
            assert.deepEqual(overlaps, [], `trigger collision with ${skillName}`);
        }

        for (const broadTrigger of ["QA", "browser QA", "design review", "screenshot", "Web", "mobile", "app", "UI"]) {
            assert.equal(targetTriggers.has(normalizeTrigger(broadTrigger)), false, `broad trigger must remain unclaimed: ${broadTrigger}`);
        }
    });

    it("declares the evidence and workflow boundary for each platform", () => {
        const webDocument = readSkill(webSkill);
        const mobileDocument = readSkill(mobileSkill);

        assert.match(webDocument, /build-browser-runner/);
        assert.match(webDocument, /browser_activation/);
        assert.match(webDocument, /build-browser-qa/);
        assert.match(webDocument, /build-flow-qareport/);
        assert.match(webDocument, /build-recipe-qa/);
        assert.match(webDocument, /Responsive Web routes remain in this skill/);

        assert.match(mobileDocument, /Native, cross-platform, and hybrid app screens belong here/);
        assert.match(mobileDocument, /build-flow-webuifinish/);
        assert.match(mobileDocument, /visual_artifact_status/);
        assert.match(mobileDocument, /Do not reset devices/);

        for (const skillName of [webSkill, mobileSkill]) {
            for (const reference of ["capture-protocol.md", "design-guidance.md", "project-adapter.md", "scoring-rubric.md"]) {
                assert.equal(existsSync(join(skillEntry(skillName).sourcePath, "references", reference)), true, `missing ${skillName}/${reference}`);
            }
        }
    });
});

function readSkill(skillName) {
    return readFileSync(join(skillEntry(skillName).sourcePath, "SKILL.md"), "utf8");
}

function readTriggers(skillName) {
    return skillEntry(skillName).activationExamples;
}

function skillEntry(skillName) {
    return buildSkills.find((entry) => entry.name === skillName);
}

function normalizeTrigger(trigger) {
    return trigger.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}
