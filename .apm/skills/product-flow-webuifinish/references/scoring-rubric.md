# Web UI Finishing Rubric

Use a weighted 100-point score for ship quality and a separate 120-point stretch view.
Tie every deduction to a screenshot, rendered state, or clearly identified missing state.

## Weighted Score

| Dimension | Weight | Judge |
| --- | ---: | --- |
| UX goal clarity | 25 | The route communicates what the user should understand, decide, or do next. |
| Visual hierarchy | 20 | Primary content, actions, navigation, metadata, and density have a deliberate scan order. |
| Operability | 20 | Buttons, forms, tables, filters, dialogs, drawers, popovers, keyboard paths, and responsive controls are obvious and stable. |
| State expression | 15 | Loading, empty, disabled, error, selected, permission, auth, and success states are legible. |
| System consistency | 10 | Typography, spacing, tokens, rows, cards, chips, buttons, shells, and interactions match nearby screens. |
| Real-data durability | 10 | Long or missing values, localization, dense/sparse data, dates, numbers, and narrow viewports do not break the UI. |

## Bands

- `95-100`: ship quality; only small taste or stretch opportunities remain.
- `88-94`: strong; a few hierarchy, density, state, or consistency gaps remain.
- `78-87`: usable but visibly unfinished.
- `65-77`: functional but rough; structure or controls cause hesitation.
- Below `65`: redesign structure before pixel polish.

## 120-Point Stretch

Treat 100 as the base maximum. Report the remaining stretch opportunity separately; do
not inflate the base score above 100. Stretch quality includes:

- clear intent in the first scan;
- less copy without lost guidance;
- precise alignment and component rhythm;
- resilient edge states and realistic data;
- intentional desktop, tablet, and mobile-responsive behavior;
- reusable tokens/components instead of one-off styling;
- disciplined accents, cards, chips, affordances, and motion;
- no obvious regression from the previous version.

## Deduction Discipline

- Prefer 3-5 material deductions over a long taste checklist.
- Separate observed defects from inferred risks and unverified states.
- Keep functional defects routed to the appropriate QA skill even when they affect the score.
- Re-score the same route, viewport, and state after implementation.

Use this compact report shape:

```text
Score: 91/100. 120 stretch: +14 remaining.
Top gaps:
1. ... Evidence: ...
2. ... Evidence: ...
3. ... Evidence: ...
Next move: ...
```
