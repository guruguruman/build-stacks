---
name: product-guard-full
description: Apply the full gstack-derived guard posture for risky work, scope discipline, and explicit user gates.
---

<!--
Ported from garrytan/gstack/guard/SKILL.md.tmpl @ 30fe6bb11c6915e6264440b8a044ed0dcfbe06e0 (MIT).
Adapted for product-stacks: public product-* names, APM source boundaries, and repo-local .product-build-stacks runtime state.
-->

# product-guard-full

# product-guard-full — Full Safety Mode

Activates both destructive command warnings and directory-scoped edit restrictions.
This is the combination of `product-guard-destructive` + `product-guard-scope` in a single command.

**Dependency note:** This skill references hook scripts from the sibling `product-guard-destructive`
and `product-guard-scope` skill directories. Both must be installed (they are installed together
by the product-stacks setup script).

```bash
mkdir -p .product-build-stacks/analytics
echo '{"skill":"guard","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> .product-build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
```

## Setup

Ask the user which directory to restrict edits to. Use AskUserQuestion:

- Question: "Guard mode: which directory should edits be restricted to? Destructive command warnings are always on. Files outside the chosen path will be blocked from editing."
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
- "**Guard mode active.** Two protections are now running:"
- "1. **Destructive command warnings** — rm -rf, DROP TABLE, force-push, etc. will warn before executing (you can override)"
- "2. **Edit boundary** — file edits restricted to `<path>/`. Edits outside this directory are blocked."
- "To remove the edit boundary, run `product-guard-scope-release`. To deactivate everything, end the session."

## What's protected

See `product-guard-destructive` for the full list of destructive command patterns and safe exceptions.
See `product-guard-scope` for how edit boundary enforcement works.
