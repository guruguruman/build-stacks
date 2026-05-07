# Release Acceptance Scenarios

These scenarios define the `1.0.0-release` acceptance suite. A skill is complete when a clean consumer install can exercise the workflow and produce evidence.

## 1. First Browser Smoke

Requires official `agent-browser`. If the command is unavailable, stop and install it; do not fall back to root browser implementation files.

```bash
bun run build
agent-browser --version
_ABR_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
_ABR_REPO_ID="$(printf '%s' "$_ABR_ROOT" | cksum | awk '{print $1}')"
_ABR_SESSION="product-stacks-public-${_ABR_REPO_ID}-${AGENT_BROWSER_RUN_ID:-local}"
mkdir -p .product-build-stacks/artifacts/browser/screenshots .product-build-stacks/browser/downloads
agent-browser --json --content-boundaries --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" open https://example.com
agent-browser --json --content-boundaries --session "$_ABR_SESSION" snapshot -i
agent-browser --json --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" screenshot
agent-browser --json --session "$_ABR_SESSION" close
```

Success criteria:

- `snapshot` returns untrusted page content.
- `screenshot` returns an artifact path and a hint to display/read it.
- Browser artifacts stay under `.product-build-stacks/`.

## 2. Browser QA

Use a local or fixture page with a form and a visible success state.

The fill/click steps are action policy operations. Ask for explicit user approval before running them. If the flow uses real authentication state, route through `product-browser-auth` first.

```bash
_ABR_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
_ABR_REPO_ID="$(printf '%s' "$_ABR_ROOT" | cksum | awk '{print $1}')"
_ABR_SESSION="product-stacks-public-${_ABR_REPO_ID}-${AGENT_BROWSER_RUN_ID:-local}"
mkdir -p .product-build-stacks/artifacts/browser/screenshots .product-build-stacks/browser/downloads
agent-browser --json --content-boundaries --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" open http://localhost:3000/login
agent-browser --json --content-boundaries --session "$_ABR_SESSION" snapshot -i
# After explicit user approval:
agent-browser --json --session "$_ABR_SESSION" fill 'input[name=email]' "$TEST_EMAIL"
agent-browser --json --session "$_ABR_SESSION" fill 'input[name=password]' "$TEST_PASSWORD"
agent-browser --json --session "$_ABR_SESSION" click 'button[type=submit]'
agent-browser --json --session "$_ABR_SESSION" wait '.dashboard'
agent-browser --json --session "$_ABR_SESSION" console
agent-browser --json --session "$_ABR_SESSION" network requests
agent-browser --json --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" screenshot
agent-browser --json --session "$_ABR_SESSION" close
```

Success criteria:

- Credentials come from environment variables, not logs.
- Console and network output are redacted.
- Evidence includes before/after snapshot or screenshot.

## 3. Review to QA to Ship

```text
product-flow-codereview
-> product-recipe-qa
-> product-recipe-ship
```

Success criteria:

- Review produces findings first, with file/line references when code exists.
- QA records browser artifacts under `.product-build-stacks/artifacts` or `.product-build-stacks/browser`.
- Ship produces test/docs/changelog/PR handoff and stops before merge/deploy without approval.

## 4. Clean Consumer Install

```bash
bun run smoke:codex
bun run smoke:all
```

Success criteria:

- The consumer project installs all 52 skills.
- No root bundle skill is created.
- Evidence JSON is written under `.product-build-stacks/evidence/`.

## 5. Skill Release Acceptance Matrix

Every skill in [docs/release-acceptance-skill-matrix.md](release-acceptance-skill-matrix.md) must have:

- smoke scenario
- expected output
- evidence path
- failure mode
