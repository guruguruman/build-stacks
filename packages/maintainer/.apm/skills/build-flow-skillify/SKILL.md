---
name: build-flow-skillify
description: "Turn repeated work into reviewed skill candidates. Use when the user asks to turn repeated work into reviewed skill candidates. Common requests include \"flow skillify\", \"skillify\", \"make a skill\", \"workflow skill\"."
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

## Agent-document writing discipline

Apply these rules to skills, APM instructions, and agent-facing references:

- Treat every description or instruction pointer as a routing interface: name the capability and each distinct trigger branch.
- Separate ordered steps from reference material. Keep branch-specific detail behind a direct pointer and avoid reference chains deeper than one level.
- End every step with a checkable completion condition. Prefer observable bounds over "be thorough" language.
- Keep each rule in one authoritative place. Remove stale caches of facts already discoverable from manifests, code, or command help.
- Use concise leading terms consistently when they recruit useful existing meaning; define coined terms once.
- Phrase the desired behavior positively. Keep prohibitions for genuine safety boundaries.
- Forward-test whether the document changes behavior versus the model default; delete instructions that are no-ops.

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
