# product-build-stacks

`product-build-stacks` is an APM-managed 52-skill package for product discovery, review, browser QA, release, and runtime discipline.

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

Supported APM 0.9.1 targets under `--target all`: `codex`, `claude`, `cursor`, `copilot`/`vscode`, `opencode`, and `agents`.

## Browser Runtime

Browser workflows use official `agent-browser`. `product-browser-runner` is the Skill/policy layer for approval, evidence paths, redaction, and untrusted browser content.

```bash
brew install agent-browser
# or: npm i -g agent-browser
agent-browser --version
agent-browser install
```

Do not use stale root `browser/`, root `bin/`, or `bin/product-browser` runtime files in a consumer repo.

First public-page smoke:

```bash
_ABR_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
_ABR_REPO_ID="$(printf '%s' "$_ABR_ROOT" | cksum | awk '{print $1}')"
_ABR_SESSION="product-stacks-public-${_ABR_REPO_ID}-${AGENT_BROWSER_RUN_ID:-local}"
mkdir -p .product-build-stacks/artifacts/browser/screenshots .product-build-stacks/browser/downloads
agent-browser --json --content-boundaries --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" open https://example.com
agent-browser --json --content-boundaries --session "$_ABR_SESSION" snapshot -i
agent-browser --json --screenshot-dir .product-build-stacks/artifacts/browser/screenshots --session "$_ABR_SESSION" screenshot
agent-browser --json --session "$_ABR_SESSION" close
```

## Shipped Skills

The public surface is the 52 skills in [docs/release-acceptance-skill-matrix.md](docs/release-acceptance-skill-matrix.md). Names are stable `product-*` names; upstream gstack names are retained only in adaptation metadata.

## Maintainer Verification

```bash
bun install --frozen-lockfile
bun run build
bun run generated:verify
bun run skill:verify
bun run apm:verify
bun run smoke:codex
bun run smoke:all
bun run release:verify
```

`bun run build` regenerates installed skill output from a clean APM install. Do not edit `.agents/`, `.claude/`, `.cursor/`, `.github/skills/`, or `.opencode/` manually.

## Release Files

- [CHANGELOG.md](CHANGELOG.md)
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- [docs/release-acceptance-scenarios.md](docs/release-acceptance-scenarios.md)

## Troubleshooting

- Missing skills: rerun `apm install guruguruman/product-build-stacks#v1.0.0 --target all`.
- Generated drift: run `bun run build` and then `bun run generated:verify`.
- Browser command missing: install official `agent-browser`, then rerun `agent-browser --version` and `agent-browser install`.
