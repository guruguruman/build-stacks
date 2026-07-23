# Release Acceptance Scenarios

These scenarios define the `1.0.0-release` acceptance suite. A skill is complete when a clean consumer install can exercise the workflow and produce evidence.

## 1. First Browser Smoke

Requires official `agent-browser`. If the command is unavailable, stop and install it; do not fall back to root browser implementation files.

```bash
npm run build
agent-browser --version
_ABR_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
_ABR_REPO_ID="$(printf '%s' "$_ABR_ROOT" | cksum | awk '{print $1}')"
_ABR_RUN_ID="$(printf '%s' "${AGENT_BROWSER_RUN_ID:-local}" | cksum | awk '{print $1}')"
_ABR_SESSION="ps-${_ABR_REPO_ID}-${_ABR_RUN_ID}"
AGENT_BROWSER_SOCKET_DIR="${PRODUCT_BROWSER_SOCKET_DIR:-/tmp/agent-browser-${_ABR_REPO_ID}}"
mkdir -p "$AGENT_BROWSER_SOCKET_DIR"
export AGENT_BROWSER_SOCKET_DIR
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
_ABR_RUN_ID="$(printf '%s' "${AGENT_BROWSER_RUN_ID:-local}" | cksum | awk '{print $1}')"
_ABR_SESSION="ps-${_ABR_REPO_ID}-${_ABR_RUN_ID}"
AGENT_BROWSER_SOCKET_DIR="${PRODUCT_BROWSER_SOCKET_DIR:-/tmp/agent-browser-${_ABR_REPO_ID}}"
mkdir -p "$AGENT_BROWSER_SOCKET_DIR"
export AGENT_BROWSER_SOCKET_DIR
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
product-role-staffengineer
-> product-recipe-qa
-> product-recipe-ship
```

Success criteria:

- Review produces findings first, with file/line references when code exists.
- QA records browser artifacts under `.product-build-stacks/artifacts` or `.product-build-stacks/browser`.
- Ship produces test/docs/changelog/PR handoff and stops before merge/deploy without approval.

## 4. Codex Browser Core Smoke

Run this only when validating the heavy Codex E2E path. It uses an isolated fake
`HOME` and fake `CODEX_HOME`, requests `gpt-5.5` with high reasoning, and allows
`danger-full-access` only for the fixture-backed browser run. It is not part of
the default `npm run release:verify` path because local Codex/eval runtimes can
create large Docker images.

```bash
node scripts/codex-browser-core-smoke.mjs
```

Success criteria:

- `product-browser-runner` returns `browser_activation: executed` with browser evidence.
- `product-browser-qa` returns `browser_activation: executed` after fixture form interaction.
- Evidence stays under the temporary app `.product-build-stacks/artifacts/browser` path.
- Protected paths, including the real Codex system skill tree, are unchanged after postflight.

## 5. Clean Consumer Install

```bash
npm run smoke:codex
npm run smoke:all
```

Success criteria:

- The consumer project installs all 42 skills.
- Converged installs contain `.agents/skills`, `.claude/skills`, and `.kiro/skills`.
- Retired duplicate roots `.cursor/skills`, `.github/skills`, and `.opencode/skills` are absent.
- No root bundle skill is created.
- Evidence JSON is written under `.product-build-stacks/evidence/`.

## 6. Full Codex E2E Release Gate

Use this only for release candidates that need Codex activation and browser-core
runtime evidence. It is opt-in to avoid creating large local Docker/runtime
images during routine verification.

```bash
PRODUCT_RELEASE_VERIFY_CODEX_E2E=1 npm run release:verify
```

## 7. Skill Release Acceptance Matrix

Every skill in [docs/release-acceptance-skill-matrix.md](release-acceptance-skill-matrix.md) must have:

- smoke scenario
- expected output
- evidence path
- failure mode
