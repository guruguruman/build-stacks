import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, test } from "node:test";

const fixtures = [];
const projectSetup = resolve("packages/workflow/.apm/skills/build-flow-projectsetup/scripts/setup-project.mjs");
const githubIssue = resolve("packages/workflow/.apm/skills/build-flow-projectsetup/scripts/github-issue.mjs");
const wizardTemplate = resolve("packages/delivery/.apm/skills/build-flow-humanwizard/assets/wizard-template.sh");

afterEach(() => {
    for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

describe("ported workflow contracts", () => {
    test("project setup is previewable, collision-safe, and idempotent", () => {
        const root = fixture("project-setup-");
        let result = spawnSync(process.execPath, [projectSetup, "--root", root, "--tracker", "local", "--context", "single"], { encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(existsSync(join(root, "CONTEXT.md")), false);

        result = spawnSync(process.execPath, [projectSetup, "--root", root, "--tracker", "local", "--context", "single", "--triage", "--write"], { encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(existsSync(join(root, "CONTEXT.md")), true);
        assert.match(readFileSync(join(root, ".apm/instructions/build-project-context.instructions.md"), "utf8"), /docs\/agents\/issue-tracker\.md/);

        result = spawnSync(process.execPath, [projectSetup, "--root", root, "--tracker", "local", "--context", "single", "--triage", "--write"], { encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(JSON.parse(result.stdout).changes.every((change) => change.action === "unchanged"), true);

        writeFileSync(join(root, "docs/agents/issue-tracker.md"), "user owned\n");
        result = spawnSync(process.execPath, [projectSetup, "--root", root, "--tracker", "github", "--context", "single", "--write"], { encoding: "utf8" });
        assert.equal(result.status, 2);
        assert.equal(readFileSync(join(root, "docs/agents/issue-tracker.md"), "utf8"), "user owned\n");

        const lateCollisionRoot = fixture("project-setup-late-collision-");
        writeFileSync(join(lateCollisionRoot, "CONTEXT.md"), "user context\n");
        result = spawnSync(process.execPath, [projectSetup, "--root", lateCollisionRoot, "--tracker", "local", "--context", "single", "--write"], { encoding: "utf8" });
        assert.equal(result.status, 2);
        assert.equal(readFileSync(join(lateCollisionRoot, "CONTEXT.md"), "utf8"), "user context\n");
        assert.equal(existsSync(join(lateCollisionRoot, "docs/agents/issue-tracker.md")), false);
        assert.equal(existsSync(join(lateCollisionRoot, ".build-stacks/issues")), false);
    });

    test("GitHub helper denies unapproved writes and handles mocked gh failures", () => {
        const root = fixture("github-helper-");
        const bin = join(root, "bin");
        mkdirSync(bin, { recursive: true });
        const gh = join(bin, "gh");
        writeFileSync(gh, `#!/usr/bin/env bash\nset -eu\ncase "$*" in\n  "auth status") echo authenticated ;;\n  "repo view --json nameWithOwner -q .nameWithOwner") echo owner/repo ;;\n  *"--add-label missing"*) echo "label not found" >&2; exit 4 ;;\n  "issue create --title Example --body-file "*) echo https://example.test/issues/1 ;;\n  *) echo ok ;;\nesac\n`);
        chmodSync(gh, 0o755);
        const env = { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}` };
        const body = join(root, "body.md");
        writeFileSync(body, "body\n");

        let result = spawnSync(process.execPath, [githubIssue, "--action", "create", "--title", "Example", "--body-file", body], { encoding: "utf8", env });
        assert.equal(result.status, 3);
        assert.match(result.stderr, /external write denied/);

        result = spawnSync(process.execPath, [githubIssue, "--action", "create", "--title", "Example", "--body-file", body, "--approved"], { encoding: "utf8", env });
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /owner\/repo/);

        result = spawnSync(process.execPath, [githubIssue, "--action", "label", "--issue", "1", "--label", "missing", "--approved"], { encoding: "utf8", env });
        assert.equal(result.status, 4);
        assert.match(result.stderr, /label not found/);
    });

    test("wizard template is valid Bash and keeps guarded primitives", () => {
        const result = spawnSync("bash", ["-n", wizardTemplate], { encoding: "utf8" });
        assert.equal(result.status, 0, result.stderr);
        const body = readFileSync(wizardTemplate, "utf8");
        assert.match(body, /read -r -s/);
        assert.match(body, /confirm/);
        assert.doesNotMatch(body, /set -x/);
    });

    test("complex skills preserve their observable safety modes", () => {
        const assertions = new Map([
            ["packages/delivery/.apm/skills/build-recipe-implement/SKILL.md", [/Red before green/i, /Commit only when the user requested it/]],
            ["packages/delivery/.apm/skills/build-recipe-mergeconflicts/SKILL.md", [/intent of both sides/i, /explicit approval/]],
            ["packages/delivery/.apm/skills/build-role-staffengineer/SKILL.md", [/read-only/, /Standards/, /Spec/]],
            ["packages/product/.apm/skills/build-flow-specwork/SKILL.md", [/tracer bullets/i, /blocking edges/i]],
            ["packages/product/.apm/skills/build-flow-domainmodeling/SKILL.md", [/CONTEXT\.md/, /ADR/]]
        ]);
        for (const [path, patterns] of assertions) {
            const body = readFileSync(path, "utf8");
            for (const pattern of patterns) assert.match(body, pattern, path);
        }
    });
});

function fixture(prefix) {
    const path = mkdtempSync(join(tmpdir(), prefix));
    fixtures.push(path);
    return path;
}
