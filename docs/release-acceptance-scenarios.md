# Release Acceptance Scenarios

These scenarios define the `2.1.0-release` acceptance suite. A skill is complete when a clean consumer install can exercise the workflow and produce evidence.

## 1. First Browser Smoke

Requires official `agent-browser`. If the command is unavailable, stop and install it; do not fall back to root browser implementation files.

```bash
npm run build
agent-browser --version
_ABR_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
_ABR_REPO_ID="$(printf '%s' "$_ABR_ROOT" | cksum | awk '{print $1}')"
_ABR_RUN_ID="$(printf '%s' "${AGENT_BROWSER_RUN_ID:-local}" | cksum | awk '{print $1}')"
_ABR_SESSION="ps-${_ABR_REPO_ID}-${_ABR_RUN_ID}"
AGENT_BROWSER_SOCKET_DIR="${BUILD_BROWSER_SOCKET_DIR:-/tmp/agent-browser-${_ABR_REPO_ID}}"
mkdir -p "$AGENT_BROWSER_SOCKET_DIR"
export AGENT_BROWSER_SOCKET_DIR
mkdir -p .build-stacks/artifacts/browser/screenshots .build-stacks/browser/downloads
agent-browser --json --content-boundaries --screenshot-dir .build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" open https://example.com
agent-browser --json --content-boundaries --session "$_ABR_SESSION" snapshot -i
agent-browser --json --screenshot-dir .build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" screenshot
agent-browser --json --session "$_ABR_SESSION" close
```

Success criteria:

- `snapshot` returns untrusted page content.
- `screenshot` returns an artifact path and a hint to display/read it.
- Browser artifacts stay under `.build-stacks/`.

## 2. Browser QA

Use a local or fixture page with a form and a visible success state.

The fill/click steps are action policy operations. Ask for explicit user approval before running them. If the flow uses real authentication state, route through `build-browser-auth` first.

```bash
_ABR_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
_ABR_REPO_ID="$(printf '%s' "$_ABR_ROOT" | cksum | awk '{print $1}')"
_ABR_RUN_ID="$(printf '%s' "${AGENT_BROWSER_RUN_ID:-local}" | cksum | awk '{print $1}')"
_ABR_SESSION="ps-${_ABR_REPO_ID}-${_ABR_RUN_ID}"
AGENT_BROWSER_SOCKET_DIR="${BUILD_BROWSER_SOCKET_DIR:-/tmp/agent-browser-${_ABR_REPO_ID}}"
mkdir -p "$AGENT_BROWSER_SOCKET_DIR"
export AGENT_BROWSER_SOCKET_DIR
mkdir -p .build-stacks/artifacts/browser/screenshots .build-stacks/browser/downloads
agent-browser --json --content-boundaries --screenshot-dir .build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" open http://localhost:3000/login
agent-browser --json --content-boundaries --session "$_ABR_SESSION" snapshot -i
# After explicit user approval:
agent-browser --json --session "$_ABR_SESSION" fill 'input[name=email]' "$TEST_EMAIL"
agent-browser --json --session "$_ABR_SESSION" fill 'input[name=password]' "$TEST_PASSWORD"
agent-browser --json --session "$_ABR_SESSION" click 'button[type=submit]'
agent-browser --json --session "$_ABR_SESSION" wait '.dashboard'
agent-browser --json --session "$_ABR_SESSION" console
agent-browser --json --session "$_ABR_SESSION" network requests
agent-browser --json --screenshot-dir .build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" screenshot
agent-browser --json --session "$_ABR_SESSION" close
```

Success criteria:

- Credentials come from environment variables, not logs.
- Console and network output are redacted.
- Evidence includes before/after snapshot or screenshot.

## 3. Review to QA to Ship

```text
build-role-staffengineer
-> build-recipe-qa
-> build-recipe-ship
```

Success criteria:

- Review produces findings first, with file/line references when code exists.
- QA records browser artifacts under `.build-stacks/artifacts` or `.build-stacks/browser`.
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

- `build-browser-runner` returns `browser_activation: executed` with browser evidence.
- `build-browser-qa` returns `browser_activation: executed` after fixture form interaction.
- Evidence stays under the temporary app `.build-stacks/artifacts/browser` path.
- Protected paths, including the real Codex system skill tree, are unchanged after postflight.

## 5. Natural-language activation

