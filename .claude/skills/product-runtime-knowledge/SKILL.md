---
name: product-runtime-knowledge
description: Provide repo-local knowledge setup under .product-build-stacks instead of gstack global gbrain.
---

# product-runtime-knowledge

Ported boundary from gstack setup-gbrain at garrytan/gstack@30fe6bb11c6915e6264440b8a044ed0dcfbe06e0.

## Status

This skill is implemented with product-build-stacks boundaries under product-stacks architecture. The user-visible goal is preserved where possible, but the gstack implementation depends on machine-wide state, tunnel exposure, a Chrome extension, or global runtime services that product-stacks deliberately does not expose.

## Degraded Features

- Supabase/community gbrain sync
- machine-wide .product-build-stacks knowledge store

## Product-Stacks Behavior

- Keep public invocation under `product-runtime-knowledge`.
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
