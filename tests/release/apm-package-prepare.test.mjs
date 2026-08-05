import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, it } from "node:test";

const tempRoots = [];

afterEach(() => {
    for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("apm package preparation", () => {
    it("prepares the package at a resolved safe output path", () => {
        const fixture = createFixture();
        const output = join(fixture, "tmp", "prepared");
        const result = runPrepare(fixture, output);

        assert.equal(result.status, 0, result.stderr || result.stdout);
        assert.equal(existsSync(join(output, "apm.yml")), true);
        assert.equal(existsSync(join(output, "packages", "core", "apm.yml")), true);
        assert.match(result.stdout, new RegExp(`prepared build-stacks package at ${escapeRegExp(resolve(output))}`));

        const repeated = runPrepare(fixture, output);
        assert.equal(repeated.status, 0, repeated.stderr || repeated.stdout);
    });

    it("rejects the repository root and its ancestors before deletion", () => {
        const parent = createTempRoot();
        const fixture = createFixture(join(parent, "repo"));

        for (const output of [fixture, parent]) {
            const result = runPrepare(fixture, output);
            assert.notEqual(result.status, 0);
            assert.match(result.stderr, /refusing unsafe package output: .*repository root or one of its ancestors/);
            assert.equal(existsSync(join(fixture, "README.md")), true, `unsafe output removed fixture for ${output}`);
        }
    });

    it("rejects outputs equal to or nested within copied source paths", () => {
        for (const suffix of [["docs"], ["packages", "generated"], ["scripts", "generated"]]) {
            const fixture = createFixture();
            const output = join(fixture, ...suffix);
            const result = runPrepare(fixture, output);

            assert.notEqual(result.status, 0);
            assert.match(result.stderr, /refusing unsafe package output: .*overlaps package source/);
            assert.equal(existsSync(join(fixture, "README.md")), true);
        }
    });

    it("rejects a resolved output whose symlinked parent enters a source path", () => {
        const fixture = createFixture();
        const link = join(fixture, "tmp", "docs-link");
        mkdirSync(dirname(link), { recursive: true });
        symlinkSync(join(fixture, "docs"), link, "dir");

        const result = runPrepare(fixture, join(link, "generated"));
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /refusing unsafe package output: .*overlaps package source/);
        assert.equal(existsSync(join(fixture, "docs", "guide.md")), true);
    });

    it("rejects a symlink output located inside a source path", () => {
        const fixture = createFixture();
        const external = createTempRoot();
        const output = join(fixture, "docs", "prepared-link");
        symlinkSync(external, output, "dir");

        const result = runPrepare(fixture, output);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /refusing unsafe package output: .*overlaps package source/);
        assert.equal(existsSync(output), true);
    });

    it("rejects the OS temporary root itself without deleting it", () => {
        const fixture = createFixture();
        const isolatedOsTemp = createTempRoot();
        writeFileSync(join(isolatedOsTemp, "sentinel.txt"), "keep\n");

        const result = runPrepare(fixture, isolatedOsTemp, { TMPDIR: isolatedOsTemp });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /refusing unsafe package output/);
        assert.equal(readFileSync(join(isolatedOsTemp, "sentinel.txt"), "utf8"), "keep\n");
    });

    it("rejects an existing nonempty temporary target without an owner marker", () => {
        const fixture = createFixture();
        const isolatedOsTemp = createTempRoot();
        const output = join(isolatedOsTemp, "build-stacks-sentinel-fixture", "package");
        mkdirSync(output, { recursive: true });
        writeFileSync(join(output, "sentinel.txt"), "keep\n");

        const result = runPrepare(fixture, output, { TMPDIR: isolatedOsTemp });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /without owner marker/);
        assert.equal(readFileSync(join(output, "sentinel.txt"), "utf8"), "keep\n");
    });
});

describe("APM 0.26 consumer compile guidance", () => {
    for (const path of [
        "README.md",
        "docs/migration-v2.md",
        "packages/maintainer/.apm/skills/build-runtime-upgrade/SKILL.md"
    ]) {
        it(`${path} compiles context before validation`, () => {
            const body = readFileSync(path, "utf8");
            assert.doesNotMatch(body, /--local-only/);
            assert.ok(body.indexOf("apm compile --all") < body.indexOf("apm compile --validate"));
            assert.match(body, /test -f AGENTS\.md && test -f GEMINI\.md/);
        });
    }

    it("investigate discovers the v2 scope guard and preserves its report-only contract", () => {
        const body = readFileSync("packages/core/.apm/skills/build-recipe-investigate/SKILL.md", "utf8");
        assert.doesNotMatch(body, /freeze\/bin\/check-freeze\.sh|FREEZE_AVAILABLE/);
        assert.match(body, /\.agents\/skills\/build-guard-scope/);
        assert.match(body, /BUILD_GUARD_SCOPE_SKILL_DIR\/scripts\/check-freeze\.sh/);
        assert.match(body, /scope_guard: report_only/);
        assert.match(body, /does not by itself prove enforcement/);
    });
});

function createFixture(root = createTempRoot()) {
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "packages", "core"), { recursive: true });
    mkdirSync(join(root, "docs"), { recursive: true });
    cpSync("scripts/apm-package-prepare.mjs", join(root, "scripts", "apm-package-prepare.mjs"));
    for (const [path, contents] of [
        [".apmignore", "tmp/\n"],
        ["apm.yml", "name: fixture\n"],
        ["README.md", "# fixture\n"],
        ["LICENSE", "fixture\n"],
        ["CHANGELOG.md", "# changes\n"],
        ["package.json", "{\"type\":\"module\"}\n"],
        ["package-lock.json", "{}\n"],
        ["docs/guide.md", "fixture\n"],
        ["packages/core/apm.yml", "name: fixture-core\n"]
    ]) {
        const target = join(root, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, contents);
    }
    return root;
}

function createTempRoot() {
    const root = mkdtempSync(join(tmpdir(), "build-stacks-package-prepare-"));
    tempRoots.push(root);
    return root;
}

function runPrepare(fixture, output, env = {}) {
    return spawnSync("node", [join(fixture, "scripts", "apm-package-prepare.mjs"), "--out", output], {
        cwd: fixture,
        env: { ...process.env, ...env },
        encoding: "utf8"
    });
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
