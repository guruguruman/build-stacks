# build-stacks

`build-stacks` is an APM 0.26 monorepo of composable skills for building software. Version 2 broadens the former product-only stack into six installable packages and publishes 47 breaking-change `build-*` skill names.

Authored sources live under `packages/*/.apm/`. Generated target output is committed for reviewability. Runtime state belongs under `.build-stacks/`.

## Packages

| Package | Own skills | Installed closure | Depends on |
| --- | ---: | ---: | --- |
| `build-stacks-core` | 8 | 8 | — |
| `build-stacks-browser` | 8 | 16 | core |
| `build-stacks-design` | 6 | 22 | browser |
| `build-stacks-product` | 5 | 27 | design |
| `build-stacks-delivery` | 14 | 30 | browser |
| `build-stacks-maintainer` | 6 | 47 | product, delivery |

Install the root bundle for the complete stack. The umbrella depends only on `maintainer`; APM follows its dependency closure to the other five packages without duplicating direct roots.

```bash
apm init --yes
apm install guruguruman/build-stacks#v2.0.0 --target all
apm audit --ci
apm compile --validate --local-only
```

To install a narrower closure, point APM at a package path such as `packages/design` or `packages/delivery`. Commit `apm.yml` and `apm.lock.yaml` in consumer repositories.

APM targets are `copilot`, `claude`, `cursor`, `opencode`, `codex`, `gemini`, `windsurf`, and `kiro`. APM converges most skill output into `.agents/skills/`; Claude and Kiro also use their native skill roots.

## Browser runtime

Browser packages depend on official `agent-browser`; they do not vendor it.

```bash
brew install agent-browser
# or: npm i -g agent-browser
agent-browser install
agent-browser doctor --offline --quick
```

`build-browser-runner` owns browser approval, scoped sessions, evidence paths, redaction, and untrusted-content handling. Browser and other durable runtime artifacts stay under `.build-stacks/`.

## Maintainer verification

```bash
npm ci
npm run build
npm test
npm run skill:verify
npm run metadata:verify
npm run stack:verify
npm run generated:verify
npm run apm:verify
npm run smoke:codex
npm run smoke:all
npm run smoke:packages
npm run quality:verify
```

`npm run build` regenerates `.agents/skills/`, `.claude/skills/`, and `.kiro/skills/`; do not edit those roots manually. `npm run quality:verify` is the release-quality contract. The heavier Codex browser E2E remains opt-in with `BUILD_RELEASE_VERIFY_CODEX_E2E=1 npm run release:verify`.

See [the v2 migration guide](docs/migration-v2.md), [acceptance scenarios](docs/release-acceptance-scenarios.md), and [the 47-skill matrix](docs/release-acceptance-skill-matrix.md).
