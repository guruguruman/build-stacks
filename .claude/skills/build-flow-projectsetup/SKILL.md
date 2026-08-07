---
name: build-flow-projectsetup
description: "Configure project domain docs, tracker conventions, and APM context pointers. Use when the user asks to configure project domain docs, tracker conventions, and APM context pointers. Common requests include \"set up project agent docs\", \"configure issue tracker\", \"initialize domain docs\"."
---

# build-flow-projectsetup

Configure durable project conventions without editing APM-generated `AGENTS.md`, `GEMINI.md`, or generated target skill roots.

## Workflow

1. Inspect `apm.yml`, `.apm/`, generated context files, repository remotes, existing `CONTEXT.md` or `CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/`, and `.build-stacks/issues/`.
2. Select a tracker:
   - `github`: require a GitHub remote and working `gh auth status` before claiming readiness.
   - `local`: store one Markdown file per ticket under `.build-stacks/issues/<feature>/`.
   - other trackers: record a descriptive adapter only; do not claim executable support.
3. Select domain layout: one root `CONTEXT.md`, or a root `CONTEXT-MAP.md` pointing to bounded-context glossaries. Default to one context unless the repository already has real domain boundaries.
4. Preview every path and collision. Obtain approval before writing. Never overwrite an unmanaged file.
5. Run `node scripts/setup-project.mjs --root <consumer-root> --tracker <github|local> --context <single|multi> --write`, resolving the script relative to this skill.
6. Run `apm compile` in the consumer. Verify generated context contains the project pointer and that a second setup run reports no changes.

## Durable and Runtime State

- Durable: `CONTEXT.md` or `CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/`, and the local APM instruction primitive.
- Runtime: local tickets and evidence under `.build-stacks/`.
- Generated: `AGENTS.md`, `GEMINI.md`, and target roots. Regenerate; never hand-edit.

## External Writes

Setup may inspect GitHub read-only. Creating labels, issues, comments, or other remote state requires a separate explicit approval immediately before the write.

After approval, use `node scripts/github-issue.mjs` from this skill for the supported create, comment, label, and close operations. The helper performs authentication and repository preflight again, uses argument arrays instead of a shell, and refuses every write without `--approved`.

## Output Contract

- detected configuration
- proposed and written paths
- collision decisions
- tracker readiness
- compile and idempotency evidence
- residual risk
- next handoff
