---
name: build-flow-pdmscaffold
description: "Use when the user wants to create a neutral, collision-safe canonical PdM documentation scaffold Common requests include \"flow pdmscaffold\", \"PdM documentation scaffold\", \"PRODUCT_PLAN template\", \"docs/pdm scaffold\"."
---

# build-flow-pdmscaffold

## Build-Stacks Operating Preamble

- Public interface names are build-* only.
- Source guidance lives in `.apm`; generated host output is not source; runtime artifacts live in `.build-stacks`.
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

- Use `build-recipe-discovery` when the product idea, target user, problem, or value proposition must be discovered.
- Use `build-flow-goaldirectedux` when personas, scenarios, UX requirements, or experience design must be developed.
- Use `build-flow-plantune` when an existing implementation plan needs scope, ordering, or acceptance-criteria review.
- Use `build-role-docengineer` when shipped behavior, release notes, operator docs, or documentation accuracy must be reviewed.
- Use `build-flow-skillify` when the requested output is a reusable skill rather than PdM documents.

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
.build-stacks/evidence/build-flow-pdmscaffold.json
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
