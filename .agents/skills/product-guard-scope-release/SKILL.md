---
name: product-guard-scope-release
preamble-tier: 1
version: 1.0.0
description: |
  Release an active scope lock. This product-stacks guard workflow keeps product-* public
  interfaces, .apm source guidance, and .product-build-stacks runtime evidence boundaries
  aligned.
  Produces guard status, protected actions found, approval decisions, evidence, residual
  risk, and next handoff.
  Use when asked to "guard scope release", "release scope", "unfreeze scope", or when the
  requested work matches product-guard-scope-release.
  Proactively suggest when this workflow would reduce ambiguity, preserve evidence
  discipline, or create a cleaner handoff.
  Voice triggers: "release scope", "unfreeze scope", "remove scope lock".
benefits-from: [product-guard-scope]
triggers:
  - product-guard-scope-release
  - guard scope release
  - release scope
  - unfreeze scope
  - remove scope lock
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
---

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
