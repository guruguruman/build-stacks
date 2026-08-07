---
name: build-flow-domainmodeling
description: "Sharpen domain terminology and record durable architectural decisions. Use when the user asks to sharpen domain terminology and record durable architectural decisions. Natural requests include \"Please sharpen domain terminology and record durable architectural decisions.\" or \"ドメイン用語を整理してADRを残して\". Do not use for broad product discovery without a terminology or decision-record goal."
---

# build-flow-domainmodeling

Maintain the language used by users, documentation, code, and tests. This skill changes the model; merely reading a glossary does not invoke it.

## Workflow

1. Read `CONTEXT.md` or `CONTEXT-MAP.md` when present, relevant ADRs, user-facing language, and code that implements the discussed concepts. Do not require a setup workflow.
2. Surface contradictions immediately. Distinguish overloaded terms, synonyms, states, actors, events, and invariants.
3. Stress-test proposed language with concrete edge-case scenarios. Check whether code behavior agrees.
4. Resolve one canonical term at a time and update the applicable glossary inline after approval.
5. Keep implementation details out of the glossary. Put hard-to-reverse, surprising trade-off decisions in an ADR only when both alternatives were real.
6. For multiple contexts, update the root map and only the context whose language changed. Record cross-context translations explicitly.

If no durable domain document exists, work in the response first. Only after the terminology is useful and the user approves persistence, propose the smallest collision-safe `CONTEXT.md` or `CONTEXT-MAP.md` plus `docs/adr/` layout. Never edit generated `AGENTS.md`, `GEMINI.md`, or target skill roots.

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
