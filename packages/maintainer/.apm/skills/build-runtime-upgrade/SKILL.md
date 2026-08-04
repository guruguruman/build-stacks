---
name: build-runtime-upgrade
description: "Use when the user wants to stack update and migration workflow Common requests include \"runtime upgrade\", \"upgrade stack\", \"migration check\", \"update build stacks\"."
---

# build-runtime-upgrade

Use this skill when a user wants to upgrade the APM CLI or `build-stacks`, verify installed versions, or prepare a migration between public APM package tags.

## Workflow

1. Confirm the current APM CLI version and package entry in the consumer `apm.yml` and `apm.lock.yaml`.
2. Confirm the target CLI version and package tag. The current maintainer contract uses APM 0.26.0; for the build-stacks 1.1 release line, use `guruguruman/build-stacks#v1.1.0`.
3. Stop before changing dependencies unless the user explicitly approves the upgrade.
4. Run the APM install command in the consumer repo:

```bash
apm --version
apm install guruguruman/build-stacks#v1.1.0 --target all
apm audit --ci
apm compile --validate --local-only
```

5. Verify that all 47 `build-*` skills are installed under the APM 0.26 converged roots: `.agents/skills`, `.claude/skills`, and `.kiro/skills`; verify that no root bundle or retired per-client duplicate was created.
6. Record evidence under `.build-stacks/evidence/build-runtime-upgrade.json`.

## Output Contract

- current package reference
- target package reference
- commands run
- generated output roots checked
- evidence path
- rollback or forward-fix note

Rollback for public releases is a forward fix: publish `v1.1.1` for a patch or `v1.2.0` for a feature release. Do not instruct users to delete public tags.
