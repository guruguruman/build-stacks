# Organization rules

## Package ownership

- `core`: safeguards, scope, privacy, shared state, evidence, and investigation.
- `workflow`: general human-agent setup, teaching, questionnaires, and reusable collaboration conventions.
- `browser`: browser policy and direct browser execution.
- `design`: interface, visual, and interaction design.
- `product`: discovery, strategy, personas, and product planning.
- `delivery`: QA, security, engineering review, release, and deployment.
- `maintainer`: stack planning, evaluation, organization, and upgrades.

Choose one owner for every skill. Express optional collaboration through the canonical catalog instead of creating hard APM dependencies for every relationship.

## Dependency rules

Keep the package graph acyclic. A package may depend only on a lower-level capability that must be installed for its workflows to function. Do not promote a `benefitsFrom` edge into an APM dependency unless the referenced skill is mandatory at runtime.

The root umbrella package should declare only `./packages/maintainer`. That package owns the complete 59-skill closure. Directly listing all seven packages duplicates local identities in APM 0.26 and makes `apm audit --ci` unable to resolve some `resolved_by` parents. Verify the maintainer closure count so future transitive changes cannot silently reduce a full installation.

## Safe changes

Run analysis before moving a skill. A move must update its catalog ownership, package manifest closure tests, generated target roots, documentation, and any relative resource paths. Do not alter workflow behavior merely to make the package graph aesthetically simpler.
