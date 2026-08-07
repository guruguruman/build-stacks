---
name: build-recipe-ship
description: "Prepare tests, coverage, docs, changelog, and PR handoff. Use when the user asks to prepare tests, coverage, docs, changelog, and PR handoff. Natural requests include \"Please prepare tests, coverage, docs, changelog, and PR handoff.\" or \"このブランチをPRに出せる状態にして\". Do not use for merge or production deployment."
---

# build-recipe-ship

Prepare a verified branch and a concise repository-native pull request handoff. This workflow never merges or deploys.

## Authorization modes

- `prepare`: default. Run checks and prepare the proposed commit/PR content without committing, pushing, or changing GitHub.
- `publish`: use only when the user's current request explicitly authorizes the named operations, such as “commit and push” or “create the PR”. Skill invocation alone is not approval.
- Ask immediately before any commit, push, force operation, or GitHub write that was not explicitly authorized in the current request.

Never treat prior publication, an existing PR, or a previous run as continuing authorization.

## Preflight

1. Read repository instructions, release docs, current branch, status, staged and unstaged diffs, branch commits, and the detected base branch.
2. Stop on the base branch for publication. A prepare-only review may still inspect uncommitted changes there.
3. Identify repository-native test, lint, build, version, changelog, and documentation expectations.
4. Separate unrelated work. Never stage everything blindly; name exact paths.

## Verification

1. Run focused checks, then the full relevant suite.
2. Review the complete diff read-only through the staff engineer stance when installed.
3. Resolve required documentation, changelog, migration, and release-note gaps inside the approved edit scope.
4. Re-run affected checks after any change.
5. Stop on unresolved regressions, merge conflicts, missing release decisions, or security blockers.

## Commit and push

When explicitly authorized:

1. Present the exact paths and proposed commit grouping.
2. Stage only named paths and inspect the staged diff.
3. Create coherent commits with repository-native messages; do not add AI attribution.
4. Verify the resulting branch again when code changed.
5. Compare local and remote branch state before `git push -u origin <branch>`.
6. Never force-push without separate explicit approval and a stated recovery plan.

## GitHub pull request

Use `gh` directly; do not require a build-stacks wrapper.

1. Run `gh auth status` and `gh repo view --json nameWithOwner`.
2. Read any pull request template and recent repository examples. Match the user's language and repository tone.
3. Run `gh pr list --head <branch> --state all --limit 1 --json url,number,state,title,body` to detect an existing PR.
4. Preview the title and body before a write unless the current request already supplied and authorized them.
5. Create with `gh pr create --base <base> --head <branch> --title <title> --body-file <file>`, or update the existing PR with `gh pr edit`.
6. Re-read the PR and return its URL. A partial failure must report which write succeeded before retrying.

PR content should summarize delivered behavior, verification, risks, and follow-up. Do not mention skill names, models, prompting, or “AI-generated” text unless the repository explicitly requires it.

## Idempotency

- Re-run every verification gate against the current diff.
- Do not duplicate commits or PRs.
- Update an open PR only when authorized; otherwise show the proposed delta.
- Record successful URLs in runtime evidence so a retry can reconcile remote state.

## Output contract

- mode and authorized operations
- branch, base, and diff scope
- verification results
- commit and push status
- PR preview or URL
- external-write status
- residual risk
- next handoff
