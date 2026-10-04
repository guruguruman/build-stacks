import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("authored skills use host-neutral operational language", () => {
    assert.equal(existsSync("scripts/host-neutral-source-verify.mjs"), true);
    const result = spawnSync("node", ["scripts/host-neutral-source-verify.mjs"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
