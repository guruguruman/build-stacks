---
name: product-runtime-upgrade
preamble-tier: 2
version: 1.0.0
description: |
  Stack update and migration workflow. This repo-local runtime workflow keeps product-*
  public interfaces, .apm source guidance, and .product-build-stacks runtime evidence
  boundaries aligned.
  Produces repo-local state or health evidence under .product-build-stacks when
  appropriate, plus decisions, residual risk, and next handoff.
  Use when asked to "runtime upgrade", "upgrade stack", "migration check", or when the
  requested work matches product-runtime-upgrade.
  Proactively suggest when this workflow would reduce ambiguity, preserve evidence
  discipline, or create a cleaner handoff.
  Voice triggers: "upgrade stack", "migration check", "update product stacks".
benefits-from: [product-runtime-health, product-recipe-ship]
triggers:
  - product-runtime-upgrade
  - runtime upgrade
  - upgrade stack
  - migration check
  - update product stacks
---

# product-runtime-upgrade

Use this skill when a user wants to upgrade the APM CLI or `product-build-stacks`, verify installed versions, or prepare a migration between public APM package tags.

## Workflow

1. Confirm the current APM CLI version and package entry in the consumer `apm.yml` and `apm.lock.yaml`.
2. Confirm the target CLI version and package tag. The current maintainer contract uses APM 0.26.0; for the product-stacks 1.0 release line, use `guruguruman/product-build-stacks#v1.0.0`.
3. Stop before changing dependencies unless the user explicitly approves the upgrade.
4. Run the APM install command in the consumer repo:

```bash
apm --version
apm install guruguruman/product-build-stacks#v1.0.0 --target all
apm audit --ci
apm compile --validate --local-only
```

5. Verify that all 42 `product-*` skills are installed under the APM 0.26 converged roots: `.agents/skills`, `.claude/skills`, and `.kiro/skills`; verify that no root bundle or retired per-client duplicate was created.
6. Record evidence under `.product-build-stacks/evidence/product-runtime-upgrade.json`.

## Output Contract

- current package reference
- target package reference
- commands run
- generated output roots checked
- evidence path
- rollback or forward-fix note

Rollback for public releases is a forward fix: publish `v1.0.1` for a patch or `v1.1.0` for a feature release. Do not instruct users to delete public tags.
