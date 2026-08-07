---
name: build-recipe-implement
description: "Implement an approved spec with tight feedback loops and optional TDD. Use when the user asks to implement an approved spec with tight feedback loops and optional TDD. Common requests include \"implement this spec\", \"TDD\", \"red green refactor\"."
---

# build-recipe-implement

Implement approved behavior in narrow vertical slices. Choose `tdd` mode when explicitly requested or when a reliable behavioral seam exists; otherwise use the repository's normal feedback loop.

## Preconditions

1. Read the spec, ticket, accepted plan, domain glossary, ADRs, repository instructions, and current git state.
2. Identify public seams and acceptance criteria. Resolve material ambiguity before editing.
3. Discover the fastest relevant typecheck, test, lint, build, or runtime command. Run it once to establish the baseline.
4. Record a narrow edit scope when `build-guard-scope` is available.

## TDD Mode

Read [tdd-guidance.md](references/tdd-guidance.md), then repeat:

Red before green is mandatory in this mode.

1. Write one behavior test through an approved public seam.
2. Run it and observe the expected failure for the missing behavior.
3. Write only enough implementation to pass.
4. Run the focused test and relevant static checks.
5. Refactor only while green, then start the next vertical slice.

## Standard Mode

1. Implement the smallest complete vertical behavior.
2. Run the tight feedback command after each meaningful slice.
3. Add or update behavior tests where a stable seam exists.
4. Keep unrelated cleanup out of the diff and report scope pressure before expanding.

## Completion

1. Run focused checks, then the full relevant suite once.
2. Verify every acceptance criterion against observable evidence.
3. Review the diff for correctness, scope, security, and accidental artifacts. Use `build-role-staffengineer` when installed.
4. Report changes and evidence. Commit only when the user requested it; do not merge, push, or publish without explicit approval.

## Output Contract

- mode, source spec, and edit scope
- slices completed and acceptance mapping
- red/green evidence when TDD was used
- files changed and verification commands
- review findings
- residual risk
- next handoff
