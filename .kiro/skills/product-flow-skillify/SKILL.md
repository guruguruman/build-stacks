---
name: product-flow-skillify
preamble-tier: 3
version: 1.0.0
description: |
  Turn repeated work into reviewed skill candidates. This focused product-stacks flow
  keeps product-* public interfaces, .apm source guidance, and .product-build-stacks
  runtime evidence boundaries aligned.
  Produces focused findings, decisions, evidence, residual risk, and the next handoff for
  the flow.
  Use when asked to "flow skillify", "skillify", "make a skill", or when the requested
  work matches product-flow-skillify.
  Proactively suggest when this workflow would reduce ambiguity, preserve evidence
  discipline, or create a cleaner handoff.
  Voice triggers: "skillify", "make a skill", "workflow skill".
benefits-from: [product-role-dxlead, product-role-staffengineer]
triggers:
  - product-flow-skillify
  - flow skillify
  - skillify
  - make a skill
  - workflow skill
---

# product-flow-skillify

Use this maintainer workflow when repeated browser or product workflow work should become a reviewed `product-*` skill candidate.

## Workflow

1. Confirm the repeated workflow, trigger phrase, inputs, approval class, and evidence path.
2. Create a candidate directory under `.product-build-stacks/skill-candidates/<name>/`.
3. Draft `SKILL.md` with frontmatter, when-to-use guidance, workflow, output contract, smoke scenario, expected output, evidence path, and failure mode.
4. Review the candidate for overlap with existing shipped skills in `docs/release-acceptance-skill-matrix.md`.
5. If accepted, move the candidate into `.apm/skills/<product-name>/`, add it to the skill catalog if it is shipped, and run:

```bash
npm run skill:verify
npm run build
npm run generated:verify
```

6. Stop before committing unless the user asks for commit/publish work.

## Output Contract

- proposed skill name
- trigger and scope
- candidate path
- overlap review
- smoke scenario
- expected output
- evidence path
- browser_activation if browser evidence was used or requested
- next handoff

Browser evidence must go through official `agent-browser` and the `product-browser-runner` policy. Keep candidate artifacts under `.product-build-stacks/skill-candidates/` until the user explicitly approves promotion into `.apm/skills/`.
