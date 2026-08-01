# Product prelaunch security-gate control catalog

Read the entire catalog for FULL and RAPID audits. Every row is mandatory. Catalog severity is fixed for deterministic release verdicts and must not be changed in the report. Record context-specific impact or mitigating evidence in the finding without downgrading the catalog severity.

## Verdict rules

- `PASS`: positive implementation and verification evidence.
- `FAIL`: absent or demonstrably unsafe.
- `PARTIAL`: incomplete by path, environment, state, or test coverage.
- `NOT_APPLICABLE`: the capability is absent or an equivalent control is proven.
- `NOT_VERIFIED`: evidence could not be obtained safely or within scope.

Never convert missing evidence into PASS. Policy alone does not prove enforcement, and code alone does not prove cloud or production configuration.

## Controls

| ID | Control | Default severity | Minimum requirement | Evidence targets |
| --- | --- | --- | --- | --- |
| GOV-01 | Privacy notice and consent | HIGH | Notices match collected data, purposes, recipients, public forms, analytics, messaging, payments, rights, and contact paths. | Product and legal docs, public pages, schemas, analytics and integration code |
| GOV-02 | Data location and subprocessors | MEDIUM | Every data class has a known store, processor, region where relevant, transfer path, and privileged access model. | Architecture and operations docs, provider configuration names, integration modules |
| GOV-03 | Collection, retention, deletion, and handling | HIGH | Minimize collection and define access, retention, export, deletion, backup expiry, and log masking. | Database schema, deletion and export flows, jobs, logging policy and tests |
| GOV-04 | Code provenance and licenses | MEDIUM | Lock and review dependencies, identify restrictive licenses and copied or generated code obligations, and retain human ownership. | Manifests, lockfiles, license scans, notices, review policy |
| IAM-01 | Authentication boundary | CRITICAL | Every client and server path uses an explicit, revocation-aware authentication boundary; browser-readable credentials and unsafe fallbacks are absent. | Auth middleware and guards, session services, clients, cookie and token tests |
| IAM-02 | Account enumeration resistance | HIGH | Sign-in, reset, recovery, and duplicate registration do not unnecessarily disclose account existence through content, status, or timing. | Auth endpoints, provider error mapping, negative tests, UI messages |
| IAM-03 | Brute-force and attempt controls | HIGH | Login, reset, invite, MFA, and code-entry paths have provider or application throttling, delay, monitoring, or equivalent controls. | Edge controls, middleware, provider evidence, tests and monitoring rules |
| IAM-04 | Token and link lifecycle | HIGH | Expiry, revocation, replay, duplicate use, logout, renewal, and subject mismatch are handled safely. | Session, reset, invite and verification code and tests |
| IAM-05 | Authorization and tenant isolation | CRITICAL | Every tenant-owned list, read, write, and delete verifies membership, role, and resource ownership; ID substitution fails closed. | Controllers, policies, queries, tenant filters, cross-tenant tests |
| IAM-06 | Privileged operations | HIGH | Billing, refund, role, export, messaging, privacy, and sensitive settings enforce role, recent authentication where needed, approval, and auditability. | Permission matrices, guards, use cases, audit events and tests |
| DATA-01 | Database exposure boundary | CRITICAL | Direct-client databases enforce complete row policies; server-only databases are privately reachable and enforce equivalent API authorization and tenant scoping. | Infrastructure evidence, database clients, query filters, policies and tests |
| DATA-02 | Server-side input validation | HIGH | All write, search, upload, and webhook inputs enforce type, size, length, format, enum, nesting, and extra-field policy on the server. | Schemas, DTOs, pipes, upload limits, controllers and negative tests |
| DATA-03 | Injection and output encoding | HIGH | Address SQL and NoSQL injection, commands, templates, XSS, traversal, SSRF, and unsafe redirects where applicable. | Query construction, rendering and sanitization, URL handling, tests and scans |
| DATA-04 | Error and log disclosure | HIGH | Client errors omit stack, schema, query, and internal details; logs omit tokens, cookies, secrets, bodies, URLs with credentials, and unnecessary PII. | Exception filters, log wrappers, error mapping, redaction tests and runbooks |
| DATA-05 | Backup and recovery | HIGH | Backups, restore procedures and drills, migration recovery, RPO and RTO, and destructive-action auditability are defined. | Runbooks, configuration evidence, restore records and migrations |
| SEC-01 | Secret placement | CRITICAL | Privileged secrets remain server-only and never enter public prefixes, shared public config, client artifacts, responses, logs, analytics, or CORS headers. | Config modules, public environment references, build boundaries, bundle tests |
| SEC-02 | Public-key classification | MEDIUM | Public client identifiers are distinguished from privileged credentials by capability and boundary, avoiding leaks and false positives. | Configuration docs and code, provider roles, artifact allowlists and tests |
| SEC-03 | Exposure response and rotation | CRITICAL | Suspected exposure triggers redacted scoping, revocation or rotation, history and artifact review, and incident follow-up; deletion alone is insufficient. | Incident runbooks, rotation procedures, redacted scan output and audit trail |
| SEC-04 | Client and API data leakage | HIGH | Schemas, SSR state, bundles, maps, caches, analytics, logs, and exports expose only necessary fields and preserve tenant boundaries. | Response schemas, serializers, props, analytics calls, artifacts and tests |
| APP-01 | Web and transport security | MEDIUM | TLS, HSTS, CSP, framing, MIME, referrer policy, permissions policy, and cookie flags are appropriate and verified where applicable. | Framework config, middleware, cookie creation, headers and runtime evidence |
| APP-02 | OWASP cross-cutting review | HIGH | Review access control, cryptography, injection, design, configuration, dependencies, authentication, integrity, monitoring, and SSRF. | Findings mapped to precise code, tests, scans, and evidence gaps |
| INF-01 | Endpoint-specific rate limiting | HIGH | Public, auth, upload, search, messaging, and paid or costly paths have actor, IP, tenant, and endpoint-aware limits. | Throttler config, route policies, worker quotas, denial tests and metrics |
| INF-02 | Cost and resource caps | HIGH | Paid APIs and costly jobs have hard quotas, concurrency and queue bounds, timeouts, retry ceilings, budgets, and alerts. | Code and config names, queue policies, provider exports or operator evidence |
| INF-03 | Bot and abuse protection | MEDIUM | Public forms, booking, signup, waitlists, and recovery use risk-appropriate bot controls with an accessible fallback. | Public endpoints and UI, challenge integration, rate limits and tests |
| INF-04 | CORS and CSRF | HIGH | CORS uses exact origins, methods, and headers; credentialed wildcard is absent; cookie paths have origin, CSRF, and same-site defenses. | Bootstrap and edge config, cookie flags, CSRF controls, preflight tests |
| INF-05 | Webhook and async integrity | CRITICAL | Incoming events authenticate the sender, resist replay, are idempotent, handle duplication and reordering, bound retries, and support recovery. | Webhook handlers, event stores, workers, idempotency and failure tests |
| INF-06 | Dependency and supply chain | HIGH | Lockfiles, vulnerability review, install scripts, build provenance, CI permissions, and updates are controlled and verified. | Lockfiles, SCA output, CI workflows, package scripts, SBOM and provenance |
| OPS-01 | Automated security scanning | MEDIUM | Run available non-mutating SAST, SCA, secret, type, lint, IaC, container, and artifact checks; redact sensitive output. | Repository scripts and config, scanner output and CI jobs |
| OPS-02 | Manual triage and business logic | HIGH | Validate automated findings and separately review tenant crossing, privilege, duplicate charge or send, replay, race, and state-machine abuse. | Triage notes tied to code, tests, reachability and business scenarios |
| OPS-03 | Monitoring and incident response | HIGH | Monitor auth failures, limits, denials, webhooks, exports, backups, queues, and cost spikes; define containment, recovery, ownership, and notification. | Alert and runbook evidence, incident roles and redacted test records |
| REG-01 | Sensitive and regulated data | CRITICAL | Identify health, payment, identity, biometric, location, and minor data; minimize scope and obtain specialist review where required. | Data inventory, provider boundaries, schema fields, consent, retention and review records |
| REL-01 | Release blocker policy | HIGH | Auth bypass, tenant crossing, secret exposure, public database, unsafe async events, unlimited costly paths, and unclear sensitive-data handling block release unless formally accepted. | Final findings and owner, deadline, compensation and retest for every exception |

## Mandatory failure scenarios

Cover every scenario explicitly and map the result to one or more control rows:

1. Wrong password repeated beyond the intended limit.
2. Password reset or recovery for a nonexistent account.
3. Verification, reset, invite, and session materials replayed and used after expiry or revocation.
4. Registration attempted with an existing account.
5. Tenant and resource identifiers replaced with another tenant's identifiers.
6. Client validation bypassed with malformed, oversized, deeply nested, extra-field, and injection-shaped input.
7. Public and paid endpoints called beyond their intended quota.
8. Webhook authentication invalid, event duplicated, replayed, delayed, concurrent, or delivered out of order.
9. Forced errors checked for stack, query, schema, token, URL credential, and PII disclosure.
10. Client bundle, SSR payload, API response, cache, log, analytics, and export checked for secrets and surplus data.

## Scanner limitation

Automated and AI-based passes must cover baseline posture, OWASP, data exposure, and secret exposure. They cannot close tenant isolation, privileged operations, async integrity, business-logic triage, regulated-data scope, or provider-only evidence without targeted review.
