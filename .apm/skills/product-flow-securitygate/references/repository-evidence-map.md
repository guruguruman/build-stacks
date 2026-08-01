# Repository security-gate evidence map

Use this map to locate evidence; it is not evidence by itself. Verify current paths and project-specific instructions before drawing conclusions.

## Required reading order

1. Root `AGENTS.md`, `CLAUDE.md`, `README.md`, and security or contributing guidance.
2. Architecture, authentication, session, data-classification, deployment, and operations documentation.
3. In-scope package instructions and verification harnesses.
4. Nearby implementation, tests, fixtures, CI, infrastructure, and runbooks.

## Trust boundaries

| Boundary | Expected property | Primary control IDs |
| --- | --- | --- |
| User client to service | Explicit authentication, revocation, no unsafe credential fallback | IAM-01, IAM-04, SEC-01 |
| Browser and SSR | Server credentials stay server-only; cookies and cross-origin paths resist CSRF | IAM-01, INF-04, SEC-01 |
| Tenant resources | Membership, role, and resource ownership on every operation | IAM-05, IAM-06, DATA-01 |
| Public auth and forms | Generic responses, strict validation, throttling, layered abuse control | IAM-02, IAM-03, DATA-02, INF-01, INF-03 |
| Database and storage | No unintended public reachability; row or API tenant controls are complete | DATA-01, IAM-05, SEC-04 |
| Payments and paid providers | Minimal data scope, authenticated events, idempotency, safe retries and caps | INF-02, INF-05, REG-01, OPS-02 |
| Messaging and workers | Authorized recipients, bounded queues, duplicate prevention, redacted logs | INF-01, INF-02, INF-05, DATA-04 |
| Client configuration | Public identifiers are separate from privileged credentials | SEC-01, SEC-02, SEC-04 |
| Sensitive records | Inventory, lawful handling, least privilege, retention, deletion and auditability | GOV-01, GOV-03, IAM-05, REG-01 |

## Safe discovery patterns

Run from the repository root. Prefer `rg --files` and narrow searches before opening files. Exclude environment files, credentials, build output, dependency directories, database data, and captured user data.

```sh
git rev-parse HEAD
git status --short
rg --files -g 'AGENTS.md' -g 'CLAUDE.md' -g 'README.md' -g '*HARNESS*' -g '!node_modules/**'
rg -n 'Auth|authenticate|authorize|session|cookie|token|verify|revoke' . -g '*.{ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs,md}' -g '!*.env*' -g '!node_modules/**'
rg -n 'tenant|organization|accountId|workspaceId|membership|role|permission' . -g '*.{ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs}' -g '!node_modules/**'
rg -n 'schema|validate|safeParse|DTO|Validation|bodyLimit|fileSize|multipart' . -g '*.{ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs}' -g '!node_modules/**'
rg -n 'rate.?limit|throttl|quota|budget|concurr|retry|backoff|idempoten|circuit' . -g '*.{ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs,md}' -g '!node_modules/**'
rg -n 'webhook|signature|eventId|event_id|replay|dedup' . -g '*.{ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs,md}' -g '!node_modules/**'
rg -n 'PUBLIC_|process\.env|import\.meta\.env|config' . -g '*.{ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs}' -g '!*.env*' -g '!node_modules/**'
rg -n 'privacy|retention|delete|export|backup|restore|incident|CORS|CSRF|CSP|HSTS' . -g '*.{md,ts,tsx,js,jsx,py,go,rs,java,kt,rb,php,cs,yml,yaml}' -g '!node_modules/**'
```

Do not broaden searches into `.env`, credentials, local databases, browser profiles, captures, generated artifacts, or dependency folders. When output might contain a value, print file paths or identifier names only.

## Evidence routes

### Identity and authorization

- Authentication middleware, token or session verification, cookie creation, logout, renewal, and revocation.
- Role and permission policies for privileged, billing, export, messaging, privacy, and administration operations.
- Tenant-owned controllers, use cases, repositories, queries, and storage keys.
- Negative tests for invalid, expired, revoked, replayed, cross-user, and cross-tenant cases.

### Input, output, and application boundaries

- Server schemas, request size limits, upload buffering, archive handling, parsers, and normalization.
- Database queries, templates, HTML and PDF rendering, redirect and fetch URLs, file paths, and command execution.
- Response schemas, serializers, SSR state, browser and mobile persistence, source maps, caches, exports, analytics, errors, and logs.
- Framework and edge headers, TLS configuration, cookie attributes, CORS, and CSRF.

### Async, cost, and providers

- Webhook authentication, raw-body handling, event claims, idempotency, monotonic state, retries, dead letters, and reconciliation.
- Paid provider calls, timeouts, concurrency, organization quotas, queues, retry ceilings, budgets, alerts, and kill switches.
- Provider console, cloud policy, rate limits, regions, budgets, backups, and alerts require exported evidence or explicit operator confirmation. Otherwise use `NOT_VERIFIED`.

### Supply chain and operations

- Manifests, lockfiles, install hooks, dependency update policy, vulnerability and license scans, SBOM, build provenance, CI permissions, and artifact signing.
- Secret scanning should emit locations and detector classes, not values.
- Incident, rotation, backup, restore, breach-assessment, customer-notification, and release-acceptance records.
- Existing test source proves intended behavior, not a current successful run. Record the exact command and result when execution is safe.

## Negative-test priority

Prioritize:

1. cross-tenant list, read, write, delete, relation and storage access;
2. invalid, revoked, expired, replayed and mixed authentication materials;
3. duplicate, forged, reordered, concurrent and retried async events;
4. public auth, recovery, invite, form and upload abuse;
5. duplicate paid operations, provider failure and quota exhaustion;
6. error, response and log redaction;
7. client-artifact exclusion of privileged configuration and surplus data;
8. backup restoration and cross-provider reconciliation.

If no test exists, record the missing test separately from the code finding. Code inspection can support `PARTIAL`; it should rarely justify runtime PASS by itself for Critical controls.
