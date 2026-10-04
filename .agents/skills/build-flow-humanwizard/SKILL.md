---
name: build-flow-humanwizard
description: "Generate a guarded interactive shell wizard for human-only setup steps. Use when the user asks to generate a guarded interactive shell wizard for human-only setup steps. Natural requests include \"Please generate a guarded interactive shell wizard for human-only setup steps.\" or \"人が実行する認証設定wizardを作って\". Do not use for ordinary project setup that the agent can perform safely."
---

# build-flow-humanwizard

Generate an interactive Bash wizard only for steps that genuinely require a human. If the agent can perform the step safely within scope, use the normal workflow instead.

## Workflow

1. Inspect repository setup docs, environment examples, CI secret/variable references, deployment configuration, and current/target states.
2. List stages in dependency order. For every captured value, identify its source, destination, secrecy, validation, and whether persistence is necessary.
3. Verify dashboard paths and commands from current official documentation. Never invent UI instructions.
4. Present the stages and request approval before writing a script.
5. Copy [wizard-template.sh](assets/wizard-template.sh) to a scratch path, then edit only below its `STAGES` marker. Use hidden input for secrets and confirmation gates for irreversible or external actions.
6. Run `bash -n`; run `shellcheck` when available. Trace every value to its declared destination without executing the wizard end-to-end.
7. Keep the wizard ephemeral under `.build-stacks/wizards/` unless the user explicitly wants a reviewed, repeatable repository script.

## Security Contract

- Never echo, log, commit, screenshot, or include real secret values in evidence.
- Do not write a secret to `.env`, CI, or a remote service without explicit approval at that stage.
- Prefer stdin-based destinations such as `set_gh_secret <name> <value-variable>`; never put a secret in command arguments. Pass only the name of an allowlisted shell variable to secret-writing helpers.
- Disable shell xtrace before reading or dereferencing a secret. Require a fresh human confirmation immediately before every GitHub secret or private environment-file write; refusal leaves the destination unchanged.
- File persistence must use `umask 077`, mode `0600`, a same-directory temporary file, and atomic rename. Refuse multiline or non-portable dotenv values instead of using Bash `%q` as dotenv encoding.
- Use allowlisted variable names and quoted values. Refuse arbitrary shell fragments as captured input.
- The wizard must remain restartable and must confirm before irreversible actions.

## Output Contract

- stages and captured values
- script path and persistence decision
- syntax and shellcheck evidence
- secret destinations and redaction status
- unverified dashboard assumptions
- residual risk
- next handoff
