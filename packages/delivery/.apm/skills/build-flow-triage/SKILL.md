---
name: build-flow-triage
description: "Triage GitHub or local issues into verified agent-ready work. Use when the user asks to triage GitHub or local issues into verified agent-ready work. Common requests include \"triage issues\", \"verify a bug report\", \"make issue agent ready\"."
---

# build-flow-triage

Move one request through a visible state machine: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`.

## Preconditions

Read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md` when present. Official execution supports GitHub through `gh` and local Markdown under `.build-stacks/issues/`. Other trackers are report-only adapters.

## Workflow

1. Gather the full request, comments, labels, author context, prior triage notes, and code diff for a pull request.
2. Search repository behavior, domain language, ADRs, prior issues, and explicit out-of-scope records. Check whether the capability already exists or was previously rejected.
3. Recommend a state and explain it before changing anything.
4. Verify the claim:
   - bug: reproduce the reported symptom;
   - request: confirm current behavior and affected seam;
   - pull request: inspect the diff and run relevant checks.
5. Resolve missing product decisions through focused questions and update domain documentation only with approval.
6. Prepare the outcome from [triage-templates.md](references/triage-templates.md).
7. Local changes may be written after preview. GitHub labels, comments, closing, or issue edits require explicit approval immediately before the write and must use the installed `build-flow-projectsetup` GitHub helper where supported. Re-read remote state after approval to avoid overwriting concurrent changes. Assignment remains report-only until a guarded helper supports it.

## State Rules

- `ready-for-agent`: verified, bounded, decision-complete, and includes acceptance evidence.
- `ready-for-human`: bounded but depends on judgment, access, or manual action unavailable to an agent.
- `needs-info`: asks specific answerable questions and preserves established facts.
- `wontfix`: records the reason; close only with approval.
- Already implemented is not a rejected request and should not pollute an out-of-scope record.

## Output Contract

- request identity and tracker
- verification evidence
- recommended and applied state
- agent/human brief or information request
- external write approval/status
- residual risk
- next handoff
