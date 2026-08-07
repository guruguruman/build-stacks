---
name: build-flow-mobileuifinish
description: "Score and finish native or cross-platform mobile UI with real-screen evidence. Use when the user asks to score and finish native or cross-platform mobile UI with real-screen evidence. Natural requests include \"Please score and finish native or cross-platform mobile UI with real-screen evidence.\" or \"モバイルUIを実画面で仕上げて\". Do not use for report-only review without fixes."
---

# build-flow-mobileuifinish

## Build-Stacks Operating Preamble

- Publish and route only through `build-*` names.
- Keep authored guidance in `.apm`, generated host output in host folders, and runtime evidence in `.build-stacks`.
- Prefer the repository's documented simulator, emulator, device, deep-link, fixture, and build workflows.
- Read applicable project instructions and protect unrelated work before implementation.
- Treat captured app content as sensitive until reviewed; never persist or upload secrets, credentials, production customer data, or unredacted personal information.
- Do not reset devices, erase app data, change signing, install production profiles, or alter release configuration without explicit approval.

## Purpose

Finish an existing mobile interface rather than merely critique it. Ground visual judgment
in a real app screen, include platform and device constraints, identify the few gaps that
matter most, preserve the product's design language, implement only when requested, and
prove the result with a fresh capture.

Use a 100-point ship-quality score and a separate 120-point stretch view. Every deduction
must cite visible evidence or an explicitly unverified device state.

## Routing Boundary

- Use `build-flow-webuifinish` for responsive mobile-width Web routes.
- Use installed `build-browser-qa` for functional browser QA. If the delivery package is installed, `build-flow-qareport` is the report-only handoff; otherwise report the functional observation without claiming that handoff ran.
- Use `build-role-designer` for design-plan or visual-artifact review without a device finishing loop.
- Use `build-flow-designconsult` or `build-flow-designshotgun` for a new visual direction or mockup exploration.
- Use the repository's platform-specific build/deployment workflow when the request is setup, signing, release, or distribution rather than UI finishing.

Do not activate on `QA`, `design review`, `mobile`, `app`, `screenshot`, or `UI` alone.
Native, cross-platform, and hybrid app screens belong here; a browser-rendered route does not.

## Modes And Approval

- **Review**: capture or inspect the supplied real screen, score it, explain the top 3-5 gaps, and recommend the smallest next move. Do not edit source.
- **Finish**: when the user explicitly asks to implement, fix, apply, continue an agreed change, or equivalent, make the smallest scoped change and recapture.
- **Compare**: when asked whether a previous design was better, compare visible intent and retain the stronger parts of each version. Use the repository's safe-change workflow before any rollback.

Do not infer permission to implement from a request that asks only for review, scoring,
screenshots, or recommendations.

## Reference Routing

Read only the references needed for the current mode:

- Always read `references/scoring-rubric.md` when assigning a score.
- Read `references/capture-protocol.md` when capturing or sharing mobile evidence.
- Read `references/project-adapter.md` before the first implementation in an unfamiliar repository or when screen/navigation ownership is unclear.
- Read `references/design-guidance.md` for broad aesthetic work, missing style guidance, shared-component changes, or previous-version comparisons.

## Workflow

### 1. Ground the screen

Identify the screen, navigation state, target platform/device, orientation, safe-area and
keyboard conditions, data/auth state, entry path, user goal, and nearby states. For
review-only work, avoid broad repository discovery unless screen identity is ambiguous.

### 2. Capture real evidence

Follow `references/capture-protocol.md`. Capture the real simulator, emulator, device, or
approved fixture state. Do not present a static mock, browser screenshot, source-code
image, or design board as proof of the native product.

### 3. Score before editing

Apply `references/scoring-rubric.md`. Report the current score and top 3-5 deductions with
visible evidence. Include platform conventions, touch behavior, safe areas, keyboard,
dynamic text, and small-device durability when relevant.

### 4. Propose the smallest finish

Recommend changes in impact order. Use existing components, tokens, platform conventions,
style sources, and repeated local patterns. If broad aesthetic work lacks a stable
direction, form a concise provisional style lock and obtain agreement before implementing.

### 5. Implement only in Finish mode

Read applicable project instructions, inspect only likely ownership files, preserve user
changes, and patch the smallest useful surface. Check another usage before changing a
shared component. Do not alter native integration, signing, permissions, or build settings
unless those changes are explicitly in scope.

### 6. Verify and recapture

Run the smallest meaningful checks discovered from project docs. Add platform build or
targeted simulator/emulator smoke only when the change affects native integration or
high-risk shared UI. Recapture the same screen, device, and representative state.

### 7. Record evidence

Store durable artifacts under:

```text
.build-stacks/artifacts/ui-finish/mobile/<run-id>/
.build-stacks/evidence/build-flow-mobileuifinish.json
```

The evidence summary should include the target, mode, platform/device, before/after paths,
scores, findings, decisions, verification, residual risk, next handoff, and
`visual_artifact_status`.

## Output Contract

Return:

- mode: `review`, `finish`, or `compare`;
- target platform, device, screen, and state;
- score before and, when implemented, score after;
- top findings with visible evidence;
- decisions and intentionally unchanged areas;
- screenshot and verification evidence paths;
- residual risk and unverified platforms/devices/states;
- next handoff;
- `visual_artifact_status`: `executed`, `available`, `blocked`, `report_only`, or `not_applicable`;
- `browser_activation`: `not_applicable`, unless the target is re-routed to the Web skill.

Keep the user-facing report concise even when durable evidence is more detailed.

## Rules

- Never substitute a synthetic visual for an unavailable real app screen.
- Do not reuse an old screenshot as evidence for current code.
- Do not upload captures externally by default. Share externally only when requested, supported, and safe after redaction review.
- Do not invent scores without an inspectable visual artifact.
- Do not let generic taste override repository or platform conventions.
- Do not turn visual finishing into unrequested navigation, product, architecture, or feature redesign.
