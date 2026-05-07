import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const expect = (actual, message) => ({
    toBe: (expected) => assert.strictEqual(actual, expected, message),
    toEqual: (expected) => assert.deepStrictEqual(actual, expected, message),
    toContain: (expected) => assert.ok(actual.includes(expected), message ?? `expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`),
    toBeGreaterThanOrEqual: (expected) => assert.ok(actual >= expected, message ?? `expected ${actual} to be >= ${expected}`),
    not: {
        toContain: (expected) => assert.ok(!actual.includes(expected), message ?? `expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(expected)}`)
    }
});
describe("discovery guide", () => {
    test("is available as a product recipe", () => {
        const body = readFileSync(".apm/skills/product-recipe-discovery/SKILL.md", "utf8");
        expect(body).toContain("product-recipe-discovery");
        expect(body).toContain("HARD GATE");
        expect(body).toContain("The Six Forcing Questions");
        expect(body).toContain(".product-build-stacks/design-docs");
    });
});
