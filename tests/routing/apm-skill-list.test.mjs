import { describe, test } from "node:test";
import assert from "node:assert/strict";
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
        expect(buildSkills.length).toBe(59);
        expect(buildSkills.every((skill) => isValidBuildSkillName(skill.name))).toBe(true);
        expect(buildPackages.map((pkg) => pkg.id)).toEqual(["core", "workflow", "browser", "design", "product", "delivery", "maintainer"]);
        expect(buildPackages.map((pkg) => packageClosure(pkg.id).length)).toEqual([9, 12, 17, 23, 34, 39, 59]);
    });
});
