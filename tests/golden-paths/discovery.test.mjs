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
        const root = "packages/product/.apm/skills/build-recipe-discovery";
        const body = ["SKILL.md", "references/extended-workflow.md"]
            .map((file) => readFileSync(`${root}/${file}`, "utf8"))
            .join("\n");
        expect(body).toContain("build-recipe-discovery");
        expect(body).toContain("HARD GATE");
        expect(body).toContain("The Six Forcing Questions");
        expect(body).toContain(".build-stacks/design-docs");
    });
});
