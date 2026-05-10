---
name: product-runtime-upgrade
description: Upgrade product-stacks with explicit migration boundaries.
---

# product-runtime-upgrade

Use this skill when a user wants to upgrade `product-build-stacks`, verify the installed version, or prepare a migration between public APM package tags.

## Workflow

1. Confirm the current package entry in the consumer `apm.yml` and `apm.lock.yaml`.
2. Confirm the target version or tag. For the 1.0 release line, use `guruguruman/product-build-stacks#v1.0.0`.
3. Stop before changing dependencies unless the user explicitly approves the upgrade.
4. Run the APM install command in the consumer repo:

```bash
apm install guruguruman/product-build-stacks#v1.0.0 --target all
apm audit --ci
apm compile --validate --local-only
```

5. Verify that all 40 `product-*` skills are installed and no root bundle skill was created.
6. Record evidence under `.product-build-stacks/evidence/product-runtime-upgrade.json`.

## Output Contract

- current package reference
- target package reference
- commands run
- generated output roots checked
- evidence path
- rollback or forward-fix note

Rollback for public releases is a forward fix: publish `v1.0.1` for a patch or `v1.1.0` for a feature release. Do not instruct users to delete public tags.
