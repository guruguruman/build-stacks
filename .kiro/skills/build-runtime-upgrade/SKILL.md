---
name: build-runtime-upgrade
description: "Stack update and migration workflow. Use when the user asks to upgrade build-stacks and verify its migration. Natural requests include \"Please upgrade build-stacks and verify its migration.\" or \"build-stacksを更新して移行を確認して\"."
---

# build-runtime-upgrade

Use this skill when a user wants to upgrade the APM CLI or `build-stacks`, verify installed versions, or prepare a migration between public APM package tags.

## Workflow

1. Confirm the current APM CLI version and package entry in the consumer `apm.yml` and `apm.lock.yaml`.
2. Confirm the target CLI version and package tag. The current maintainer contract uses APM 0.26.0. Never infer `latest`; use the user-approved target tag. For the initial v2 release, the target is `guruguruman/build-stacks#v2.0.0`.
3. Stop before changing dependencies unless the user explicitly approves the upgrade.
4. Run the APM install command in the consumer repo:

```bash
apm --version
BUILD_STACKS_TARGET_TAG=v2.0.0 # replace only with the user-approved target
apm install "guruguruman/build-stacks#${BUILD_STACKS_TARGET_TAG}" --target all
apm audit --ci
apm compile --all
apm compile --validate
test -f AGENTS.md && test -f GEMINI.md
```

5. With APM 0.26, `--validate` does not generate context. Confirm that the preceding `apm compile --all` generated `AGENTS.md` and `GEMINI.md`, then verify that all 47 `build-*` skills are installed under the converged roots: `.agents/skills`, `.claude/skills`, and `.kiro/skills`; verify that no root bundle or retired per-client duplicate was created.
6. Record evidence under `.build-stacks/evidence/build-runtime-upgrade.json`.

## Output Contract

- current package reference
- target package reference
- commands run
- generated output roots checked
- evidence path
- rollback or forward-fix note

Rollback for public releases is a forward fix within the active major line: after `v2.0.0`, publish `v2.0.1` for a patch or `v2.1.0` for a compatible feature release. Do not instruct users to delete public tags.
