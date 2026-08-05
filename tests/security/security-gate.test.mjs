import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { buildSkills } from "../../scripts/build-skill-catalog.mjs";

const targetSkill = "build-flow-securitygate";
const skillRoot = "packages/delivery/.apm/skills/build-flow-securitygate";
const pythonEnvironment = {
    ...process.env,
    PYTHONDONTWRITEBYTECODE: "1"
};

describe("build-flow-securitygate", () => {
    it("covers every control and passes its repository regression suite", () => {
        const selfCheck = runPython([
            `${skillRoot}/scripts/security_gate_report.py`,
            "self-check"
        ]);
        assert.equal(selfCheck.status, 0, commandFailure(selfCheck));
        assert.match(selfCheck.stdout, /Skill coverage OK: 32 controls across 12 domains/);

        const unitTests = runPython([
            "-m",
            "unittest",
            "discover",
            "-s",
            "tests/security",
            "-p",
            "test_security_gate_report.py",
            "-q"
        ]);
        assert.equal(unitTests.status, 0, commandFailure(unitTests));
        assert.match(unitTests.stderr, /Ran 13 tests/);
        assert.match(unitTests.stderr, /OK/);
    });

    it("keeps release-gate triggers distinct from build-role-cso", () => {
        const targetDocument = readSkill(targetSkill);
        const targetTriggers = readTriggers(targetSkill);
        const targetTriggerKeys = new Set(targetTriggers.map(normalizeTrigger));

        for (const { name: skillName } of buildSkills) {
            if (skillName === targetSkill) {
                continue;
            }
            const overlaps = readTriggers(skillName)
                .filter((trigger) => targetTriggerKeys.has(normalizeTrigger(trigger)));
            assert.deepEqual(overlaps, [], `security-gate trigger collision with ${skillName}`);
        }

        for (const broadTrigger of [
            "security review",
            "CSO review",
            "threat model",
            "auth review",
            "privacy review",
            "vulnerability baseline",
            "release review"
        ]) {
            assert.equal(targetTriggerKeys.has(normalizeTrigger(broadTrigger)), false, `broad trigger must remain unclaimed: ${broadTrigger}`);
        }

        assert.doesNotMatch(targetDocument, /^benefits-from:.*build-role-cso/m);
        assert.match(targetDocument, /Use `build-role-cso` for open-ended security reviews/);
        assert.match(targetDocument, /Do not invoke either role automatically/);
    });
});

function runPython(args) {
    return spawnSync("python3", args, {
        cwd: process.cwd(),
        encoding: "utf8",
        env: pythonEnvironment
    });
}

function commandFailure(result) {
    return [result.stdout, result.stderr, result.error?.message]
        .filter(Boolean)
        .join("\n");
}

function readSkill(skillName) {
    const skill = buildSkills.find((entry) => entry.name === skillName);
    return readFileSync(join(skill.sourcePath, "SKILL.md"), "utf8");
}

function readTriggers(skillName) {
    return buildSkills.find((entry) => entry.name === skillName).activationExamples;
}

function normalizeTrigger(trigger) {
    return trigger.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}
