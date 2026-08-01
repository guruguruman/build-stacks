# Mobile Capture Protocol

Capture a real native or cross-platform app screen from a simulator, emulator, connected
device, or repository-supported visual harness. Use a supplied screenshot as
`available` evidence when live capture is not requested or possible.

## Evidence Location

Keep captures under:

```text
.product-build-stacks/artifacts/ui-finish/mobile/<run-id>/
```

Do not persist screenshots in authored source, generated skill output, or platform asset
catalogs unless the user explicitly asks for a checked-in fixture.

## Capture Sequence

1. Confirm platform, device, screen, navigation state, orientation, and representative data state.
2. Use the repository's documented launch, deep-link, fixture, story, or preview path.
3. Wait for the real loaded state; do not score a known skeleton, API failure, or setup screen as the target UI.
4. Capture the current screen with the platform-supported method.
5. After implementation, repeat with the same platform, device, orientation, and state.

Common read-only capture commands include:

```bash
# iOS Simulator
xcrun simctl io booted screenshot <evidence-path>.png

# Android emulator or connected device
adb exec-out screencap -p > <evidence-path>.png
```

Use an explicit simulator/device identifier when more than one target is active. Follow
the repository's own tooling for Expo, React Native, Flutter, Swift, Kotlin, previews,
stories, or snapshot harnesses instead of inventing a parallel runtime.

## Visual Artifact Status

- `executed`: a current simulator, emulator, device, or project harness capture was produced and cited.
- `available`: a current user-supplied or repository-provided real app screenshot was inspected.
- `blocked`: a target exists but device, runtime, build, auth, seed, or access prevents inspection.
- `report_only`: only a plan or non-runnable description was reviewed.
- `not_applicable`: no mobile visual surface is part of the request.

Do not claim `executed` for source inspection, a browser route, a static mock, or a stale
image. Route mobile-responsive Web screens to `product-flow-webuifinish`.

## Safety And Privacy

- Do not boot, reset, erase, enroll, sign, install, uninstall, or change device/app state beyond the ordinary requested local workflow without checking project policy and scope.
- Never capture or upload passwords, tokens, private production data, notification contents, or personal information without explicit approval and redaction.
- Do not upload screenshots externally by default. If the user requests sharing and a safe uploader is available, inspect for sensitive content first.
- If external sharing is unavailable or unsafe, return the repository-local evidence path and explain the limitation.
- If capture fails, report the exact blocker and nearest concrete recovery step; do not fabricate a replacement visual.
