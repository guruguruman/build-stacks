import assert from "node:assert/strict";
import { chmodSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("install-only activation smoke leaves the real Codex system tree byte-for-byte untouched", () => {
    const fixture = mkdtempSync(join(tmpdir(), "codex-smoke-isolation-"));
    try {
        const systemRoot = join(fixture, "skills", ".system");
        const sentinel = join(systemRoot, "sentinel.txt");
        mkdirSync(systemRoot, { recursive: true });
        writeFileSync(sentinel, "user-owned\n");
        chmodSync(sentinel, 0o640);
        const fixedTime = new Date("2024-02-03T04:05:06.000Z");
        utimesSync(sentinel, fixedTime, fixedTime);
        utimesSync(systemRoot, fixedTime, fixedTime);
        const before = snapshot(systemRoot, sentinel);

        const result = spawnSync("node", ["scripts/codex-skill-activation-smoke.mjs", "--install-only"], {
            cwd: resolve("."),
            encoding: "utf8",
            env: { ...process.env, BUILD_CODEX_REAL_HOME: fixture }
        });
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        assert.deepEqual(snapshot(systemRoot, sentinel), before);
    }
    finally {
        rmSync(fixture, { recursive: true, force: true });
    }
});

test("install-only browser smoke leaves the real Codex system tree byte-for-byte untouched", () => {
    const fixture = mkdtempSync(join(tmpdir(), "codex-browser-smoke-isolation-"));
    const runRoot = mkdtempSync(join(tmpdir(), "build-browser-core-smoke-test-"));
    try {
        const systemRoot = join(fixture, "skills", ".system");
        const sentinel = join(systemRoot, "sentinel.txt");
        mkdirSync(systemRoot, { recursive: true });
        writeFileSync(sentinel, "user-owned-browser\n");
        chmodSync(sentinel, 0o640);
        const fixedTime = new Date("2024-03-04T05:06:07.000Z");
        utimesSync(sentinel, fixedTime, fixedTime);
        utimesSync(systemRoot, fixedTime, fixedTime);
        const before = snapshot(systemRoot, sentinel);

        const result = spawnSync("node", ["scripts/codex-browser-core-smoke.mjs", "--install-only"], {
            cwd: resolve("."),
            encoding: "utf8",
            env: {
                ...process.env,
                BUILD_CODEX_REAL_HOME: fixture,
                BUILD_CODEX_BROWSER_SMOKE_ROOT: runRoot
            }
        });
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        assert.deepEqual(snapshot(systemRoot, sentinel), before);
    }
    finally {
        rmSync(fixture, { recursive: true, force: true });
        rmSync(runRoot, { recursive: true, force: true });
    }
});

function snapshot(systemRoot, sentinel) {
    const root = lstatSync(systemRoot);
    const file = statSync(sentinel);
    return {
        rootInode: root.ino,
        rootMode: root.mode & 0o777,
        rootMtimeMs: root.mtimeMs,
        fileInode: file.ino,
        fileMode: file.mode & 0o777,
        fileMtimeMs: file.mtimeMs,
        content: readFileSync(sentinel, "utf8")
    };
}
