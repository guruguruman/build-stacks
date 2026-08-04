# Infrastructure Candidate Catalog for build-flow-infradesign

## Status and Interpretation

This catalog captures a user's 2026 preference memo as decision priors. It is not
a source of current provider facts. A skill run must verify pricing, regions, limits,
runtime compatibility, product status, backup, and restore behavior against current
first-party documentation before final recommendation.

Separate two kinds of information:

- `Preference policy` — what to consider first, what operational tradeoffs the user accepts, and what to exclude by default.
- `Current fact` — provider capabilities, regions, prices, limits, maturity, and documented integrations. These require current official evidence.

If a preference and a hard constraint conflict, the hard constraint wins. If a user
explicitly overrides a preference, record the override as `[U]`.

## Global Preference Policy

1. Prefer the simplest topology that satisfies confirmed requirements.
2. Prefer preserving working code and operational knowledge.
3. Prefer static delivery before adding a server.
4. Prefer a small colocated API before a separate application server when constraints permit.
5. Prefer low operational burden unless the user explicitly accepts complexity for meaningful cost or control.
6. Treat durability and restore requirements as hard constraints, not optional cost optimizations.
7. Evaluate services as a coherent topology rather than independent menu items.
8. Keep a credible exit path for stateful components.

## Memo-Derived Shortlist

All entries below are `priority candidates`, not automatic recommendations.

### Static and Content Delivery

| Situation | Priority candidate | Must verify |
| --- | --- | --- |
| One simple page | Plain HTML on Cloudflare | Current hosting product, deploy path, custom-domain behavior |
| Simple static application | React + Vite on Cloudflare | Build/deploy compatibility, environment-variable model |
| More complex but statically exportable application | Next.js Static Export on Cloudflare | Actual static-export compatibility of routes, images, auth, server features |
| Content-heavy site | Astro on Cloudflare | Adapter/build mode, content pipeline, preview requirements |
| Small API surface | Workers endpoint or Hono | Runtime compatibility, limits, region behavior, local development |

### Server Runtime

| Situation | Priority candidate | Must verify |
| --- | --- | --- |
| Small-to-medium server-backed application | TanStack Start on Cloudflare Workers | Framework/runtime support status, limitations, adapters, Node compatibility |
| Medium-to-large and fastest route to launch | Next.js on Vercel | Runtime behavior, region availability, cost model, background/realtime needs |
| Medium scale and cost-sensitive with explicit complexity tolerance | OpenNext on Cloudflare Workers | Current support matrix, adapter maturity, unsupported features, migration/operations |

### Database and Coordination

| Situation | Priority candidate | Must verify |
| --- | --- | --- |
| Small-to-medium and Cloudflare-native | D1 and/or Durable Objects | Data model fit, transaction/consistency semantics, limits, backup/export/restore |
| Small-to-medium outside Cloudflare | Turso | Driver/runtime fit, replication, transaction semantics, regions, backup/restore |
| Lower-cost Postgres | Supabase for Japan-oriented needs; Neon otherwise | Current regions, latency, connection model, extensions, PITR/backup, pricing |
| Postgres or MySQL with more budget | PlanetScale | Current database products, regions, transaction/branching behavior, pricing |
| Realtime coordination | Durable Objects | Coordination model, persistence semantics, failure/recovery, connection limits |

The memo's statement about any provider lacking a Tokyo region is explicitly
time-sensitive and must not be repeated without current first-party verification.

### Object Storage and Durability

| Situation | Priority candidate | Must verify |
| --- | --- | --- |
| Cost-sensitive and replaceable data | R2 | Egress, consistency, lifecycle, versioning/backup capability |
| Data loss would be catastrophic | S3 or GCS with versioning | Versioning, retention/lock, replication, restore procedure, total cost |
| Cost-sensitive but data loss would be catastrophic | R2 plus scheduled backup to the cheapest suitable S3/GCS storage class | Backup direction, schedule, encryption, retention, restore test, egress/API cost |

A second bucket is not automatically a backup. Verify independent failure domains,
credential separation, deletion protection, retention, and a tested restore path.

### Email

| Situation | Priority candidate | Must verify |
| --- | --- | --- |
| High volume and cost-sensitive | AWS SES | Account/sandbox setup, deliverability operations, region, pricing |
| Cloudflare runtime | Cloudflare email service candidate | Current product name/status, outbound capabilities, limits, availability |
| Low volume and low setup burden | Resend | Pricing, domain setup, limits, deliverability requirements |

SendGrid is excluded by default in this preference profile. Treat this as a user
preference, not a claim about its current plan or product quality. Allow explicit override.

### Cross-Cutting Services

| Need | Priority candidate | Must verify |
| --- | --- | --- |
| Payments | Stripe | Country/business support, required payment methods, webhook and data requirements |
| Authentication | BetterAuth first; managed service if requirements do not fit | Runtime/database compatibility, providers, enterprise/MFA/audit requirements |
| Limited-audience publication | Cloudflare Zero Trust | Access model, user count, identity-provider fit, policy and pricing |
| Broad business requirements | Google Cloud service composition: Cloud Run, SQL, Memorystore, Tasks, Scheduler, Storage | Required services only, regions, networking, IAM, cost, operational ownership |

## Candidate Record Required During a Run

For each shortlisted service, create a record:

```yaml
service:
role:
preference_source: memo | current-baseline | user-confirmed | exception
hard_constraints_passed: []
hard_constraints_failed: []
repository_compatibility:
required_changes:
current_facts:
  - claim:
    official_url:
    retrieved_at:
unknowns: []
operational_risk:
exit_path:
```

Do not promote a memo statement into `current_facts`.
