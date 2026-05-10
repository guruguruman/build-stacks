---
name: product-browser-auth
description: Provide guarded browser auth setup with explicit user approval.
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
