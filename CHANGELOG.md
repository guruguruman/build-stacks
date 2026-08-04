# Changelog

## Unreleased

## 2.0.0 - 2026-08-04

- Renamed the public skill namespace from `product-*` to `build-*` and the runtime root from `.product-build-stacks/` to `.build-stacks/`.
- Split the authored APM source into six dependency-aware packages: core, browser, design, product, delivery, and maintainer.
- Added `build-flow-organize-stack` to audit package ownership, dependency cycles, closure composition, catalog drift, and legacy identifiers.
- Standardized all 47 skills on `name` and `description` frontmatter, generated `agents/openai.yaml`, and the conventional `scripts/`, `references/`, and `assets/` resource layout.
- Added package-closure smoke tests, metadata verification, stack analysis, v2 migration guidance, and generated-output verification for the monorepo layout.

## 1.1.0 - 2026-08-01

Release name: `1.1.0-release`

- Added `build-flow-webuifinish` for score-based rendered Web UI finishing with official browser evidence, scoped implementation, and before/after recapture.
- Added `build-flow-mobileuifinish` for score-based native and cross-platform mobile UI finishing with simulator, emulator, device, or supplied-screen evidence.
- Added `build-flow-securitygate`, a 32-control evidence-backed prelaunch security gate with deterministic report validation and GO, CONDITIONAL GO, or NO-GO verdicts.
- Added `build-flow-pdmscaffold`, a neutral collision-safe `docs/pdm` scaffold with canonical product documents, persona guidance, and research-note templates.
- Hardened the PdM scaffold against normal and broken destination symlinks so generated files cannot escape the selected project root.
- Added a mandatory `quality:verify` gate and made `release:verify` and CI invoke it, including agent-browser health, live screenshot evidence, secret scanning, and diff hygiene.

## 1.0.0 - 2026-07-23

Release name: `1.0.0-release`

- Promoted `build-stacks` to the public `v1.0.0` APM package contract.
- Fixed `.apm/` as the only authored source of truth and removed the unsupported hybrid manifest shape.
- Shipped the current 42 `product-*` skills as the stable public surface.
- Upgraded the maintainer and generated-output contract from APM 0.9.1 to APM 0.26.0 and adopted converged `.agents/skills` output with native Claude and Kiro roots.
- Added `build-flow-infradesign` for repository-first infrastructure topology design, current provider verification, durability analysis, and implementation handoff.
- Added `build-flow-goaldirectedux` for Goal-Directed UX Design, including personas, scenarios, requirements, UX framework, and implementation handoff guidance.
- Added APM generated output sync, clean consumer install smoke gates for `codex` and `all`, release checks, and secret scan.
- Made heavy Codex E2E smoke opt-in for `release:verify` to avoid routine creation of large local Docker/runtime images.
- Added MIT license, release notes, and the 42-skill ship matrix.
