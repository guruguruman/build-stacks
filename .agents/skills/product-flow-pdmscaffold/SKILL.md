---
name: product-flow-pdmscaffold
preamble-tier: 3
version: 1.0.0
description: |
  Scaffold a neutral canonical `docs/pdm` set with strategy, product plan,
  current-product audit, gap analysis, persona guidance, and research-note templates.
  This focused product-stacks flow creates document structure and writing-depth guidance
  without inventing product, market, business-model, UX, feature, or technical decisions.
  Produces created or unchanged paths, collision status, evidence, residual risk, and the
  next handoff for discovery, UX design, plan tuning, or documentation review.
  Use when asked for a "PdM documentation scaffold", "PRODUCT_PLAN template",
  "docs/pdm scaffold", "PdMドキュメントの雛形", or an equivalent neutral boilerplate.
  Proactively suggest only when a repository needs a repeatable PdM canonical set; do not
  route ordinary discovery, product briefs, UX requirements, plan tuning, or docs reviews here.
  Voice triggers: "PdMドキュメントの雛形", "PRODUCT_PLAN template", "docs/pdm scaffold".
benefits-from: [product-recipe-discovery, product-flow-goaldirectedux, product-role-docengineer]
triggers:
  - product-flow-pdmscaffold
  - flow pdmscaffold
  - PdMドキュメントの雛形
  - PdM documentation scaffold
  - PRODUCT_PLAN template
  - docs/pdm scaffold
---

# product-flow-pdmscaffold

## Product-Stacks Operating Preamble

- Public interface names are product-* only.
- Source guidance lives in `.apm`; generated host output is not source; runtime artifacts live in `.product-build-stacks`.
- Read the target repository's applicable instructions and inspect its worktree before writing.
- Preserve existing product documents and unrelated user changes.
- If a decision would populate product content rather than scaffold structure, leave it undecided and hand off to the appropriate workflow.
- Never persist secrets, cookies, credentials, production data, or unredacted personal information in templates or evidence.

## Purpose

Create a reusable PdM documentation skeleton whose headings and short comments explain
what belongs in each section and how deeply to write it. Keep the scaffold neutral so a
repository does not inherit another product's assumptions.

The bundled scaffold contains:

```text
docs/pdm/
├── README.md
├── STRATEGY.md
├── PRODUCT_PLAN.md
├── CURRENT_PRODUCT.md
├── PRODUCT_GAP_ANALYSIS.md
├── personas/
│   └── README.md
└── references/
    ├── README.md
    ├── research-brief-template.md
    ├── interview-notes-template.md
    ├── competitive-review-template.md
    ├── financial-model-template.md
    ├── hypothesis-ledger-template.md
    └── source-register-template.md
```

## Routing Boundary

Use this skill only to create or align the neutral document structure.

- Use `product-recipe-discovery` when the product idea, target user, problem, or value proposition must be discovered.
- Use `product-flow-goaldirectedux` when personas, scenarios, UX requirements, or experience design must be developed.
- Use `product-flow-plantune` when an existing implementation plan needs scope, ordering, or acceptance-criteria review.
- Use `product-role-docengineer` when shipped behavior, release notes, operator docs, or documentation accuracy must be reviewed.
- Use `product-flow-skillify` when the requested output is a reusable skill rather than PdM documents.

Do not activate on the broad phrases `product plan`, `personas`, `requirements`,
`product brief`, `discovery`, `docs review`, or `plan review` by themselves.

## Safety and Collision Policy

- Treat `assets/pdm-docs/` as the source-of-truth scaffold.
- Never overwrite an existing destination file.
- Run an all-or-nothing collision preflight before creating anything.
- If any destination file exists, stop automated installation and list every collision.
- After a collision, inspect existing documents and use narrow patches only when the user asked to merge or align them.
- Do not add or modify root `AGENTS.md`, repository policy, application code, or engineering design documents.
- Do not silently replace project-specific naming, status, decisions, or evidence.

## Workflow

### 1. Inspect the target

1. Resolve the project root.
2. Read applicable `AGENTS.md`, `README`, and documentation conventions.
3. Inspect `docs/pdm`, nearby product documents, and worktree status.
4. State whether the operation is a clean scaffold, partial alignment, or blocked by collisions.

### 2. Preview creation

Resolve `<skill-path>` from the active installed skill and run:

```bash
python3 <skill-path>/scripts/create_pdm_docs.py --target <project-root> --dry-run
```

Confirm that every output remains under `<project-root>/docs/pdm/`.

### 3. Create the scaffold

When the dry run has no collision:

```bash
python3 <skill-path>/scripts/create_pdm_docs.py --target <project-root>
```

Do not add product-specific content unless the user explicitly asks for a separate
population pass and provides sufficient context.

### 4. Verify

Check:

- all 13 bundled files exist;
- the five canonical root documents use uppercase English names without dates;
- reference templates use lowercase kebab-case;
- relative Markdown links resolve;
- no unrelated product name or inherited business assumption appears;
- pre-existing files were not modified.

### 5. Record evidence

Write a redacted summary to:

```text
.product-build-stacks/evidence/product-flow-pdmscaffold.json
```

Include:

- target repository and output root;
- mode: `created`, `aligned`, or `collision-blocked`;
- created and unchanged paths;
- verification performed;
- collisions or unresolved decisions;
- residual risk and next handoff.

## Content Rules

- Use headings and short HTML comments for section purpose and expected depth.
- Separate facts, decisions, hypotheses, and undecided items.
- Do not preselect users, monetization, phases, metrics, roles, integrations, platforms, architecture, or feature categories.
- Allow optional sections to be marked `該当なし` with a reason.
- Keep research details under `references/` and persona detail under `personas/`.
- Keep ADRs, API contracts, migrations, test plans, and release evidence outside the PdM canonical set.

## Output Contract

Return:

- mode and target path;
- created and intentionally unchanged files;
- collision status;
- verification results;
- evidence path;
- residual risk;
- recommended next handoff.
