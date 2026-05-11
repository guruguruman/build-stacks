---
name: product-flow-plantune
description: Tune plan scope, ordering, omissions, decisions, and handoffs.
---

# product-flow-plantune

Use this skill to improve an implementation plan before execution.

## Workflow

1. Read the current plan and identify the user-visible goal.
2. Check for missing acceptance criteria, hidden approvals, stale assumptions, target/runtime mismatch, and verification gaps.
3. Convert vague steps into executable steps with owners, evidence, and stop conditions.
4. Record plan-tuning preferences only in repo-local files:

```bash
mkdir -p .product-build-stacks/preferences
printf '%s\n' '{"skill":"product-flow-plantune","preference":"<preference>","source":"user-stated"}' >> .product-build-stacks/preferences/question-preferences.jsonl
```

5. Return a revised plan or a focused list of required plan changes.

## Output Contract

- plan risks
- required edits
- acceptance criteria
- verification commands
- evidence path
- next handoff

Use repo-local commands only. Store durable preference evidence under `.product-build-stacks/preferences/`.
