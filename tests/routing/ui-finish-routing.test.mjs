import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sourceRoot = ".apm/skills";
const webSkill = "product-flow-webuifinish";
const mobileSkill = "product-flow-mobileuifinish";

describe("UI finish routing", () => {
    it("keeps Web and Mobile finish triggers explicit and collision-free", () => {
        const targetNames = new Set([webSkill, mobileSkill]);
        const targetTriggers = new Map();

        for (const skillName of targetNames) {
            for (const trigger of readTriggers(readSkill(skillName))) {
                const key = normalizeTrigger(trigger);
                assert.equal(targetTriggers.has(key), false, `UI finish trigger collision: ${trigger}`);
                targetTriggers.set(key, skillName);
            }
        }

        for (const skillName of sourceSkillNames()) {
            if (targetNames.has(skillName)) {
                continue;
            }
            const overlaps = readTriggers(readSkill(skillName))
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

        assert.match(webDocument, /product-browser-runner/);
        assert.match(webDocument, /browser_activation/);
        assert.match(webDocument, /product-browser-qa/);
        assert.match(webDocument, /product-flow-qareport/);
        assert.match(webDocument, /product-recipe-qa/);
        assert.match(webDocument, /Responsive Web routes remain in this skill/);

        assert.match(mobileDocument, /iOS, Android, React Native, Expo, Flutter, Swift, Kotlin/);
        assert.match(mobileDocument, /product-flow-webuifinish/);
        assert.match(mobileDocument, /visual_artifact_status/);
        assert.match(mobileDocument, /Do not reset devices/);

        for (const skillName of [webSkill, mobileSkill]) {
            for (const reference of ["capture-protocol.md", "design-guidance.md", "project-adapter.md", "scoring-rubric.md"]) {
                assert.equal(existsSync(join(sourceRoot, skillName, "references", reference)), true, `missing ${skillName}/${reference}`);
            }
        }
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
