---
name: build-flow-skillify
description: "Use when the user wants to turn repeated work into reviewed skill candidates Common requests include \"flow skillify\", \"skillify\", \"make a skill\", \"workflow skill\"."
---

# build-flow-skillify

Use this maintainer workflow when repeated browser or product workflow work should become a reviewed `build-*` skill candidate.

## Workflow

1. Confirm the repeated workflow, trigger phrase, inputs, approval class, and evidence path.
2. Create a candidate directory under `.build-stacks/skill-candidates/<name>/`.
3. Draft `SKILL.md` with frontmatter, when-to-use guidance, workflow, output contract, smoke scenario, expected output, evidence path, and failure mode.
4. Review the candidate for overlap with existing shipped skills in `docs/release-acceptance-skill-matrix.md`.
5. If accepted, use `build-flow-organize-stack` to select the owning package, move the candidate into `packages/<package>/.apm/skills/<build-name>/`, add it to the skill catalog if it is shipped, and run:

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

Browser evidence must go through official `agent-browser` and the `build-browser-runner` policy. Keep candidate artifacts under `.build-stacks/skill-candidates/` until the user explicitly approves promotion into `packages/<package>/.apm/skills/`.
