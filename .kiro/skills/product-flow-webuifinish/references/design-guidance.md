# Web UI Design Guidance

Use this for broad aesthetic work, missing or conflicting style guidance, shared-component
polish, or previous-version comparisons.

## Style Source Hierarchy

1. Repository `DESIGN.md`, design system, brand guide, token docs, Storybook, Figma-derived assets, or canonical screens.
2. Repeated patterns in nearby screens and shared components.
3. A provisional style lock agreed with the user.

Never silently import another project's taste. A project-specific source wins over this
generic guidance.

## Minimal Style Lock

For broad redesign or multi-screen finishing, align on:

- product feel;
- layout density;
- component language;
- accent discipline;
- content voice.

Ask only about unresolved choices that would materially change the result. Persist a
`DESIGN.md` only when the user approves a repository documentation change.

## Practical Principles

- Match the domain and usage frequency: operational tools should be calm and efficient; marketing can be more expressive; consumer flows should make the next action unmistakable.
- Use text to support action, not compete with controls.
- Avoid decorative card nesting, generic gradients, oversized explanations, and screen-by-screen styling without product justification.
- Use neutral structure with selective semantic color.
- Make buttons, inputs, filters, selected states, dialogs, drawers, tables, and responsive controls visibly operable.
- Align labels, icons, numeric values, fields, cells, and repeated rows visually, not merely technically.
- Prefer a shared fix when the same issue recurs, after checking another usage.

## Previous-Version Comparison

Compare by intent rather than nostalgia:

- first-scan comprehension;
- primary-action clarity;
- density and breathing room;
- control and state legibility;
- consistency across nearby screens;
- relevant breakpoint behavior.

Report what the previous version did better, what the current version improved, and which
parts should be retained or redesigned. Do not perform a rollback without the applicable
safe-change workflow and explicit scope.

## DESIGN.md Shape

When persistence is approved, keep the document concise:

```text
# Design
## Status
## Summary
## Scope / Non-goals
## Audience And Context
## Goals And Principles
## Style Lock
## UI System
## Components And States
## Responsive And Accessibility Constraints
## Key Decisions And Trade-offs
## Verification
## Open Questions
```

Record stable decisions and trade-offs, not per-screen implementation notes.
