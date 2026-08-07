# Domain document formats

## CONTEXT.md

```markdown
# Domain context

## Terms

### Canonical term

One domain-only definition. Include explicit non-examples when ambiguity is likely.

## Relationships

- A concrete relationship between canonical terms.
```

## CONTEXT-MAP.md

```markdown
# Context map

| Context | Glossary | Owns | Translates with |
|---|---|---|---|
| Ordering | src/ordering/CONTEXT.md | Order lifecycle | Billing: Charge |
```

## ADR

```markdown
# NNNN — Decision title

## Status

Accepted

## Context

Why this hard-to-reverse and surprising decision was required.

## Decision

The selected option and the domain language it establishes.

## Alternatives

Real alternatives and why they lost.

## Consequences

Positive, negative, and follow-up consequences.
```
