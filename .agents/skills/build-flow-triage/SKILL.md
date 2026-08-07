---
name: build-flow-triage
description: "Triage GitHub or local issues into verified agent-ready work. Use when the user asks to triage GitHub or local issues into verified agent-ready work. Natural requests include \"Please triage GitHub or local issues into verified agent-ready work.\" or \"このissueを調査して着手可能にして\". Do not use for root-cause debugging when no issue intake outcome is requested."
---

# build-flow-triage

Verify one issue and produce the smallest useful intake outcome. Adapt to the repository instead of imposing a label state machine.

## Intake

1. Identify the tracker from repository remotes and docs. GitHub and local Markdown are executable; other trackers are report-only.
2. Gather the full request, comments, labels, author context, linked pull request diff, and prior triage notes.
3. Read relevant behavior, tests, domain language, ADRs, prior issues, and explicit out-of-scope decisions.
4. Verify the claim:
   - bug: reproduce the symptom or explain the missing prerequisite;
   - request: confirm current behavior and affected seam;
   - pull request: inspect the diff and run relevant checks.
5. Recommend one outcome before changing anything: ready for agent, ready for human, needs specific information, already implemented, duplicate, or close with reason. Use repository-native wording.

Use [triage-templates.md](references/triage-templates.md) as content guidance, not as mandatory boilerplate.

## Local tracker

Preview and then write the result under `.build-stacks/issues/<feature>/`. Preserve established facts, acceptance evidence, unresolved questions, and links to any owning ticket.

## GitHub through gh

Use `gh` directly.

1. Run `gh auth status` and `gh repo view --json nameWithOwner`.
2. Read current state with `gh issue view <number> --json number,title,body,state,labels,comments,url`.
3. Inspect issue templates, `gh label list`, and recent repository examples. Reuse only labels whose meaning fits; do not create or require `needs-triage`, `ready-for-agent`, or another fixed taxonomy.
4. Prepare a concise title/body delta, comment, close rationale, and label additions or removals. Match the user's language and repository tone; omit AI or skill attribution.
5. Re-read the issue immediately before writing. If the remote changed, reconcile and preview the new delta.
6. Require explicit approval before `gh issue edit`, `gh issue comment`, or `gh issue close`. The current request may provide that approval when it names the operation and target.
7. After a write, re-read the issue and report its URL and resulting state. On partial failure, record the successful operation before retrying.

Creating a missing label is a separate repository write. Propose it only when the repository clearly needs a new concept and obtain explicit approval; otherwise communicate the outcome in the issue body or comment.

## Boundaries

- Do not fix product code unless the user separately asks for implementation.
- Do not convert uncertain product judgment into an “agent-ready” claim.
- Already implemented is not rejected work.
- Closing, assignment, project changes, and label creation are external writes.

## Output contract

- request identity and tracker
- verification evidence
- recommended and applied outcome
- title/body/comment/label delta
- external-write authorization and status
- URL or local path
- residual risk
- next handoff
