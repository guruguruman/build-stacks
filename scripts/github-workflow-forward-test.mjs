import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = mkdtempSync(join(tmpdir(), "build-stacks-fake-gh-"));
const bin = join(root, "bin");
const log = join(root, "gh.log");
const state = join(root, "state");

try {
    mkdirSync(bin, { recursive: true });
    installFakeGh(join(bin, "gh"));
    unauthenticatedPreflightStops();
    approvalDeclinePerformsNoWrite();
    missingLabelDoesNotCreateOneSilently();
    remoteStateIsRereadBeforeWrite();
    partialFailureRetriesOnlyTheMissingStep();
    openPullRequestIsEdited();
    closedOrMergedPullRequestCreatesANewRecord();
    console.log("mocked gh forward tests ok: 7 scenarios");
}
finally {
    rmSync(root, { recursive: true, force: true });
}

function unauthenticatedPreflightStops() {
    reset("unauthenticated");
    assert.notEqual(gh(["auth", "status"]).status, 0);
    assert.deepEqual(writeCommands(), []);
}

function approvalDeclinePerformsNoWrite() {
    reset("open-pr");
    assert.equal(gh(["auth", "status"]).status, 0);
    assert.equal(gh(["repo", "view", "--json", "nameWithOwner"]).status, 0);
    const approved = false;
    if (approved) gh(["issue", "create", "--title", "fixture"]);
    assert.deepEqual(writeCommands(), []);
}

function missingLabelDoesNotCreateOneSilently() {
    reset("missing-label");
    assert.equal(gh(["auth", "status"]).status, 0);
    const labels = JSON.parse(gh(["label", "list", "--json", "name"]).stdout);
    assert.deepEqual(labels, []);
    assert.deepEqual(writeCommands(), []);
}

function remoteStateIsRereadBeforeWrite() {
    reset("remote-update");
    const first = JSON.parse(gh(["issue", "view", "12", "--json", "body"]).stdout);
    const second = JSON.parse(gh(["issue", "view", "12", "--json", "body"]).stdout);
    assert.notEqual(first.body, second.body);
    gh(["issue", "edit", "12", "--body", `${second.body} + local delta`], { allowFailure: false });
    assert.deepEqual(writeCommands(), ["issue edit 12 --body remote update + local delta"]);
}

function partialFailureRetriesOnlyTheMissingStep() {
    reset("partial-failure");
    const created = gh(["issue", "create", "--title", "fixture"], { allowFailure: false });
    assert.match(created.stdout, /issues\/42/);
    assert.notEqual(gh(["issue", "edit", "42", "--add-label", "bug"]).status, 0);
    assert.equal(gh(["issue", "edit", "42", "--add-label", "bug"]).status, 0);
    const writes = writeCommands();
    assert.equal(writes.filter((line) => line.startsWith("issue create")).length, 1);
    assert.equal(writes.filter((line) => line.startsWith("issue edit")).length, 2);
}

function openPullRequestIsEdited() {
    reset("open-pr");
    const existing = JSON.parse(gh(["pr", "list", "--head", "topic", "--state", "all", "--limit", "1", "--json", "state,number"]).stdout)[0];
    assert.equal(existing.state, "OPEN");
    gh(["pr", "edit", String(existing.number), "--title", "updated"], { allowFailure: false });
    assert.deepEqual(writeCommands(), ["pr edit 7 --title updated"]);
}

function closedOrMergedPullRequestCreatesANewRecord() {
    for (const scenario of ["closed-pr", "merged-pr"]) {
        reset(scenario);
        const existing = JSON.parse(gh(["pr", "list", "--head", "topic", "--state", "all", "--limit", "1", "--json", "state,number"]).stdout)[0];
        assert.ok(["CLOSED", "MERGED"].includes(existing.state));
        gh(["pr", "create", "--base", "main", "--head", "topic", "--title", "new"], { allowFailure: false });
        assert.deepEqual(writeCommands(), ["pr create --base main --head topic --title new"]);
    }
}

function reset(scenario) {
    writeFileSync(log, "");
    writeFileSync(state, "0\n");
    process.env.FAKE_GH_SCENARIO = scenario;
}

function gh(args, options = {}) {
    const result = spawnSync("gh", args, {
        encoding: "utf8",
        env: {
            ...process.env,
            PATH: `${bin}${delimiter}${process.env.PATH}`,
            FAKE_GH_LOG: log,
            FAKE_GH_STATE: state
        }
    });
    if (options.allowFailure === false) assert.equal(result.status, 0, result.stderr);
    return result;
}

function writeCommands() {
    return readFileSync(log, "utf8").split("\n").filter((line) => /^(issue (create|edit|comment|close)|label create|pr (create|edit))\b/.test(line));
}

function installFakeGh(path) {
    writeFileSync(path, `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_GH_LOG"
scenario="\${FAKE_GH_SCENARIO:-}"
case "$1 $2" in
  "auth status") [[ "$scenario" != unauthenticated ]] ;;
  "repo view") printf '{"nameWithOwner":"fixture/repo"}\\n' ;;
  "label list") [[ "$scenario" == missing-label ]] && printf '[]\\n' || printf '[{"name":"bug"}]\\n' ;;
  "issue view")
    count=$(cat "$FAKE_GH_STATE"); count=$((count + 1)); printf '%s\\n' "$count" > "$FAKE_GH_STATE"
    [[ "$scenario" == remote-update && "$count" -gt 1 ]] && printf '{"body":"remote update"}\\n' || printf '{"body":"initial"}\\n'
    ;;
  "issue create") printf 'https://github.test/fixture/repo/issues/42\\n' ;;
  "issue edit")
    if [[ "$scenario" == partial-failure ]]; then
      count=$(cat "$FAKE_GH_STATE"); count=$((count + 1)); printf '%s\\n' "$count" > "$FAKE_GH_STATE"
      [[ "$count" -gt 1 ]]
    fi
    ;;
  "pr list")
    case "$scenario" in
      open-pr) printf '[{"state":"OPEN","number":7}]\\n' ;;
      closed-pr) printf '[{"state":"CLOSED","number":7}]\\n' ;;
      merged-pr) printf '[{"state":"MERGED","number":7}]\\n' ;;
      *) printf '[]\\n' ;;
    esac
    ;;
  "pr create") printf 'https://github.test/fixture/repo/pull/8\\n' ;;
  "pr edit") : ;;
esac
`);
    chmodSync(path, 0o755);
}
