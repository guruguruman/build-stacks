# Infrastructure Design Report — {project}

- Generated: {timestamp}
- Skill: `build-flow-infradesign`
- Status: `provisional | confirmed`
- Mode: `existing-repository | migration | greenfield-provisional | component-selection`
- Scope: {scope}
- Source revision: {commit or working-tree state}

## Executive Decision

**Recommendation:** {one-sentence topology}

**Why:** {short evidence-backed rationale}

**Decision-reversing assumption:** {single most important assumption}

**Decisions to confirm:** {material user decisions or "none"}

## User and Use-Case Model

| Actor | Critical job/use case | Frequency/scale | Failure consequence | Evidence |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Current System

```text
{current topology diagram}
```

### Deployable Units

| Unit | Runtime/build | Entrypoint | State/dependencies | Evidence |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Critical Flows

#### Flow F-01 — {name}

```text
entry -> identity -> logic -> data -> side effect -> response
                                      \-> failure/retry
```

- Runtime assumptions:
- Consistency/idempotency assumptions:
- Failure behavior:
- Evidence:

## Evidence Ledger

| ID | Claim | Label | Evidence/source | Infrastructure implication | Confidence |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Labels: `[R]` repository, `[U]` user-confirmed, `[E]` externally verified,
`[H]` hypothesis, `[?]` unknown.

## Constraints

### Hard Constraints

| ID | Constraint | Source | Acceptance condition |
| --- | --- | --- | --- |
| C-01 |  |  |  |

### Preferences

| ID | Preference | Priority | Source |
| --- | --- | --- | --- |
| P-01 |  |  |  |

## Architecture Shape

- Classification:
- Why this is the simplest valid shape:
- What prevents a simpler shape:

## Options

### Option A — {current/minimum topology}

```text
{diagram}
```

- Constraint result:
- Repository fit:
- Required changes:
- Operations:
- Backup/restore/rollback:
- Security/trust boundaries:
- Cost assumptions:
- Lock-in and exit:
- Failure modes:
- Confidence:

### Option B — {recommended topology}

```text
{diagram}
```

- Constraint result:
- Repository fit:
- Required changes:
- Operations:
- Backup/restore/rollback:
- Security/trust boundaries:
- Cost assumptions:
- Lock-in and exit:
- Failure modes:
- Confidence:

### Option C — {expansion topology, omit when unjustified}

```text
{diagram}
```

- Constraint result:
- Repository fit:
- Required changes:
- Operations:
- Backup/restore/rollback:
- Security/trust boundaries:
- Cost assumptions:
- Lock-in and exit:
- Failure modes:
- Confidence:

## Decision Comparison

| Criterion | Priority/weight | Option A | Option B | Option C | Evidence |
| --- | --- | --- | --- | --- | --- |
| Current-code fit |  |  |  |  |  |
| Time to safe release |  |  |  |  |  |
| Migration/rollback |  |  |  |  |  |
| Cost model |  |  |  |  |  |
| Operator burden |  |  |  |  |  |
| Region/latency |  |  |  |  |  |
| Durability/restore |  |  |  |  |  |
| Security/compliance |  |  |  |  |  |
| Lock-in/exit |  |  |  |  |  |

## Rejected Candidates

| Candidate | Reason rejected | Hard constraint or preference | Evidence |
| --- | --- | --- | --- |
|  |  |  |  |

## Recommended Target Topology

```text
{recommended topology and data flows}
```

### Component Responsibilities

| Component | Responsibility | Region | Data classification | Owner |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Backup and Restore

- RPO:
- RTO:
- Backup target and independent failure domain:
- Retention/versioning:
- Credential/deletion separation:
- Restore procedure:
- Restore-test cadence:

### Observability and Operations

- Health/readiness:
- Logs/traces/metrics:
- Alerts:
- Deploy/rollback:
- Migration ordering:
- On-call/owner:

## Migration and Rollback

1. {step}
2. {step}

- Rollback boundary:
- Data compatibility:
- Dual-write/backfill/reconciliation:
- Verification:

## Cost Model

| Cost driver | Assumption | Unit/current source | Expected range | Sensitivity |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

Do not include unsupported precision.

## External Verification

| Claim | Official source | Retrieved | Status |
| --- | --- | --- | --- |
|  |  |  | verified/unverified |

## Findings and Decisions

### Findings

- {finding with evidence}

### Decisions

- {decision and rationale}

## Residual Risk

- {risk, likelihood/impact, mitigation or owner}

## Decisions to Confirm

- {cost, lock-in, migration, durability, security, or scope decision}

## Next Handoff

- Recommended skill:
- Input artifact:
- Explicit approval still required:
