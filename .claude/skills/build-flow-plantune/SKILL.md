---
name: build-flow-plantune
description: "Tune plan scope, ordering, omissions, and handoffs. Use when the user asks to tune plan scope, ordering, omissions, and handoffs. Common requests include \"flow plantune\", \"tune the plan\", \"plan tuning\", \"scope review\"."
---

# build-flow-plantune

Use this skill to improve an implementation plan before execution.

## Workflow

1. Read the current plan and identify the user-visible goal.
2. Check for missing acceptance criteria, hidden approvals, stale assumptions, target/runtime mismatch, and verification gaps.
3. Convert vague steps into executable steps with owners, evidence, and stop conditions.
4. Record plan-tuning preferences only in repo-local files:

```bash
mkdir -p .build-stacks/preferences
printf '%s\n' '{"skill":"build-flow-plantune","preference":"<preference>","source":"user-stated"}' >> .build-stacks/preferences/question-preferences.jsonl
```

5. Return a revised plan or a focused list of required plan changes.

## Output Contract

- plan risks
- required edits
- acceptance criteria
- verification commands
- evidence path
- next handoff

Use repo-local commands only. Store durable preference evidence under `.build-stacks/preferences/`.
