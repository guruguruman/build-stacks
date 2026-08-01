import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sourceRoot = ".apm/skills";
const targetSkill = "product-flow-securitygate";
const skillRoot = `${sourceRoot}/${targetSkill}`;
const pythonEnvironment = {
    ...process.env,
    PYTHONDONTWRITEBYTECODE: "1"
};

describe("product-flow-securitygate", () => {
    it("covers every control and passes its repository regression suite", () => {
        const selfCheck = runPython([
            `${skillRoot}/bin/security_gate_report.py`,
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
        assert.match(unitTests.stderr, /Ran 11 tests/);
        assert.match(unitTests.stderr, /OK/);
    });

    it("keeps release-gate triggers distinct from product-role-cso", () => {
        const targetDocument = readSkill(targetSkill);
        const targetTriggers = readTriggers(targetDocument);
        const targetTriggerKeys = new Set(targetTriggers.map(normalizeTrigger));

        for (const skillName of sourceSkillNames()) {
            if (skillName === targetSkill) {
                continue;
            }
            const overlaps = readTriggers(readSkill(skillName))
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

        assert.doesNotMatch(targetDocument, /^benefits-from:.*product-role-cso/m);
        assert.match(targetDocument, /Use `product-role-cso` for open-ended security reviews/);
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
