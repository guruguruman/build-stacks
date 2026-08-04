---
name: build-guard-scope-release
description: "Use when the user wants to release an active scope lock Common requests include \"guard scope release\", \"release scope\", \"unfreeze scope\", \"remove scope lock\"."
---

# build-guard-scope-release

# build-guard-scope-release — Clear Freeze Boundary

Remove the repo-local scope boundary recorded by `build-guard-scope`. This clears
the state used by advisory checks and by any host hook integration that reads the
bundled freeze state file.

```bash
mkdir -p .build-stacks/analytics
echo '{"skill":"unfreeze","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> .build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
```

## Clear the boundary

```bash
BUILD_STATE_ROOT="${BUILD_STATE_ROOT:-.build-stacks}"; PLAN_ROOT="$BUILD_STATE_ROOT/design-docs"; TMP_ROOT="$BUILD_STATE_ROOT/tmp"; mkdir -p "$BUILD_STATE_ROOT" "$PLAN_ROOT" "$TMP_ROOT"
STATE_DIR="$BUILD_STATE_ROOT"
if [ -f "$STATE_DIR/freeze-dir.txt" ]; then
  PREV=$(cat "$STATE_DIR/freeze-dir.txt")
  rm -f "$STATE_DIR/freeze-dir.txt"
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Tell the user the result. Do not claim hooks are registered unless the current host
has confirmed hook integration. To record a new boundary, run `build-guard-scope`
again.
