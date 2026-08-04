import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const expect = (actual, message) => ({
    toBe: (expected) => assert.strictEqual(actual, expected, message),
    toEqual: (expected) => assert.deepStrictEqual(actual, expected, message),
    toContain: (expected) => assert.ok(actual.includes(expected), message ?? `expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`),
    toBeGreaterThanOrEqual: (expected) => assert.ok(actual >= expected, message ?? `expected ${actual} to be >= ${expected}`),
    not: {
        toContain: (expected) => assert.ok(!actual.includes(expected), message ?? `expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(expected)}`)
    }
});
const tempRoots = [];
afterEach(() => {
    for (const root of tempRoots.splice(0))
        rmSync(root, { recursive: true, force: true });
});
describe("ported guard hooks", () => {
    test("careful hook allows known build artifact cleanup but warns on source deletion", () => {
        const safe = runHook("packages/core/.apm/skills/build-guard-destructive/scripts/check-careful.sh", {
            tool_input: { command: "rm -rf node_modules" }
        });
        expect(JSON.parse(safe)).toEqual({});
        const risky = JSON.parse(runHook("packages/core/.apm/skills/build-guard-destructive/scripts/check-careful.sh", {
            tool_input: { command: "rm -rf src" }
        }));
        expect(risky.permissionDecision).toBe("ask");
        expect(risky.message).toContain("build-guard-destructive");
    });
    test("freeze hook denies edits outside the repo-local freeze boundary", () => {
        const root = mkdtempSync(join(tmpdir(), "build-guard-freeze-"));
        tempRoots.push(root);
        const state = join(root, "state");
        const allowed = join(root, "allowed");
        const other = join(root, "other");
        mkdirSync(state, { recursive: true });
        mkdirSync(allowed, { recursive: true });
        mkdirSync(other, { recursive: true });
        writeFileSync(join(state, "freeze-dir.txt"), `${allowed}\n`);
        const inside = runHook("packages/core/.apm/skills/build-guard-scope/scripts/check-freeze.sh", {
            tool_input: { file_path: join(allowed, "ok.mjs") }
        }, { BUILD_STATE_ROOT: state });
        expect(JSON.parse(inside)).toEqual({});
        const outside = JSON.parse(runHook("packages/core/.apm/skills/build-guard-scope/scripts/check-freeze.sh", {
            tool_input: { file_path: join(other, "no.mjs") }
        }, { BUILD_STATE_ROOT: state }));
        expect(outside.permissionDecision).toBe("deny");
        expect(outside.message).toContain("build-guard-scope");
    });
});
function runHook(path, input, env = {}) {
    const root = mkdtempSync(join(tmpdir(), "build-guard-hook-"));
    tempRoots.push(root);
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify(input));
    const proc = spawnSync("bash", ["-lc", 'cat "$1" | "$2"', "hook-runner", inputPath, path], {
        cwd: process.cwd(),
        env: { ...process.env, ...env },
        encoding: "utf8"
    });
    if (proc.status !== 0) {
        throw new Error(`hook failed (${proc.status})\nstdout:\n${proc.stdout}\nstderr:\n${proc.stderr}`);
    }
    return proc.stdout.trim();
}
