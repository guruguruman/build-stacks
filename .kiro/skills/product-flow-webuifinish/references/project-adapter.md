# Web Project Adapter

Use this before the first implementation pass in an unfamiliar Web repository, or when
route, state, style-source, or shared-component ownership is unclear.

## Lightweight Discovery

Inspect only what the task needs:

- nearest `AGENTS.md`, `CLAUDE.md`, README, and package-specific instructions;
- app root, package manager, framework, route system, and relevant scripts;
- canonical style source: `DESIGN.md`, design-system docs, Storybook, tokens, brand guide, or repeated local UI language;
- likely route/component ownership and at most 2-4 relevant shared files before editing;
- dev/preview/harness command and exact capture route;
- relevant data/auth fixtures and sensitive screenshot constraints;
- smallest verification commands for the anticipated blast radius.

Do not perform this discovery for a review-only supplied screenshot unless screen identity
or intended state is ambiguous.

## Compact Profile

Keep this in memory unless writing it is explicitly useful:

```text
Web UI profile:
- App root and framework:
- Route and state:
- Design system/style source:
- Shared components:
- Capture command and viewport:
- Verification:
- Safety/privacy constraints:
```

## Selection Rules

- Let local project rules override generic guidance.
- Preserve repeated local visual language before applying general taste.
- Use realistic fixtures, long values, empty/error/loading states, and relevant breakpoints.
- Before changing a shared component, inspect at least one other usage.
- If no stable style source exists, infer a provisional lock from nearby UI and ask only about decisions that materially change direction.

## Verification By Blast Radius

- Single style adjustment: targeted typecheck/lint and nearby component test when available.
- Shared component or tokens: typecheck/lint plus design-system or token checks.
- Route/state boundary: targeted smoke or harness check.
- Critical interaction: focused e2e when already supported.

Avoid adding a new test or design toolchain solely for a small finish pass.
