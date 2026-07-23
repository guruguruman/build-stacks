# product-build-stacks

`product-build-stacks` is an APM 0.26.0-managed 42-skill package for product discovery, review, browser QA, release, and runtime discipline.

`.apm/` is the only authored source. Generated target output is committed for reviewability and must match a clean APM install. Runtime state belongs under `.product-build-stacks/`.

## Install

```bash
apm init --yes
apm install guruguruman/product-build-stacks#v1.0.0 --target all
apm audit --ci
apm compile --validate --local-only
```

Commit `apm.yml` and `apm.lock.yaml` in consumer repos. Runtime state stays under `.product-build-stacks/`; keep it ignored except for optional example config files:

```gitignore
.product-build-stacks/*
!.product-build-stacks/.gitkeep
!.product-build-stacks/config.example.yaml
```

Supported APM 0.26.0 targets under `--target all`: `copilot`, `claude`, `cursor`, `opencode`, `codex`, `gemini`, `windsurf`, and `kiro`.

APM 0.26 converges skills for Copilot, Cursor, OpenCode, Codex, Gemini, and Windsurf into `.agents/skills/`. Claude and Kiro keep `.claude/skills/` and `.kiro/skills/`.

## Browser Runtime

Browser workflows use official `agent-browser`. `product-browser-runner` is the Skill/policy layer for approval, evidence paths, redaction, and untrusted browser content.

```bash
brew install agent-browser
# or: npm i -g agent-browser
agent-browser --version
agent-browser install
```

Use official `agent-browser`; do not rely on repository-local browser runtime directories in consumer repos.

First public-page smoke:

```bash
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

## Shipped Skills

The public surface is the 42 skills in [docs/release-acceptance-skill-matrix.md](docs/release-acceptance-skill-matrix.md). Names are stable `product-*` names.

## Maintainer Verification

```bash
npm ci
npm run build
npm run generated:verify
npm run skill:verify
npm run apm:verify
npm run smoke:codex
npm run smoke:all
npm run release:verify
# Heavy Codex E2E smoke is opt-in because it can create large local runtime images.
PRODUCT_RELEASE_VERIFY_CODEX_E2E=1 npm run release:verify
```

`npm run build` regenerates installed skill output from a clean APM install. Do not edit `.agents/skills/`, `.claude/skills/`, or `.kiro/skills/` manually.

## Release Files

- [CHANGELOG.md](CHANGELOG.md)
- [docs/release-acceptance-scenarios.md](docs/release-acceptance-scenarios.md)

## Troubleshooting

- Missing skills: rerun `apm install guruguruman/product-build-stacks#v1.0.0 --target all`.
- Generated drift: run `npm run build` and then `npm run generated:verify`.
- Browser command missing: install official `agent-browser`, then rerun `agent-browser --version` and `agent-browser install`.
