---
name: product-guard-scope
description: Freeze scope with a gstack-derived guard file and command checks before implementation drift occurs.
---

<!--
Ported from garrytan/gstack/freeze/SKILL.md.tmpl @ 30fe6bb11c6915e6264440b8a044ed0dcfbe06e0 (MIT).
Adapted for product-stacks: public product-* names, APM source boundaries, and repo-local .product-build-stacks runtime state.
-->

# product-guard-scope

# product-guard-scope — Scope Boundary Review

Record a repo-local scope boundary and use it to review planned edits. This skill
does **not** claim edits are automatically blocked unless the current host has
explicitly wired the bundled `bin/check-freeze.sh` hook.

If host hook integration is active, edits outside the boundary can be denied by
the bundled check script. If no hook integration is active, treat the boundary as
advisory: compare intended file changes to the frozen path, ask before editing
outside it, and report runtime enforcement as `report_only`.

```bash
mkdir -p .product-build-stacks/analytics
echo '{"skill":"product-guard-scope","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> .product-build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
```

## Setup

Ask the user which directory to use as the scope boundary. Use AskUserQuestion:

- Question: "Which directory should I treat as the approved edit scope? I will ask before editing outside it."
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

Tell the user: "Scope boundary recorded: `<path>/`. I will keep edits inside this
path unless you approve an expansion. If host hook integration is active, the
bundled hook can enforce the boundary; otherwise this is an advisory guard. To
change the boundary, run `product-guard-scope` again. To remove it, run
`product-guard-scope-release`."

## How to apply

Before editing, compare each intended file path with the recorded boundary. If a
path is outside the boundary, ask the user before editing it. If host hook
integration is active, cite the hook result. If no hook integration is active,
do not imply automatic blocking occurred.

The boundary persists as a repo-local state file. The bundled hook script can read
that state only in hosts that wire it into Edit/Write checks.

## Notes

- The trailing `/` on the freeze directory prevents `/src` from matching `/src-old`
- This prevents accidental scope drift, not a security boundary.
- Bash commands, formatters, generators, and external tools can still modify files
  outside the boundary unless separately constrained.
- To deactivate, run `product-guard-scope-release`.

## Output Contract

- scope_guard: `enforced` when host hook integration actually ran, otherwise `report_only`.
- approved_scope: recorded path.
- findings: paths inside and outside scope.
- decisions: allowed edits, blocked-by-user edits, or approvals needed.
- next handoff: scope change or release command if needed.
