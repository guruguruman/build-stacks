---
name: product-guard-full
description: Apply the full gstack-derived guard posture for risky work, scope discipline, and explicit user gates.
---

<!--
Ported from garrytan/gstack/guard/SKILL.md.tmpl @ 30fe6bb11c6915e6264440b8a044ed0dcfbe06e0 (MIT).
Adapted for product-stacks: public product-* names, APM source boundaries, and repo-local .product-build-stacks runtime state.
-->

# product-guard-full

# product-guard-full — Full Guard Review

Apply both destructive-operation review and scope-boundary review in one workflow.
This is the combination of `product-guard-destructive` + `product-guard-scope`.

**Runtime truth:** This skill does not claim automatic command/edit blocking unless
the current host has explicitly wired the bundled guard hook scripts. Without host
hook integration, it is an advisory guard that requires the assistant to ask before
destructive commands or out-of-scope edits.

```bash
mkdir -p .product-build-stacks/analytics
echo '{"skill":"guard","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> .product-build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
```

## Setup

Ask the user which directory to use as the approved edit scope. Use AskUserQuestion:

- Question: "Which directory should I treat as the approved edit scope? I will ask before destructive commands and before editing outside it."
- Text input (not multiple choice) — the user types a path.

Once the user provides a directory path:

1. Resolve it to an absolute path:
```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
echo "$FREEZE_DIR"
```

2. Ensure trailing slash and save to the freeze state file:
```bash
FREEZE_DIR="${FREEZE_DIR%/}/"
PRODUCT_STATE_ROOT="${PRODUCT_STATE_ROOT:-.product-build-stacks}"; PLAN_ROOT="$PRODUCT_STATE_ROOT/design-docs"; TMP_ROOT="$PRODUCT_STATE_ROOT/tmp"; mkdir -p "$PRODUCT_STATE_ROOT" "$PLAN_ROOT" "$TMP_ROOT"
STATE_DIR="$PRODUCT_STATE_ROOT"
mkdir -p "$STATE_DIR"
echo "$FREEZE_DIR" > "$STATE_DIR/freeze-dir.txt"
echo "Freeze boundary set: $FREEZE_DIR"
```

Tell the user:
- "**Guard review active.** Two review rules are now in effect:"
- "1. **Destructive command review** — I will ask before rm -rf, DROP TABLE, force-push, deploys, and similar operations."
- "2. **Scope boundary review** — approved scope is `<path>/`; I will ask before editing outside it."
- "If host hook integration is active, bundled hooks may enforce these checks. Otherwise enforcement is advisory/report-only."
- "To remove the edit boundary, run `product-guard-scope-release`."

## What's protected

See `product-guard-destructive` for the full list of destructive command patterns and safe exceptions.
See `product-guard-scope` for how edit boundary enforcement works.

## Output Contract

- full_guard: `enforced` when host hook integration actually ran, otherwise `report_only`.
- approved_scope: recorded path.
- destructive_findings: risky commands or safe exceptions.
- scope_findings: paths inside and outside scope.
- next handoff: approval needed, scope release, or safe next command.
