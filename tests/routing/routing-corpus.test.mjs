import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSkills } from "../../scripts/build-skill-catalog.mjs";
import { routingCorpus } from "../../scripts/routing-corpus.mjs";

test("independent routing corpus covers every skill in Japanese and English", () => {
    const skillNames = buildSkills.map((skill) => skill.name).sort();
    const caseNames = routingCorpus.cases.map((entry) => entry.expectedPrimary).sort();
    assert.deepEqual(caseNames, skillNames);
    assert.equal(new Set(caseNames).size, 55);
    for (const entry of routingCorpus.cases) {
        const skill = buildSkills.find((candidate) => candidate.name === entry.expectedPrimary);
        assert.ok(/[\u3040-\u30ff\u3400-\u9fff]/u.test(entry.promptJa), entry.expectedPrimary);
        assert.ok(/[A-Za-z]/.test(entry.promptEn), entry.expectedPrimary);
        assert.doesNotMatch(entry.promptJa, new RegExp(entry.expectedPrimary));
        assert.doesNotMatch(entry.promptEn, new RegExp(entry.expectedPrimary));
        assert.notEqual(entry.promptJa, skill.naturalActivationExamples.ja);
        assert.notEqual(entry.promptEn, skill.naturalActivationExamples.en);
        assert.ok(Array.isArray(entry.forbiddenCoordinators));
        assert.ok(Array.isArray(entry.allowedRoles));
    }
});

test("collision corpus names the ambiguous workflow boundaries", () => {
    const ids = new Set(routingCorpus.collisions.map((entry) => entry.id));
    for (const id of [
        "plan-role-ja", "root-cause-en", "triage-ja", "staff-readonly-en", "ship-not-deploy-ja",
        "report-only-en", "infra-choice-ja", "one-design-en", "spec-after-decisions-ja",
        "wizard-only-human-en", "multi-role-ja", "autoplan-orchestration-en"
    ]) assert.ok(ids.has(id), id);
    for (const entry of routingCorpus.collisions) {
        assert.ok(["ja", "en"].includes(entry.language));
        assert.ok(Array.isArray(entry.forbiddenCoordinators));
        assert.ok(Array.isArray(entry.allowedRoles));
    }
});
