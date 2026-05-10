---
name: product-internal-modelbenchmark
description: Internal maintainer workflow for comparing model outputs, prompts, providers, and product-stacks skill quality.
---

# product-internal-modelbenchmark

Use this skill to compare model outputs for a concrete product workflow, prompt, or skill handoff.

## Workflow

1. Define the prompt source: inline prompt, prompt file, or one installed `product-*` skill.
2. Define 2-3 model/provider candidates and the exact invocation method available in the current repo.
3. If a provider is not configured, mark that provider as not run and name the missing setup.
4. Run each available candidate with the same prompt, same context, and the same output contract.
5. Save raw outputs under `.product-build-stacks/evidence/modelbenchmark/<run-id>/`.
6. Score each output on correctness, completeness, product judgment, evidence quality, and operational risk.

## Internal Preparation Workflow

Before running candidate models, prepare the benchmark input in the same run directory:

1. Capture the prompt source and normalize it into `.product-build-stacks/evidence/modelbenchmark/<run-id>/prompt.md`.
2. Capture provider setup status without printing secrets.
3. Capture model names, temperature or equivalent sampling settings, and any cost limits.
4. Prepare the rubric before generation so each candidate is judged against the same criteria.
5. Keep this skill maintainer/eval oriented; do not present it as a primary product workflow.

## Fail-Soft Runtime Contract

Never return an empty final output. If Codex, a provider CLI, websocket, network,
DNS, credentials, or model access fails, emit a useful blocked or partial report
instead of failing silently.

Use these status values:

- `model_benchmark_status: executed` when at least two comparable provider/model
  outputs were run and scored.
- `model_benchmark_status: partial` when at least one candidate ran but the full
  matrix could not be completed.
- `model_benchmark_status: blocked` when no candidate could run.

For `partial` or `blocked`, include:

- `activation_quality: warn`
- blocked reason with the failing command, provider, or connection class.
- providers attempted and providers run.
- evidence paths that were created before the failure.
- the exact setup or rerun command needed next.

## Output Contract

- benchmark prompt and source
- providers attempted
- providers run
- raw output paths
- score table
- recommended model for this workflow
- residual risk and rerun command
- model_benchmark_status: executed, partial, or blocked
- activation_quality: pass, warn, or fail

Do not call unshipped `product-stacks-*` binaries. Use repo-local commands, provider CLIs, or user-approved manual runs only.
