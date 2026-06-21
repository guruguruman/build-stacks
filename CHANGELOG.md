# Changelog

## Unreleased

- Added `product-flow-goaldirectedux` for Goal-Directed UX Design, including personas, scenarios, requirements, UX framework, and implementation handoff guidance.
- Made heavy Codex E2E smoke opt-in for `release:verify` to avoid routine creation of large local Docker/runtime images.

## 1.0.0 - 2026-05-06

Release name: `1.0.0-release`

- Promoted `product-build-stacks` to the public `v1.0.0` APM package contract.
- Fixed `.apm/` as the only authored source of truth and removed the unsupported hybrid manifest shape.
- Shipped the current 40 `product-*` skills as the stable public surface.
- Added APM generated output sync, clean consumer install smoke gates for `codex` and `all`, release checks, and secret scan.
- Added MIT license, release notes, and the 40-skill ship matrix.
