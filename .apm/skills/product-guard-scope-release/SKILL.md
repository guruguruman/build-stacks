---
name: product-guard-scope-release
description: Release a scope freeze only after the gstack-derived checks and user approval are satisfied.
---

<!--
Ported from garrytan/gstack/unfreeze/SKILL.md.tmpl @ 30fe6bb11c6915e6264440b8a044ed0dcfbe06e0 (MIT).
Adapted for product-stacks: public product-* names, APM source boundaries, and repo-local .product-build-stacks runtime state.
-->

# product-guard-scope-release

# product-guard-scope-release — Clear Freeze Boundary

Remove the repo-local scope boundary recorded by `product-guard-scope`. This clears
the state used by advisory checks and by any host hook integration that reads the
bundled freeze state file.

```bash
mkdir -p .product-build-stacks/analytics
echo '{"skill":"unfreeze","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> .product-build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
```

## Clear the boundary

```bash
PRODUCT_STATE_ROOT="${PRODUCT_STATE_ROOT:-.product-build-stacks}"; PLAN_ROOT="$PRODUCT_STATE_ROOT/design-docs"; TMP_ROOT="$PRODUCT_STATE_ROOT/tmp"; mkdir -p "$PRODUCT_STATE_ROOT" "$PLAN_ROOT" "$TMP_ROOT"
STATE_DIR="$PRODUCT_STATE_ROOT"
if [ -f "$STATE_DIR/freeze-dir.txt" ]; then
  PREV=$(cat "$STATE_DIR/freeze-dir.txt")
  rm -f "$STATE_DIR/freeze-dir.txt"
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Tell the user the result. Do not claim hooks are registered unless the current host
has confirmed hook integration. To record a new boundary, run `product-guard-scope`
again.
