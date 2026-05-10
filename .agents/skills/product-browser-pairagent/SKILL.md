---
name: product-browser-pairagent
description: Document pair-agent compatibility limits under product-stacks.
---

# product-browser-pairagent

## Status

This skill is implemented with product-build-stacks boundaries under product-stacks architecture. Remote pair-agent workflows can depend on machine-wide state, tunnel exposure, a Chrome extension, or global runtime services that product-stacks deliberately does not expose.

## Degraded Features

- remote tunnel control surface
- sidebar chat bridge

## Product-Stacks Behavior

- Keep public invocation under `product-browser-pairagent`.
- Keep authored source in `.apm/`.
- Keep runtime state and artifacts in `.product-build-stacks/`.
- Report the blocked feature explicitly when a user asks for it.
- Provide the closest repo-local fallback and a concrete next action.

## Output Contract

- findings: what can and cannot be reproduced.
- decisions: which product-stacks fallback was chosen.
- evidence: files, commands, browser artifacts, or docs used.
- residual risk: what remains unavailable because of the degradation.
- next handoff: the next practical command or manual step.
- browser_activation: executed, blocked, report_only, or not_applicable.
