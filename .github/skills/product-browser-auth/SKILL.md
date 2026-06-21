---
name: product-browser-auth
preamble-tier: 2
version: 1.0.0
description: |
  Guarded cookie import and authenticated browser setup. This browser evidence workflow
  keeps product-* public interfaces, .apm source guidance, and .product-build-stacks
  runtime evidence boundaries aligned.
  Produces browser_activation status, commands run, screenshots or snapshots when
  available, findings, residual risk, and next handoff.
  Use when asked to "browser auth", "authenticated browser", "cookie setup", or when the
  requested work matches product-browser-auth.
  Proactively suggest when this workflow would reduce ambiguity, preserve evidence
  discipline, or create a cleaner handoff.
  Voice triggers: "browser auth", "authenticated browser", "cookie setup".
benefits-from: [product-browser-runner, product-guard-destructive]
triggers:
  - product-browser-auth
  - browser auth
  - authenticated browser
  - cookie setup
---

# product-browser-auth

## Status

This skill provides a simple authenticated browser setup workflow for cases
where the user asks to log in, import cookies, reuse an authenticated browser
state, or prepare browser QA for pages behind auth.

## Product-Stacks Behavior

- Keep public invocation under `product-browser-auth`.
- Keep authored source in `.apm/`.
- Keep runtime state and artifacts in `.product-build-stacks/`.
- Keep the workflow simple. Do not introduce separate auth/profile status enums.
- If the user asked for login, cookie import, or authenticated browser state, that
  request is the approval to start the auth setup workflow.
- Use official `agent-browser` auth/profile/cookie capabilities when available.
  If the installed runtime does not support a requested auth operation, report it
  as blocked with the exact missing runtime capability and next command.
- Summarize imported domains, counts, profile paths, and redactions only. Never
  print cookie values, authorization headers, bearer tokens, API keys, or secrets.
- Store any repo-local profile, state, screenshot, or report only under
  `.product-build-stacks/`.

## Output Contract

- findings: what can and cannot be reproduced.
- decisions: which auth setup path was used or why it was blocked.
- evidence: files, commands, browser artifacts, or docs used.
- residual risk: what remains unavailable because of the degradation.
- next handoff: the next practical command or manual step.
- browser_activation: executed, blocked, report_only, or not_applicable.
