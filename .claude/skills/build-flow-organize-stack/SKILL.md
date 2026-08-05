---
name: build-flow-organize-stack
description: "Audit APM skill placement and propose safe stack organization changes. Use when the user asks to audit APM skill placement and propose safe stack organization changes. Common requests include \"organize this APM stack\", \"check the package graph\", \"where should this skill live\"."
---

# build-flow-organize-stack

Audit an APM skill repository and propose organization changes without modifying repo-tracked files.

## Workflow

1. Resolve the repository root and inspect every `apm.yml` plus `packages/*/.apm/skills/*/SKILL.md`.
2. Run the bundled analyzer from this skill directory:

   ```bash
   node scripts/analyze-stack.mjs
   ```

   Resolve `scripts/analyze-stack.mjs` relative to this `SKILL.md`, not the consumer repository. In the build-stacks source repository, `npm run stack:analyze` is an equivalent maintainer shortcut.
3. Treat package dependencies and skill `benefitsFrom` relationships as separate graphs:
   - package cycles are errors;
   - optional skill cycles are reportable context, not install failures.
4. Recommend the smallest package that owns the skill's primary capability. Put shared safeguards and state in core, browser execution in browser, interface work in design, discovery in product, shipping in delivery, and stack maintenance in maintainer.
5. Report proposed moves before editing. Only move or rewrite files after the user explicitly asks to implement the proposal.

Read [organization-rules.md](references/organization-rules.md) when package ownership is ambiguous or when adding a new domain.

## Output contract

- findings and severity
- detected package graph and install closures
- proposed ownership changes
- evidence paths inspected
- residual risks
- next handoff

Use `node scripts/analyze-stack.mjs --json` for machine-readable output and `--check` for a CI gate.
