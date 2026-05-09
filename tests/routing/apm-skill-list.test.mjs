import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { productSkills, isValidProductSkillName } from "../../scripts/apm-skill-list.mjs";
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
    test("contains only product names", () => {
        expect(productSkills.length).toBe(40);
        expect(productSkills.every((skill) => isValidProductSkillName(skill.name))).toBe(true);
    });
});
