# Changelog

## Unreleased

## 1.0.0 - 2026-07-23

Release name: `1.0.0-release`

- Promoted `product-build-stacks` to the public `v1.0.0` APM package contract.
- Fixed `.apm/` as the only authored source of truth and removed the unsupported hybrid manifest shape.
- Shipped the current 42 `product-*` skills as the stable public surface.
- Upgraded the maintainer and generated-output contract from APM 0.9.1 to APM 0.26.0 and adopted converged `.agents/skills` output with native Claude and Kiro roots.
- Added `product-flow-infradesign` for repository-first infrastructure topology design, current provider verification, durability analysis, and implementation handoff.
- Added `product-flow-goaldirectedux` for Goal-Directed UX Design, including personas, scenarios, requirements, UX framework, and implementation handoff guidance.
- Added APM generated output sync, clean consumer install smoke gates for `codex` and `all`, release checks, and secret scan.
- Made heavy Codex E2E smoke opt-in for `release:verify` to avoid routine creation of large local Docker/runtime images.
- Added MIT license, release notes, and the 42-skill ship matrix.
