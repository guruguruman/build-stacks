---
name: build-flow-domainmodeling
description: "Sharpen domain terminology and record durable architectural decisions. Use when the user asks to sharpen domain terminology and record durable architectural decisions. Common requests include \"domain model\", \"ubiquitous language\", \"record an ADR\"."
---

# build-flow-domainmodeling

Maintain the language used by users, documentation, code, and tests. This skill changes the model; merely reading a glossary does not invoke it.

## Workflow

1. Read `CONTEXT.md` or `CONTEXT-MAP.md`, relevant ADRs, user-facing language, and code that implements the discussed concepts.
2. Surface contradictions immediately. Distinguish overloaded terms, synonyms, states, actors, events, and invariants.
3. Stress-test proposed language with concrete edge-case scenarios. Check whether code behavior agrees.
4. Resolve one canonical term at a time and update the applicable glossary inline after approval.
5. Keep implementation details out of the glossary. Put hard-to-reverse, surprising trade-off decisions in an ADR only when both alternatives were real.
6. For multiple contexts, update the root map and only the context whose language changed. Record cross-context translations explicitly.

Read [document-formats.md](references/document-formats.md) before creating a glossary, context map, or ADR.

## Guardrails

- Never rewrite an established term silently.
- Do not use an ADR for a temporary task note, obvious choice, or reversible implementation detail.
- Treat repository behavior and user statements as potentially conflicting evidence; ask which one is authoritative.

## Output Contract

- terms added, changed, rejected, or still ambiguous
- scenarios used to test the model
- code/document contradictions
- glossary and ADR paths
- decisions and evidence
- residual ambiguity
- next handoff
