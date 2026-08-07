---
name: build-flow-codebasearchitecture
description: "Design deep modules and audit codebase architecture for better seams. Use when the user asks to design deep modules and audit codebase architecture for better seams. Natural requests include \"Please design deep modules and audit codebase architecture for better seams.\" or \"コードベースの境界と構造を設計して\". Do not use for a read-only diff review."
---

# build-flow-codebasearchitecture

Use one of two modes: `design` shapes one selected module; `audit` surveys candidates without implementing them.

## Vocabulary

- **Module:** an interface plus an implementation, at any scale.
- **Interface:** everything a caller must know, including invariants, errors, ordering, configuration, and performance.
- **Depth:** useful behavior available per unit of interface complexity.
- **Seam:** a public boundary where callers and tests observe behavior.
- **Adapter:** an implementation behind a seam for a specific environment.
- **Locality:** related knowledge and change live together.
- **Leverage:** one interface operation unlocks substantial behavior.

## Design Mode

1. Read domain language, relevant ADRs, callers, tests, and recent change history.
2. State the behavior the module should hide and the callers it serves.
3. Apply the deletion test: deleting a useful module should concentrate complexity, not merely move names.
4. Design at least two materially different interfaces. Compare depth, locality, error model, test seam, migration cost, and reversibility.
5. Recommend one design and define observable acceptance tests. Stop before implementation unless requested.

## Audit Mode

1. Select a bounded scan area from the user's direction or recent repository hot spots.
2. Find shallow interfaces, scattered domain logic, hypothetical seams with one implementation, test-only extractions, and cross-module knowledge leaks.
3. Rank only evidence-backed deepening candidates. Do not turn every large file into a finding.
4. Generate a self-contained HTML report under `.build-stacks/architecture/` using [report-template.html](assets/report-template.html). Each candidate includes current shape, proposed deeper shape, files, leverage, locality, tests, and recommendation strength.
5. Use `build-browser-runner` to preview the report when available. Report browser activation honestly.
6. Ask which candidate to design. Do not implement audit findings automatically.

## Output Contract

- mode and inspected scope
- current and proposed interfaces or ranked candidates
- domain/ADR evidence
- test seams and migration constraints
- report path and browser activation for audits
- residual risk
- next handoff
