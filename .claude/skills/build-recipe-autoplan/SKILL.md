---
name: build-recipe-autoplan
description: "Create and harden implementation plans through founder, design, engineering, and DX review. Use when the user asks to create and harden implementation plans through founder, design, engineering, and DX review. Natural requests include \"Please create and harden implementation plans through founder, design, engineering, and DX review.\" or \"複数の専門視点で計画を自動レビューして\". Do not use for one explicitly named review role."
---

# build-recipe-autoplan

Harden one implementation plan through sequential founder, design, engineering-manager, and developer-experience passes. This is one coordinator; the roles are stances used inside the workflow, not additional coordinators.

## Preconditions

1. Read repository instructions, the plan, relevant domain docs and ADRs, current git state, and the fastest verification commands.
2. State the plan source, edit scope, working assumptions, and detected base branch.
3. Confirm the problem premise with the user when it is missing or materially uncertain. Do not auto-decide product direction, security posture, cost, or irreversible scope expansion.
4. Save durable review evidence under `.build-stacks/design-docs/` only when the task calls for a file artifact.

## Standard execution

Run the following passes in the same session and in this strict order:

1. `build-role-founder`: problem wedge, current alternative, adoption friction, commercial reason, and explicit non-goals.
2. `build-role-designer`: interaction, accessibility, hierarchy, and evidence quality. Skip only when the plan has no user-facing behavior, and state why.
3. `build-role-engmanager`: sequencing, ownership, blast radius, rollback, maintainability, and test strategy.
4. `build-role-dxlead`: API ergonomics, onboarding, documentation, debugging, and migration friction. Skip only when there is no developer-facing surface, and state why.

Complete each pass before starting the next. Carry accepted findings forward, identify contradictions between role stances, and resolve only mechanical conflicts. Ask the user through any available user-input mechanism when alternatives materially differ in kind or consequence; stop that decision branch until answered.

## Independent reviewer

An isolated or external reviewer is optional. Use one only when the user explicitly requests an independent opinion and the host supports an isolated review capability. Give it the unmodified plan and repository evidence, keep it read-only, and label its output separately.

If that capability is unavailable, record `independent_reviewer: unavailable` and continue the standard four-pass workflow. Never require a particular provider, CLI, model, parallel execution, or child-agent mechanism.

## Plan synthesis

After the passes:

1. Produce one consolidated finding register with severity, evidence, affected plan step, recommendation, and decision status.
2. Separate mechanical corrections from taste decisions and changes to the user's stated direction.
3. Apply approved corrections to the plan without erasing rejected alternatives or unresolved decisions.
4. Verify that every work item has an owner or execution stance, dependencies, acceptance evidence, rollback or forward-fix posture, and a clear handoff.
5. Re-read the final plan once from each applicable role stance. Do not start implementation.

Read [extended-workflow.md](references/extended-workflow.md) for the pass checklist and final artifact schema.

## Output contract

- plan source and edit scope
- applicable and skipped role passes with reasons
- findings and decisions by role
- contradictions and their resolution status
- optional independent-reviewer status
- revised plan or proposed delta
- verification and residual risk
- next handoff
