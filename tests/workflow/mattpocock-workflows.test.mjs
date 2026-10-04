import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, test } from "node:test";

const fixtures = [];
const wizardTemplate = resolve("packages/delivery/.apm/skills/build-flow-humanwizard/assets/wizard-template.sh");

afterEach(() => {
    for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

describe("ported workflow contracts", () => {
    test("removes broad setup and teaching workflows and consolidates questionnaire and wayfinding", () => {
        for (const path of [
            "packages/workflow/apm.yml",
            "packages/product/.apm/skills/build-recipe-wayfinding/SKILL.md"
        ]) assert.equal(existsSync(path), false, path);

        const discovery = readFileSync("packages/product/.apm/skills/build-recipe-discovery/SKILL.md", "utf8");
        const decisionArtifacts = readFileSync(
            "packages/product/.apm/skills/build-recipe-discovery/references/decision-artifacts.md",
            "utf8"
        );
        assert.match(discovery, /External questionnaire mode/);
        assert.match(discovery, /Multi-session decision work/);
        assert.match(decisionArtifacts, /unblocked frontier/);
        assert.equal(existsSync("packages/product/.apm/skills/build-recipe-discovery/assets/questionnaire-template.md"), true);
    });

    test("wizard confirms every secret write and never exposes values in arguments or xtrace", () => {
        const syntax = spawnSync("bash", ["-n", wizardTemplate], { encoding: "utf8" });
        assert.equal(syntax.status, 0, syntax.stderr);

        const root = fixture("wizard-");
        const helpers = readFileSync(wizardTemplate, "utf8").split("# STAGES:")[0];
        const privateEnv = join(root, ".env");
        const writeScript = join(root, "write-private.sh");
        writeFileSync(writeScript, `${helpers}\nTOKEN_VALUE=abc_123-xyz\nwrite_private_env "$1" TOKEN TOKEN_VALUE\n`);
        let result = spawnSync("bash", [writeScript, privateEnv], { encoding: "utf8", input: "n\n" });
        assert.notEqual(result.status, 0);
        assert.equal(existsSync(privateEnv), false);

        result = spawnSync("bash", [writeScript, privateEnv], { encoding: "utf8", input: "y\n" });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(statSync(privateEnv).mode & 0o777, 0o600);
        assert.equal(readFileSync(privateEnv, "utf8"), "TOKEN=abc_123-xyz\n");

        const unsafeEnv = join(root, "unsafe.env");
        const unsafeScript = join(root, "reject-unsafe.sh");
        writeFileSync(unsafeScript, `${helpers}\nTOKEN_VALUE='contains space'\nif write_private_env "$1" TOKEN TOKEN_VALUE; then exit 9; fi\n`);
        result = spawnSync("bash", [unsafeScript, unsafeEnv], { encoding: "utf8", input: "y\n" });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(existsSync(unsafeEnv), false);

        const directoryEnv = join(root, "directory.env");
        mkdirSync(directoryEnv);
        const nonRegularScript = join(root, "reject-non-regular.sh");
        writeFileSync(nonRegularScript, `${helpers}\nTOKEN_VALUE=safe\nif write_private_env "$1" TOKEN TOKEN_VALUE; then exit 9; fi\n`);
        result = spawnSync("bash", [nonRegularScript, directoryEnv], { encoding: "utf8", input: "y\n" });
        assert.equal(result.status, 0, result.stderr);

        const bin = join(root, "bin");
        mkdirSync(bin, { recursive: true });
        const gh = join(bin, "gh");
        writeFileSync(gh, "#!/usr/bin/env bash\nprintf '%s\\n' \"$@\" > \"$GH_ARGS\"\nIFS= read -r value || true\nprintf '%s' \"$value\" > \"$GH_STDIN\"\n");
        chmodSync(gh, 0o755);
        const ghScript = join(root, "gh-secret.sh");
        writeFileSync(ghScript, `${helpers}\nset_gh_secret TOKEN SECRET_VALUE\n`);
        const argsPath = join(root, "args.txt");
        const stdinPath = join(root, "stdin.txt");
        result = spawnSync("bash", [ghScript], {
            encoding: "utf8",
            input: "n\n",
            env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}`, GH_ARGS: argsPath, GH_STDIN: stdinPath, SECRET_VALUE: "super-secret-value" }
        });
        assert.notEqual(result.status, 0);
        assert.equal(existsSync(argsPath), false);
        assert.equal(existsSync(stdinPath), false);

        result = spawnSync("bash", ["-x", ghScript], {
            encoding: "utf8",
            input: "y\n",
            env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}`, GH_ARGS: argsPath, GH_STDIN: stdinPath, SECRET_VALUE: "super-secret-value" }
        });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(readFileSync(argsPath, "utf8"), "secret\nset\nTOKEN\n");
        assert.equal(readFileSync(stdinPath, "utf8"), "super-secret-value");
        assert.doesNotMatch(readFileSync(argsPath, "utf8"), /super-secret-value/);
        assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /super-secret-value/);
        assert.doesNotMatch(readFileSync(wizardTemplate, "utf8"), /%q/);
    });

    test("merge conflict contract reaches a staged conflict-free resolution", () => {
        const root = fixture("merge-conflict-");
        git(root, ["init", "-b", "main"]);
        git(root, ["config", "user.name", "Fixture"]);
        git(root, ["config", "user.email", "fixture@example.test"]);
        writeFileSync(join(root, "value.txt"), "base\n");
        git(root, ["add", "--", "value.txt"]);
        git(root, ["commit", "-m", "base"]);
        git(root, ["switch", "-c", "other"]);
        writeFileSync(join(root, "value.txt"), "other\n");
        git(root, ["commit", "-am", "other"]);
        git(root, ["switch", "main"]);
        writeFileSync(join(root, "value.txt"), "main\n");
        git(root, ["commit", "-am", "main"]);
        const merge = spawnSync("git", ["merge", "other"], { cwd: root, encoding: "utf8" });
        assert.notEqual(merge.status, 0);
        assert.equal(git(root, ["diff", "--name-only", "--diff-filter=U"]).stdout.trim(), "value.txt");

        writeFileSync(join(root, "value.txt"), "main\nother\n");
        git(root, ["add", "--", "value.txt"]);
        assert.equal(git(root, ["diff", "--name-only", "--diff-filter=U"]).stdout.trim(), "");
        assert.match(git(root, ["diff", "--cached"]).stdout, /main\n\+other/);

        const contract = readFileSync("packages/delivery/.apm/skills/build-recipe-mergeconflicts/SKILL.md", "utf8");
        assert.match(contract, /git add -- <exact-paths>/);
        assert.match(contract, /git diff --name-only --diff-filter=U/);
    });

    test("review, tracker, and shipping contracts are consistent and repository-native", () => {
        const staff = readFileSync("packages/delivery/.apm/skills/build-role-staffengineer/SKILL.md", "utf8");
        assert.match(staff, /Remain read-only/);
        assert.match(staff, /Never edit, stage, commit, push, post comments/);
        assert.doesNotMatch(staff, /Fix-first|AUTO-FIX/);

        const spec = readFileSync("packages/product/.apm/skills/build-flow-specwork/SKILL.md", "utf8");
        const triage = readFileSync("packages/delivery/.apm/skills/build-flow-triage/SKILL.md", "utf8");
        const ship = readFileSync("packages/delivery/.apm/skills/build-recipe-ship/SKILL.md", "utf8");
        for (const body of [spec, triage, ship]) {
            assert.match(body, /Use `gh` directly|use `gh issue create|GitHub publication/);
            assert.doesNotMatch(body, /build-flow-projectsetup/);
        }
        assert.doesNotMatch(triage, /Move one request through a visible state machine/);
        assert.match(triage, /repository-native/);
        assert.doesNotMatch(ship, /fully automated|auto-commit|Generated with/);
        assert.doesNotMatch(ship, /gh pr view --head/);
        assert.match(ship, /gh pr list --head <branch>/);
        assert.match(ship, /OPEN/);
        assert.match(ship, /`CLOSED`\/`MERGED`/);
        assert.match(ship, /never edit/i);
        assert.match(ship, /Skill invocation alone is not approval/);
    });

    test("upgrade verification observes the installed 2.1.0 skill set instead of a stale fixed count", () => {
        const upgrade = readFileSync("packages/maintainer/.apm/skills/build-runtime-upgrade/SKILL.md", "utf8");
        assert.match(upgrade, /2\.1\.0/);
        assert.doesNotMatch(upgrade, /2\.0\.0|47 skills|47スキル/);
        assert.match(upgrade, /apm audit --ci/);
        assert.match(upgrade, /deployed_files/);
        assert.match(upgrade, /\.agents.*\.claude.*\.kiro/s);
    });
});

function fixture(prefix) {
    const path = mkdtempSync(join(tmpdir(), prefix));
    fixtures.push(path);
    return path;
}

function git(root, args) {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, `${args.join(" ")}\n${result.stderr}`);
    return result;
}
