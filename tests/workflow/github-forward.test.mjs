import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("GitHub workflows handle approval, remote drift, retry, labels, and PR states with mocked gh", () => {
    const result = spawnSync("node", ["scripts/github-workflow-forward-test.mjs"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /7 scenarios/);
});
