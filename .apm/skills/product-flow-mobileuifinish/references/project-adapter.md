# Mobile Project Adapter

Use this before the first implementation pass in an unfamiliar mobile repository, or when
screen, navigation, style-source, shared-component, or platform ownership is unclear.

## Lightweight Discovery

Inspect only what the task needs:

- nearest `AGENTS.md`, `CLAUDE.md`, README, and package/platform instructions;
- app root, workspace layout, package manager, Gradle/Xcode/Flutter/SPM/CocoaPods files relevant to the target;
- platform/framework: React Native, Expo, Flutter, SwiftUI/UIKit, Kotlin/Compose/XML, hybrid, or native;
- navigation ownership: routes, tabs, stacks, sheets, deep links, and screen files;
- canonical style source: `DESIGN.md`, design-system docs, token/theme files, Storybook/previews, brand guide, or repeated local UI language;
- simulator/emulator/device launch path and realistic fixture/seed/story state;
- sensitive screenshot constraints and smallest verification commands.

Do not perform this discovery for review-only supplied screenshots unless screen identity
or intended platform state is ambiguous.

## Compact Profile

Keep this in memory unless writing it is explicitly useful:

```text
Mobile UI profile:
- App root and platform/framework:
- Screen/navigation state:
- Target device/orientation:
- Design system/style source:
- Shared components:
- Capture path:
- Verification:
- Safety/privacy constraints:
```

## Selection Rules

- Let local project and platform rules override generic guidance.
- Preserve repeated local visual language before applying general taste.
- Check safe areas, keyboard, dynamic text, small devices, long values, loading/error/empty states, and platform conventions when relevant.
- Before changing a shared component, inspect at least one other usage.
- If no stable style source exists, infer a provisional lock from nearby UI and ask only about decisions that materially change direction.

## Verification By Blast Radius

- Single style adjustment: targeted typecheck/lint and nearby component or snapshot test when available.
- Shared component or theme/tokens: targeted tests plus design-system/theme checks.
- Navigation or native integration: platform build or targeted simulator/emulator smoke.
- Critical user flow: focused e2e when already supported.

Avoid adding a new platform or visual-test toolchain solely for a small finish pass.
