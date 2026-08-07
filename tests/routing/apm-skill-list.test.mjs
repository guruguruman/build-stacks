import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPackages, buildSkills, isValidBuildSkillName, packageClosure } from "../../scripts/build-skill-catalog.mjs";
const expect = (actual, message) => ({
    toBe: (expected) => assert.strictEqual(actual, expected, message),
    toEqual: (expected) => assert.deepStrictEqual(actual, expected, message),
    toContain: (expected) => assert.ok(actual.includes(expected), message ?? `expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`),
    toBeGreaterThanOrEqual: (expected) => assert.ok(actual >= expected, message ?? `expected ${actual} to be >= ${expected}`),
    not: {
        toContain: (expected) => assert.ok(!actual.includes(expected), message ?? `expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(expected)}`)
    }
});
describe("APM skill list", () => {
    test("contains only build names with the expected package closures", () => {
        expect(buildSkills.length).toBe(55);
        expect(buildSkills.every((skill) => isValidBuildSkillName(skill.name))).toBe(true);
        expect(buildPackages.map((pkg) => pkg.id)).toEqual(["core", "browser", "design", "product", "delivery", "maintainer"]);
        expect(buildPackages.map((pkg) => packageClosure(pkg.id).length)).toEqual([9, 17, 23, 30, 36, 55]);
    });

    test("publishes bilingual activation contracts and explicit role stances", () => {
        for (const skill of buildSkills) {
            expect(skill.activationExamples.some((example) => /[A-Za-z]/.test(example))).toBe(true);
            expect(skill.activationExamples.some((example) => /[\u3040-\u30ff\u3400-\u9fff]/u.test(example))).toBe(true);
            assert.match(skill.naturalActivationExamples.en, /^Please\s.+\.$/);
            assert.match(skill.naturalActivationExamples.ja, /[\u3040-\u30ff\u3400-\u9fff]/u);
            assert.doesNotMatch(skill.naturalActivationExamples.en, new RegExp(skill.name));
            assert.doesNotMatch(skill.naturalActivationExamples.ja, new RegExp(skill.name));
            expect(["coordinator", "role", "support", "internal"]).toContain(skill.routingKind);
            if (skill.layer === "role") {
                expect(typeof skill.roleStance).toBe("string");
                expect(skill.roleStance.length).toBeGreaterThanOrEqual(20);
            }
        }
    });

    test("gives an explicitly named role precedence over an adjacent coordinator", () => {
        const routing = readFileSync("packages/core/.apm/instructions/build-core-routing.instructions.md", "utf8");
        assert.match(routing, /An explicitly named role owns the response/);
        assert.match(routing, /エンジニアリングマネージャーとして/);

        const planTune = buildSkills.find((skill) => skill.name === "build-flow-plantune");
        assert.match(planTune.activationExclusions.join("\n"), /named role stance/);

        const browserQa = buildSkills.find((skill) => skill.name === "build-browser-qa");
        const qaReport = buildSkills.find((skill) => skill.name === "build-flow-qareport");
        assert.match(browserQa.activationExclusions.join("\n"), /without substituting/);
        assert.match(qaReport.activationExclusions.join("\n"), /capture fresh evidence/);

        const sourceDeploy = buildSkills.find((skill) => skill.name === "build-source-deploy");
        assert.equal(sourceDeploy.naturalActivationExamples.ja, "承認済みのデプロイ環境設定をリポジトリへ組み込んで");
    });
});
