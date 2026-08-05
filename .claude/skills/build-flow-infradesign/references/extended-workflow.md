# build-flow-infradesign extended workflow

## Contents

- Output Contract
- Smoke Scenario
- Expected Smoke Output
- Failure Modes

## Output Contract

Every run returns:

- proposed recommendation status: `provisional` or `confirmed`
- scope and execution mode
- user/use-case model
- current-system and critical-flow map
- evidence ledger with `[R]`, `[U]`, `[E]`, `[H]`, and `[?]`
- hard constraints and preferences
- candidate shortlist and disqualifications
- coherent architecture options
- recommended topology and rationale
- migration/rollback implications
- cost and operations assumptions
- durability, backup, restore, security, and failure considerations
- decision-reversing assumptions
- decisions to confirm
- findings
- decisions
- evidence paths
- residual risk
- browser_activation
- next handoff

## Smoke Scenario

Given an existing Next.js repository with:

- Server Actions and API routes.
- A relational schema and transaction-dependent writes.
- Email delivery and file uploads.
- Primarily Japan-based users.
- One operator, a short launch deadline, and low initial traffic.
- Business-critical uploads that cannot be silently lost.

The skill must:

1. Read actual server, data, upload, and email paths before selecting providers.
2. Identify static-export and edge-runtime blockers from repository evidence instead of framework-name heuristics.
3. Ask only for missing decision-flipping facts such as RPO/RTO, data sensitivity, and budget.
4. Evaluate the current baseline and memo-priority Cloudflare/Vercel/database/storage candidates as coherent topologies.
5. Verify current runtime, region, limit, pricing, and backup claims from official sources.
6. Recommend one topology, explain the runner-up, and name the assumption most likely to reverse the decision.
7. Require an independent durable backup or explicitly document why it is not required.
8. Stop before code changes, provider setup, billing, migration, or deployment.

## Expected Smoke Output

- A `provisional` or `confirmed` infrastructure report.
- File-and-line evidence for server/runtime, transactions, uploads, and side effects.
- At least one hard-constraint disqualification where repository evidence supports it.
- Two coherent options unless only one survives hard constraints.
- A recommendation with a current-baseline comparison and migration cost.
- Official source URLs and retrieval dates for time-sensitive claims.
- Explicit RPO/RTO, backup, restore, and operator assumptions.
- Decisions to confirm and a safe next handoff.

Structural candidate verification is not a behavioral smoke test. Promotion requires
running this scenario against a representative repository and reviewing the resulting
report against the expectations above.

## Failure Modes

- Converting the candidate memo into an unconditional if/else tree.
- Choosing from framework or provider names before reading the repository.
- Listing files without tracing critical flows.
- Treating inferred users, traffic, compliance, or durability as confirmed facts.
- Selecting runtime, database, storage, and jobs independently without checking compatibility.
- Ignoring the current baseline or migration/rollback cost.
- Recommending static export despite observed server-time behavior.
- Recommending an edge runtime without checking actual Node/native/runtime usage.
- Optimizing storage price without explicit backup and restore reasoning.
- Citing remembered provider pricing, regions, limits, or maturity as current facts.
- Producing false cost precision without workload assumptions.
- Persisting secrets or personal data in reports.
- Provisioning, deploying, migrating, billing, or making external writes without explicit approval.
