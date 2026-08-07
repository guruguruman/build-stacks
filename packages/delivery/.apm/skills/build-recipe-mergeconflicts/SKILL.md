---
name: build-recipe-mergeconflicts
description: "Resolve merge and rebase conflicts from the intent of both sides. Use when the user asks to resolve merge and rebase conflicts from the intent of both sides. Common requests include \"resolve merge conflicts\", \"fix rebase conflicts\", \"conflict resolution\"."
---

# build-recipe-mergeconflicts

Resolve conflicts from primary intent, not by choosing ours or theirs mechanically.

## Workflow

1. Confirm the repository is in a merge or rebase and list every conflicted path. Read status without mutating it.
2. Identify both sides for each hunk. Read the introducing commits, messages, tests, linked specs or issues, and nearby code.
3. State the two intents and whether they are compatible. Preserve both where possible; when incompatible, choose the result that serves the stated integration goal and record the trade-off.
4. Edit only conflicted files and directly required integration fixes. Do not introduce unrelated behavior.
5. Verify conflict markers are gone, inspect the staged diff, and run repository checks from focused to full.
6. Present the resolved state and evidence. Continuing a rebase, creating a merge commit, force-pushing, aborting, or publishing requires explicit approval immediately before that action.

## Failure Modes

- If primary intent cannot be recovered, stop on that hunk and ask for the missing decision.
- If tests expose a pre-existing failure unrelated to integration, report it separately rather than silently widening scope.
- Never use broad checkout/reset commands to make conflicts disappear.

## Output Contract

- operation and conflicted paths
- intent of each side
- resolution and trade-offs per hunk
- checks and staged diff evidence
- continuation status
- residual risk
- next handoff
