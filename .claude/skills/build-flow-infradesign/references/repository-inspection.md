# Repository Inspection Guide for build-flow-infradesign

## Goal

Build an explicit runtime and data-flow model from actual usage. Dependency presence
is only a search hint. A package in a manifest does not prove that a production path
uses it.

## Pass 1: Repository and Deployable Units

Use `rg --files` to identify:

- Workspace manifests and package-manager configuration.
- Application, worker, service, function, job, and shared-package boundaries.
- Build, test, lint, typecheck, and start commands.
- Containers, IaC, CI/CD, provider config, and environment examples.
- Existing architecture, deployment, incident, backup, and migration docs.

Record:

- Deployable unit.
- Entrypoint.
- Runtime target.
- Build output.
- Incoming interfaces.
- Outgoing dependencies.
- Current deploy evidence.

Do not recurse through generated output, dependencies, caches, or credential directories.

## Pass 2: Runtime and Rendering

Trace actual code for:

- Static generation and build-time data.
- Server rendering and request-time data.
- API routes, actions, RPC, GraphQL, or server handlers.
- Cookies, headers, sessions, authentication, and authorization.
- Runtime environment-variable access.
- Filesystem, subprocess, sockets, native modules, and Node-specific APIs.
- Long-running, CPU-heavy, memory-heavy, or streaming work.
- WebSocket, SSE, realtime subscriptions, and coordination.

Potential static-export blockers and potential edge-runtime blockers are investigation
signals, not automatic conclusions. Confirm behavior against current framework and
provider documentation.

## Pass 3: Data and Consistency

Locate:

- Schema definitions and migrations.
- ORM/query-builder/database drivers.
- Transactions and transaction boundaries.
- Joins, constraints, uniqueness, locking, upserts, and conflict handling.
- Raw SQL, extensions, triggers, stored procedures, and database jobs.
- Tenant boundaries and access-control enforcement.
- Connection pooling and runtime-specific adapters.
- Seed, import/export, backup, and restore tooling.

For each critical write, document:

```text
input -> validation -> authorization -> transaction boundary ->
durable write -> side effect -> acknowledgement -> retry/idempotency
```

Identify what would happen under duplicate delivery, partial failure, concurrent
writes, stale reads, and regional/network failure.

## Pass 4: Files and Object Storage

Locate:

- Upload endpoints, signed URLs, direct-to-storage flows, and proxy uploads.
- Temporary local-file usage.
- Metadata and object-key ownership.
- Size/type validation and malware scanning.
- Versioning, deletion, retention, lifecycle, and legal hold.
- Backup jobs and restore procedures.
- Public/private access and CDN behavior.

Distinguish:

- Rebuildable artifacts.
- User-owned durable data.
- Business records.
- Compliance-sensitive objects.

Do not infer durability from a storage brand. Require explicit backup and restore evidence.

## Pass 5: External Side Effects

Trace:

- Email and notification sends.
- Payment creation, confirmation, refund, and webhook flows.
- Auth providers and account linking.
- Webhooks in and out.
- Search, analytics, AI, maps, media, and other third parties.
- Retries, idempotency keys, dead-letter handling, and reconciliation.

Record which system is authoritative for each state transition.

## Pass 6: Async, Scheduled, and Realtime Work

Locate:

- Cron and scheduled triggers.
- Queues, workers, job tables, and polling loops.
- Retry/backoff and dead-letter behavior.
- Ordering and concurrency assumptions.
- Realtime rooms, presence, subscriptions, and coordination state.
- Work that can exceed an HTTP request lifetime.

Separate:

- Fire-and-forget convenience.
- Eventually consistent business work.
- Business-critical work that requires durable delivery and reconciliation.

## Pass 7: Operations and Failure Evidence

Inspect:

- Environments and promotion flow.
- Preview/staging/production differences.
- CI/CD and deployment gates.
- Health/readiness checks.
- Logs, traces, metrics, alerting, and error reporting.
- Feature flags and rollback.
- Database migration ordering.
- Backup schedule, restore tests, incident docs, and on-call ownership.

Absence is a finding when the product depends on the capability.

## Pass 8: User and Use-Case Evidence

Use:

- Route and screen names.
- User-visible copy and notifications.
- Roles and permissions.
- Domain models and API names.
- Tests, fixtures, stories, and examples.
- Analytics events and billing logic.

Infer:

- Primary actor.
- Primary value-producing action.
- Critical data and side effects.
- Public/private/internal audience.
- Geography and latency hints.
- Usage frequency and burst patterns.

Label these `[H]` until corroborated by user evidence or production data.

## Evidence Ledger Format

```markdown
| ID | Claim | Label | Evidence | Infrastructure implication | Confidence |
| --- | --- | --- | --- | --- | --- |
| E-01 | Request-time database read exists | [R] | path/file.ts:42 | Pure static export needs redesign | high |
| E-02 | Most users are in Japan | [U] | user confirmation | Region/latency criterion | high |
| E-03 | Traffic is low and bursty | [H] | no production metrics | Cost model remains provisional | low |
```

Every hard constraint and recommendation must link back to ledger IDs.

## Minimum Completion Gate

Repository inspection is complete only when:

- Deployable units and runtime targets are mapped.
- Primary read and write flows are traced.
- Auth is traced if present.
- Each external side effect is located.
- Data and object durability assumptions are explicit.
- Async/realtime paths are traced if present.
- Current deploy and operations evidence is recorded.
- User/use-case conclusions are labeled by evidence quality.
- Unknowns that could reverse the decision are named.
