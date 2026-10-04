# build-recipe-autoplan extended workflow

## Intake record

Capture:

- plan path or quoted source
- repository and branch
- base branch assumption
- approved edit boundary
- problem premise and disconfirming evidence
- user-facing scope: yes/no with evidence
- developer-facing scope: yes/no with evidence
- verification commands discovered from the repository

If the plan is edited, retain a pre-edit copy under `.build-stacks/design-docs/<project>/` and place a pointer in the review evidence. Do not overwrite user-owned history.

## Pass 1 — founder stance

Evaluate:

- the concrete user and painful status quo
- why this change is timely
- the smallest valuable wedge
- the first reason to adopt or pay
- explicit non-goals and six-month regret
- existing code or workflow that can be reused

Required output: premise table, alternatives considered, scope cuts or additions, and open product decisions. A change to the user's stated direction remains pending until the user approves it.

## Pass 2 — designer stance

Run when the plan changes user-facing behavior. Evaluate:

- primary journey and recovery paths
- information hierarchy and interaction feedback
- accessibility and responsive behavior
- empty, loading, error, and permission states
- whether mockups or browser evidence support the claims

Required output: journey summary, state coverage, evidence gaps, and design decisions. If skipped, cite the inspected plan evidence showing there is no user-facing surface.

## Pass 3 — engineering-manager stance

Evaluate:

- dependency order and tracer-bullet sequence
- ownership and integration seams
- migration, compatibility, rollout, and rollback
- test layers and release gates
- blast radius, operational burden, and maintenance cost
- work that can be deferred without hiding required scope

Required output: dependency-ordered work list, risk register, acceptance mapping, and delivery blockers. Do not silently reduce completeness to meet an arbitrary file or time limit.

## Pass 4 — DX-lead stance

Run when developers, operators, or agents consume an API, CLI, library, package, configuration, error message, or documentation surface. Evaluate:

- discoverability and natural-language or command ergonomics
- onboarding and migration
- errors, diagnostics, and recovery
- examples and reference documentation
- compatibility across supported hosts
- adoption friction and support burden

Required output: consumer journey, compatibility matrix, documentation changes, and DX acceptance evidence. If skipped, cite the inspected evidence showing no developer-facing surface.

## Optional independent review

Only after the standard passes, and only when explicitly requested:

1. Supply the original plan and read-only repository evidence to one isolated reviewer.
2. Ask for falsifiable omissions and contradictions, not a duplicate summary.
3. Record the host capability used and whether it completed.
4. Reconcile its findings against local evidence. Never treat provider agreement as user approval.

Unavailability is non-blocking and must not remove or weaken any standard pass.

## Final decision register

Use this schema:

| ID | Role | Finding | Evidence | Severity | Recommendation | Decision |
| --- | --- | --- | --- | --- | --- | --- |

Decision is one of `accepted`, `rejected`, `pending-user`, or `not-applicable`.

Before completion verify:

- every accepted finding appears in the revised plan
- every pending decision is visible and blocks only its dependent branch
- role contradictions are named rather than averaged away
- tests and evidence map to public behavior
- external writes, commits, implementation, merge, and deploy have not occurred
- artifacts contain no credentials or private browser state

Finish with findings, decisions, evidence paths, residual risk, and the next handoff.
