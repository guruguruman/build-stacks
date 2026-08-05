# Mobile UI Finishing Rubric

Use a weighted 100-point score for ship quality and a separate 120-point stretch view.
Tie every deduction to a real or supplied app screenshot, an observed device state, or a
clearly identified unverified constraint.

## Weighted Score

| Dimension | Weight | Judge |
| --- | ---: | --- |
| UX goal clarity | 25 | The screen communicates what the user should understand, decide, or do next. |
| Visual hierarchy | 20 | Content, actions, navigation, metadata, and repeated rows have a deliberate scan order. |
| Operability | 20 | Tap targets, switches, selection rows, forms, sheets, gestures, and keyboard behavior are obvious and stable. |
| State expression | 15 | Loading, empty, disabled, error, selected, permission, offline, success, and destructive states are legible. |
| System consistency | 10 | Typography, spacing, rows, controls, headers, sheets, tokens, and motion match nearby screens and platform conventions. |
| Device durability | 10 | Small devices, safe areas, dynamic text, long/localized values, orientation, and keyboard states do not break the UI. |

## Bands

- `95-100`: ship quality; only small taste or stretch opportunities remain.
- `88-94`: strong; a few hierarchy, state, platform, or consistency gaps remain.
- `78-87`: usable but visibly unfinished.
- `65-77`: functional but rough; structure or controls cause hesitation.
- Below `65`: redesign structure before pixel polish.

## 120-Point Stretch

Treat 100 as the base maximum. Report the remaining stretch opportunity separately. It
includes:

- clear intent in the first scan;
- precise row, control, icon, label, date, and badge alignment;
- stable safe-area and keyboard behavior;
- resilient small-device, dynamic-text, localization, and edge-data states;
- appropriate iOS, Material, or agreed cross-platform conventions;
- reusable tokens/components instead of one-off styling;
- disciplined accents, cards, chips, tap affordances, and motion;
- no obvious regression from the previous version.

## Deduction Discipline

- Prefer 3-5 material deductions over a long taste checklist.
- Separate visible defects from inferred risks and unverified devices/states.
- Route functional or platform-runtime defects to the relevant project workflow.
- Re-score the same screen, device, orientation, and state after implementation.

Use this compact report shape:

```text
Score: 91/100. 120 stretch: +14 remaining.
Top gaps:
1. ... Evidence: ...
2. ... Evidence: ...
3. ... Evidence: ...
Next move: ...
```
