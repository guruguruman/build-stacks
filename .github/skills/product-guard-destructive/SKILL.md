---
name: product-guard-destructive
preamble-tier: 1
version: 1.0.0
description: |
  Warn and require approval before destructive actions. This product-stacks guard workflow
  keeps product-* public interfaces, .apm source guidance, and .product-build-stacks
  runtime evidence boundaries aligned.
  Produces guard status, protected actions found, approval decisions, evidence, residual
  risk, and next handoff.
  Use when asked to "guard destructive", "destructive guard", "risky command", or when the
  requested work matches product-guard-destructive.
  Proactively suggest when this workflow would reduce ambiguity, preserve evidence
  discipline, or create a cleaner handoff.
  Voice triggers: "destructive guard", "risky command", "approval check".
benefits-from: [product-guard-full]
triggers:
  - product-guard-destructive
  - guard destructive
  - destructive guard
  - risky command
  - approval check
---

# product-guard-destructive

# product-guard-destructive — Destructive Command Review

This skill reviews destructive or high-risk operations and gives the assistant a
strict approval posture. It does **not** claim that shell commands are automatically
blocked unless the current host has explicitly wired the bundled hook script.

If host hook integration is active, the bundled `bin/check-careful.sh` script can
return `permissionDecision: "ask"` for matching commands. If no hook integration is
active, treat this as an advisory guard: inspect commands before running them, ask
for explicit approval when they match the protected patterns, and report that
runtime enforcement is `report_only`.

```bash
mkdir -p .product-build-stacks/analytics
echo '{"skill":"product-guard-destructive","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> .product-build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
```

## What's protected

| Pattern | Example | Risk |
|---------|---------|------|
| `rm -rf` / `rm -r` / `rm --recursive` | `rm -rf /var/data` | Recursive delete |
| `DROP TABLE` / `DROP DATABASE` | `DROP TABLE users;` | Data loss |
| `TRUNCATE` | `TRUNCATE orders;` | Data loss |
| `git push --force` / `-f` | `git push -f origin main` | History rewrite |
| `git reset --hard` | `git reset --hard HEAD~3` | Uncommitted work loss |
| `git checkout .` / `git restore .` | `git checkout .` | Uncommitted work loss |
| `kubectl delete` | `kubectl delete pod` | Production impact |
| `docker rm -f` / `docker system prune` | `docker system prune -a` | Container/image loss |

## Safe exceptions

These patterns are allowed without warning:
- `rm -rf node_modules` / `.next` / `dist` / `__pycache__` / `.cache` / `build` / `.turbo` / `coverage`

## How to apply

1. Check every proposed shell command against the protected patterns above.
2. If a command matches, stop and ask the user for explicit approval before
   running it.
3. If the command is a safe exception, state why it is safe and proceed.
4. If the host has active hook integration, cite the hook result.
5. If no hook integration is active, do not imply automatic blocking occurred.

## Output Contract

- destructive_guard: `enforced` when host hook integration actually ran, otherwise `report_only`.
- findings: matched risky commands or safe exceptions.
- decisions: commands approved, skipped, or requiring user approval.
- evidence: command text, hook result if any, and state file paths used.
- next handoff: safest next command or approval needed.
