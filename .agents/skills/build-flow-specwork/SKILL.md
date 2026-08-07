---
name: build-flow-specwork
description: "Turn context into a specification or tracer-bullet ticket set. Use when the user asks to turn context into a specification or tracer-bullet ticket set. Natural requests include \"Please turn context into a specification or tracer-bullet ticket set.\" or \"この内容を仕様書かチケットにして\". Do not use before material product decisions are settled."
---

# build-flow-specwork

Choose one explicit mode: `spec` synthesizes settled context; `tickets` decomposes approved context. Do not interview in spec mode unless a required decision is genuinely absent.

## Spec Mode

1. Read the accepted plan, conversation, domain glossary, ADRs, and relevant repository seams.
2. State the problem, user-facing solution, numbered user stories, implementation decisions, testing decisions, out of scope, and unresolved notes.
3. Prefer existing public seams. Name new interfaces only when the decision is settled; avoid file paths and code that will go stale.
4. Preview the spec. Save locally or publish only after approval.

## Tickets Mode

1. Read the approved source spec or plan in full.
2. Split it into vertical tracer bullets. Each ticket must be independently demonstrable, fit one fresh implementation session, and include acceptance criteria.
3. Add blocking edges only for genuine prerequisites. Tickets with no blockers form the initial frontier.
4. For a wide mechanical refactor, use expand, migrate batches, and contract instead of pretending each layer is a vertical slice.
5. Present titles, delivered behavior, and blockers. Iterate until approved.
6. Detect tracker conventions from repository docs, remotes, issue templates, and existing examples. Do not require prior project setup.
   - local: preview, then write one file per ticket under `.build-stacks/issues/<feature>/`;
   - GitHub: run `gh auth status`, resolve the repository with `gh repo view --json nameWithOwner`, inspect issue templates and existing labels, then preview every issue;
   - unsupported tracker: produce a local handoff without claiming executable support.
7. For an explicitly approved GitHub publication, use `gh issue create --title <title> --body-file <file>` directly in dependency order. Record returned URLs under `.build-stacks/issues/<feature>/published.json` and check those URLs plus matching open titles before retrying so partial failures do not create duplicates.
8. Match the user's language and repository style. Do not include skill names, model attribution, or AI boilerplate in issue content. Add existing labels only when they fit; never create a fixed taxonomy implicitly.

Use [spec-template.md](assets/spec-template.md) and [ticket-template.md](assets/ticket-template.md).

## Output Contract

- selected mode and source
- domain terms and test seams
- spec or ticket paths/URLs
- blocking graph and frontier for tickets
- approval and publication status
- evidence
- residual risk
- next handoff
