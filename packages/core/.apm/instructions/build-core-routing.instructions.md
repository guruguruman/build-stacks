---
description: Route requests to the correct build-stacks skill.
applyTo: "**/*"
---

# build-core-routing

Route requests to the published `build-*` skill names only.
Treat cross-package skill references as optional handoffs. Route only when the target skill is installed and discoverable; otherwise complete the safe subset in the active skill or name the additional package required without claiming the handoff ran.

When the user asks which workflow fits, route by intent instead of exposing the catalog as a flat menu:

- unclear idea or decision frontier: `build-recipe-discovery`
- domain terms or ADRs: `build-flow-domainmodeling`
- cited reading: `build-recipe-research`
- spec or tracer-bullet tickets: `build-flow-specwork`
- implementation or test-first work: `build-recipe-implement`
- difficult bug: `build-recipe-investigate`
- architecture design or survey: `build-flow-codebasearchitecture`
- issue intake: `build-flow-triage`
- multi-session uncertainty: `build-recipe-wayfinding`
- human-only setup steps: `build-flow-humanwizard`

Ask one routing question only when two routes would produce materially different work and repository evidence cannot decide.
