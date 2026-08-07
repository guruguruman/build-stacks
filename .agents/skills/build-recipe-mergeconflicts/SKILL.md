---
name: build-recipe-mergeconflicts
description: "Resolve merge and rebase conflicts from the intent of both sides. Use when the user asks to resolve merge and rebase conflicts from the intent of both sides. Natural requests include \"Please resolve merge and rebase conflicts from the intent of both sides.\" or \"rebaseの競合を両側の意図を残して解消して\". Do not use for ordinary implementation work without conflicted paths."
---

# build-recipe-mergeconflicts

Resolve conflicts from primary intent, not by choosing ours or theirs mechanically.

## Workflow

1. Confirm the repository is in a merge or rebase and list every conflicted path. Read status without mutating it.
2. Identify both sides for each hunk. Read the introducing commits, messages, tests, linked specs or issues, and nearby code.
3. State the two intents and whether they are compatible. Preserve both where possible; when incompatible, choose the result that serves the stated integration goal and record the trade-off.
4. Edit only conflicted files and directly required integration fixes. Do not introduce unrelated behavior.
5. Verify conflict markers are gone and run `git diff --check`. Stage only the resolved paths with `git add -- <exact-paths>`; never use a broad add.
6. Confirm `git diff --name-only --diff-filter=U` is empty, inspect `git diff --cached`, and run repository checks from focused to full.
7. Present the resolved and staged state. If the current request explicitly asks to continue the merge or rebase, run the appropriate continuation and verify the final status. Otherwise stop at the staged resolution and request approval. Creating a merge commit, force-pushing, aborting, or publishing always requires explicit authorization for that action.

## Failure Modes

- If primary intent cannot be recovered, stop on that hunk and ask for the missing decision.
- If tests expose a pre-existing failure unrelated to integration, report it separately rather than silently widening scope.
- Never use broad checkout/reset commands to make conflicts disappear.
- If staging fails or an unmerged path remains, do not claim the conflict is resolved.

## Output Contract

- operation and conflicted paths
- intent of each side
- resolution and trade-offs per hunk
- checks and staged diff evidence
- continuation status
- residual risk
- next handoff