Run activation in an isolated clean consumer without naming the expected skill in the task text.

```bash
npm run smoke:codex-activation-natural-ja
npm run smoke:codex-activation-natural-en
```

Success criteria:

- every public skill is selected from at least one natural request;
- changed workflows and every role pass both Japanese and English requests;
- collision prompts select at most one flow or recipe coordinator;
- multiple roles appear only when explicitly requested or declared by an orchestrating coordinator;
- optional `benefitsFrom` edges do not cause an unrequested sequential workflow.

## 6. Clean Consumer Install

```bash
npm run smoke:codex
npm run smoke:all
npm run smoke:packages
```

Success criteria:

- The root consumer project installs all 55 skills.
- Every subpackage consumer installs exactly its documented dependency closure: 9, 17, 23, 30, 36, or 55 skills.
- Converged installs contain `.agents/skills`, `.claude/skills`, and `.kiro/skills`.
- Retired duplicate roots `.cursor/skills`, `.github/skills`, and `.opencode/skills` are absent.
- No root bundle skill is created.
- Evidence JSON is written under `.build-stacks/evidence/`.

## 7. Mandatory Quality Verification Gate

Run the same mandatory verification entry point locally and in CI. The release
gate delegates to this quality gate, then adds only explicitly enabled heavy E2E
checks.

```bash
npm run quality:verify
npm run release:verify
```

Success criteria:

- The quality gate runs tests, skill metadata and stack verification, source/generated/APM verification, APM audit and compile, root and package clean-consumer smoke tests, browser doctor and smoke checks, repository secret scanning, and unstaged, staged, plus untracked whitespace checks.
- `npm run release:verify` delegates to `npm run quality:verify` instead of maintaining a second checklist.
- CI invokes `npm run release:verify`, so local and CI acceptance use the same mandatory contract.
- Heavy Codex E2E remains opt-in and is reported honestly when it is not enabled.

## 8. Full Codex E2E Release Gate

Use this only for release candidates that need Codex activation and browser-core
runtime evidence. It is opt-in to avoid creating large local Docker/runtime
images during routine verification.

```bash
BUILD_RELEASE_VERIFY_CODEX_E2E=1 npm run release:verify
```

## 9. Prelaunch Security Gate

Exercise the deterministic security gate separately from open-ended CSO review and
release-engineering readiness.

```text
build-flow-securitygate
-> create a RAPID report in a clean consumer repository
-> assess all 32 controls and 10 mandatory failure scenarios
-> preserve missing runtime, provider, and cloud evidence as NOT_VERIFIED
-> validate the report and calculate its release verdict
```

Success criteria:

- The installed skill contains the control catalog, repository evidence map, and report validator.
- Every report contains exactly 32 control rows and an evidence-backed GO, CONDITIONAL GO, or NO-GO verdict.
- Any incomplete Critical or High control forces NO-GO in FULL and RAPID modes.
- FOCUSED mode never issues a release-wide GO.
- `security review`, `CSO review`, `threat model`, and `release review` do not trigger this flow by themselves.
- The skill does not automatically invoke `build-role-cso` or `build-role-releaseengineer`.

## 10. Web And Mobile UI Finish

Exercise both focused visual-finishing routes without letting them absorb functional QA
or generic design review.

```text
build-flow-webuifinish
-> capture a real rendered route
-> score the current screen
-> apply one explicitly approved visual change
-> verify and recapture the same route, viewport, and state

build-flow-mobileuifinish
-> capture or inspect a real native/cross-platform app screen
-> score the current screen
-> apply one explicitly approved visual change
-> verify and recapture the same platform, device, orientation, and state
```

Success criteria:

- Each report contains visible findings, decisions, evidence paths, residual risk, and a next handoff.
- The Web flow records honest `browser_activation` and uses official `agent-browser` when a runnable surface exists.
- The Mobile flow records platform/device and `visual_artifact_status`; mobile-responsive Web is routed to the Web flow.
- Review-only prompts do not modify source.
- Missing real-screen evidence never produces a fabricated score or screenshot.
- `QA`, `browser QA`, and `design review` remain routed to their existing functional or design workflows.

## 11. Skill Release Acceptance Matrix

Every skill in [docs/release-acceptance-skill-matrix.md](release-acceptance-skill-matrix.md) must have:

- smoke scenario
- expected output
- evidence path
- failure mode
