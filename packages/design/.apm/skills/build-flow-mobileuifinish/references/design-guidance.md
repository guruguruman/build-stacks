# Mobile UI Design Guidance

Use this for broad aesthetic work, missing or conflicting style guidance, shared-component
polish, or previous-version comparisons.

## Style Source Hierarchy

1. Repository `DESIGN.md`, design system, brand guide, tokens/themes, Storybook/previews, Figma-derived assets, or canonical screens.
2. Repeated patterns in nearby screens and shared components.
3. A provisional style lock agreed with the user.

Never silently import another project's taste. Repository and intentionally selected
platform conventions win over generic guidance.

## Minimal Style Lock

For broad redesign or multi-screen finishing, align on:

- product feel;
- platform feel: iOS-native, Material, brand-led custom, or cross-platform neutral;
- layout density;
- component language;
- accent discipline;
- content voice.

Ask only about unresolved choices that materially change the result. Persist a
`DESIGN.md` only when the user approves a repository documentation change.

## Practical Principles

- Match the domain and usage frequency; operational apps should be quiet and efficient, while consumer or creation tools may be more expressive.
- Use text to support action, not compete with controls.
- Prefer deliberate rows, sheets, segmented controls, guide cells, status treatment, and primary flows over decorative card nesting.
- Use neutral structure with selective semantic color.
- Keep tap targets, selection states, switches, forms, sheets, keyboard behavior, and destructive actions visibly operable.
- Align labels, icons, controls, dates, badges, and repeated rows visually, not merely technically.
- Preserve safe areas, keyboard avoidance, dynamic text, reduced motion, localization, and small-device behavior.
- Prefer a shared fix when the same issue recurs, after checking another usage.

## Previous-Version Comparison

Compare by intent rather than nostalgia:

- first-scan comprehension;
- primary-action clarity;
- density and breathing room;
- touch/control and state legibility;
- consistency across nearby screens;
- safe-area, keyboard, dynamic-text, and small-device behavior.

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
## Audience, Devices, And Context
## Goals And Principles
## Style Lock And Platform Feel
## UI System
## Components And States
## Safe Area, Keyboard, Accessibility, And Localization
## Key Decisions And Trade-offs
## Verification
## Open Questions
```

Record stable decisions and trade-offs, not per-screen implementation notes.
