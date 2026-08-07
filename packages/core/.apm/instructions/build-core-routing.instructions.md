---
description: Route requests to the correct build-stacks skill.
applyTo: "**/*"
---

# build-core-routing

Route requests to the published `build-*` skill names only.
Treat cross-package skill references as optional handoffs. Route only when the target skill is installed and discoverable; otherwise complete the safe subset in the active skill or name the additional package required without claiming the handoff ran.

Select at most one flow or recipe as the primary coordinator. Roles may overlap only when the user explicitly names them or the selected coordinator declares them as an orchestration. An explicitly named role owns the response: do not replace it with a flow or recipe merely because the review subject also matches that coordinator. The role may recommend a coordinator as the next handoff. Guards, browser, runtime, and source skills support the coordinator and do not become additional coordinators. `benefitsFrom` means optional compatibility, not automatic invocation or a sequential chain.

When the user asks which workflow fits, route by intent instead of exposing the catalog as a flat menu:

- unclear idea or decision frontier: `build-recipe-discovery`
- questionnaire for an external expert: `build-recipe-discovery` questionnaire mode
- domain terms or ADRs: `build-flow-domainmodeling`
- cited reading: `build-recipe-research`
- spec or tracer-bullet tickets: `build-flow-specwork`
- implementation or test-first work: `build-recipe-implement`
- difficult bug: `build-recipe-investigate`
- architecture design or survey: `build-flow-codebasearchitecture`
- read-only code or diff review: `build-role-staffengineer`
- issue intake: `build-flow-triage`
- multi-session decision uncertainty: `build-recipe-discovery`, with `build-runtime-session` only as saved-state support
- human-only setup steps: `build-flow-humanwizard`

Distinguish common collisions:

- revise an implementation plan with one coordinator: `build-flow-plantune`; when the request says "as an engineering manager", "engineering manager review", "エンジニアリングマネージャーとして", or an equivalent explicit role phrase, use `build-role-engmanager` instead;
- investigate a root cause: `build-recipe-investigate`; produce an issue intake outcome: `build-flow-triage`;
- review a diff without edits: `build-role-staffengineer`; implement approved changes: `build-recipe-implement`;
- prepare a PR: `build-recipe-ship`; merge and deploy: `build-recipe-landdeploy`;
- report-only QA: `build-flow-qareport`; test, fix, and re-verify: `build-recipe-qa`.
- execute browser checks or capture fresh browser evidence: `build-browser-qa`; summarize supplied or existing findings without running checks: `build-flow-qareport`. Missing runtime or a runnable surface blocks `build-browser-qa`; it does not change the selected intent.
- design deployment topology or choose infrastructure: `build-flow-infradesign`; integrate an already approved deployment environment and its readiness evidence: `build-source-deploy`.

Ask one routing question only when two routes would produce materially different work and repository evidence cannot decide.
