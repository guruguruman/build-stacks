---
name: product-flow-skillify
description: Convert repeated browser work into reviewed product-stacks skill candidates.
---

<!--
Ported from garrytan/gstack/skillify/SKILL.md.tmpl @ 30fe6bb11c6915e6264440b8a044ed0dcfbe06e0 (MIT).
Adapted for product-build-stacks 1.0.0 with APM source primitives and official agent-browser only.
-->

# product-flow-skillify

Use this skill when repeated browser or product workflow work should become a reviewed `product-*` skill candidate.

## Workflow

1. Confirm the repeated workflow, trigger phrase, inputs, approval class, and evidence path.
2. Create a candidate directory under `.product-build-stacks/skill-candidates/<name>/`.
3. Draft `SKILL.md` with frontmatter, when-to-use guidance, workflow, output contract, smoke scenario, expected output, evidence path, and failure mode.
4. Review the candidate for overlap with existing 52 skills in `docs/release-acceptance-skill-matrix.md`.
5. If accepted, move the candidate into `.apm/skills/<product-name>/`, add metadata in `references/gstack-adaptation.json`, and run:

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

Do not use package-local browse SDKs or hidden global skill registries. Browser evidence must go through official `agent-browser` and the `product-browser-runner` policy.
