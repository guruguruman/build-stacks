# build-role-engmanager extended workflow

## Contents

- Review Sections (after scope is agreed)
- Learnings Search
- Confidence Calibration
- Coverage Audit
- Codex Plan Review
- CRITICAL RULE — How to ask questions
- Required outputs
- Retrospective learning
- Formatting rules
- Review Log
- Review Dashboard
- PRODUCT REVIEW REPORT
- Learnings Log
- Product Knowledge Save
- Next Steps — Review Chaining
- Unresolved decisions

## Review Sections (after scope is agreed)

**Anti-skip rule:** Never condense, abbreviate, or skip any review section (1-4) regardless of plan type (strategy, spec, code, infra). Every section in this skill exists for a reason. "This is a strategy doc so implementation sections don't apply" is always wrong — implementation details are where strategy breaks down. If a section genuinely has zero findings, say "No issues found" and move on — but you must evaluate it.

## Learnings Search

If .build-stacks/learnings exists, inspect relevant recent notes before repeating an investigation. If absent, continue without treating it as a failure.

### 1. Architecture review
Evaluate:
* Overall system design and component boundaries.
* Dependency graph and coupling concerns.
* Data flow patterns and potential bottlenecks.
* Scaling characteristics and single points of failure.
* Security architecture (auth, data access, API boundaries).
* Whether key flows deserve ASCII diagrams in the plan or in code comments.
* For each new codepath or integration point, describe one realistic production failure scenario and whether the plan accounts for it.
* **Distribution architecture:** If this introduces a new artifact (binary, package, container), how does it get built, published, and updated? Is the CI/CD pipeline part of the plan or deferred?

For each issue found in this section, use an available user-input mechanism individually. One issue per call. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one available user-input mechanism. Use the preamble's available user-input mechanism Format section. Send the question through the available user-input mechanism and wait for the answer before continuing. If no user-input mechanism is callable in this session, follow the preamble's "Tool resolution" fallback: in plan mode, write `## Decisions to confirm` into the plan file and finish the planning phase; outside plan mode, output the decision brief as prose and stop. Never silently auto-decide.

**STOP.** Do NOT proceed to the next review section, edit the plan file with the proposed fix, or call finish the planning phase until the user responds. An issue with an "obvious fix" is still an issue and still needs explicit user approval before it lands in the plan. Loading an available user-input mechanism schema via capability discovery mechanism and then writing the recommendation as chat prose is the failure mode this gate exists to prevent.

## Confidence Calibration

Separate observed facts from inference. Lower confidence when evidence is missing, stale, or only from generated prose.

### 2. Code quality review
Evaluate:
* Code organization and module structure.
* DRY violations—be aggressive here.
* Error handling patterns and missing edge cases (call these out explicitly).
* Technical debt hotspots.
* Areas that are over-engineered or under-engineered relative to my preferences.
* Existing ASCII diagrams in touched files — are they still accurate after this change?

For each issue found in this section, use an available user-input mechanism individually. One issue per call. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one available user-input mechanism. Use the preamble's available user-input mechanism Format section. Send the question through the available user-input mechanism and wait for the answer before continuing. If no user-input mechanism is callable in this session, follow the preamble's "Tool resolution" fallback: in plan mode, write `## Decisions to confirm` into the plan file and finish the planning phase; outside plan mode, output the decision brief as prose and stop. Never silently auto-decide.

**STOP.** Do NOT proceed to the next review section, edit the plan file with the proposed fix, or call finish the planning phase until the user responds. An issue with an "obvious fix" is still an issue and still needs explicit user approval before it lands in the plan. Loading an available user-input mechanism schema via capability discovery mechanism and then writing the recommendation as chat prose is the failure mode this gate exists to prevent.

### 3. Test review

## Coverage Audit

Map changed codepaths to tests. Flag happy path, failure path, edge case, and regression coverage gaps with file-level evidence.

For LLM/prompt changes: check the "Prompt/LLM changes" file patterns listed in README.md or project docs. If this plan touches ANY of those patterns, state which eval suites must be run, which cases should be added, and what baselines to compare against. Then use an available user-input mechanism to confirm the eval scope with the user.

For each issue found in this section, use an available user-input mechanism individually. One issue per call. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one available user-input mechanism. Use the preamble's available user-input mechanism Format section. Send the question through the available user-input mechanism and wait for the answer before continuing. If no user-input mechanism is callable in this session, follow the preamble's "Tool resolution" fallback: in plan mode, write `## Decisions to confirm` into the plan file and finish the planning phase; outside plan mode, output the decision brief as prose and stop. Never silently auto-decide.

**STOP.** Do NOT proceed to the next review section, edit the plan file with the proposed fix, or call finish the planning phase until the user responds. An issue with an "obvious fix" is still an issue and still needs explicit user approval before it lands in the plan. Loading an available user-input mechanism schema via capability discovery mechanism and then writing the recommendation as chat prose is the failure mode this gate exists to prevent.

### 4. Performance review
Evaluate:
* N+1 queries and database access patterns.
* Memory-usage concerns.
* Caching opportunities.
* Slow or high-complexity code paths.

For each issue found in this section, use an available user-input mechanism individually. One issue per call. Present options, state your recommendation, explain WHY. Do NOT batch multiple issues into one available user-input mechanism. Use the preamble's available user-input mechanism Format section. Send the question through the available user-input mechanism and wait for the answer before continuing. If no user-input mechanism is callable in this session, follow the preamble's "Tool resolution" fallback: in plan mode, write `## Decisions to confirm` into the plan file and finish the planning phase; outside plan mode, output the decision brief as prose and stop. Never silently auto-decide.

**STOP.** Do NOT proceed to the next review section, edit the plan file with the proposed fix, or call finish the planning phase until the user responds. An issue with an "obvious fix" is still an issue and still needs explicit user approval before it lands in the plan. Loading an available user-input mechanism schema via capability discovery mechanism and then writing the recommendation as chat prose is the failure mode this gate exists to prevent.

## Codex Plan Review

Use Codex as an optional reviewer for plans when available. Do not make the workflow depend on global Codex state.

### Outside Voice Integration Rule

Outside voice findings are INFORMATIONAL until the user explicitly approves each one.
Do NOT incorporate outside voice recommendations into the plan without presenting each
finding through an available user-input mechanism and getting explicit approval. This applies even when you
agree with the outside voice. Cross-model consensus is a strong signal — present it as
such — but the user makes the decision.

## CRITICAL RULE — How to ask questions
Follow an available user-input mechanism format from the Preamble above. Additional rules for plan reviews:
* **One issue = one user-input request.** Never combine multiple issues into one question.
* Describe the problem concretely, with file and line references.
* Present 2-3 options, including "do nothing" where that's reasonable.
* For each option, specify in one line: effort (human: ~X / CC: ~Y), risk, and maintenance burden. If the complete option is only marginally more effort than the shortcut with CC, recommend the complete option.
* **Map the reasoning to my engineering preferences above.** One sentence connecting your recommendation to a specific preference (DRY, explicit > clever, minimal diff, etc.).
* Label with issue NUMBER + option LETTER (e.g., "3A", "3B").
* **Coverage vs kind:** for every per-issue available user-input mechanism you raise in this review, decide whether the options differ in coverage or in kind. If coverage (e.g., more tests vs fewer, complete error handling vs happy-path-only, full edge-case coverage vs shortcut), include `Completeness: N/10` on each option. If kind (e.g., architectural choice between two different systems, posture-over-posture, A/B/C where each is a different kind of thing), skip the score and add one line: `Note: options differ in kind, not coverage — no completeness score.` Do NOT fabricate scores on kind-differentiated questions — filler scores are worse than no score.
* **Escape hatch (tightened):** If a section has zero findings, state "No issues, moving on" and proceed. If it has findings, use an available user-input mechanism for each — a finding with an "obvious fix" is still a finding and still needs user approval before any change lands in the plan. Only skip available user-input mechanism when the decision is genuinely trivial (e.g., a typo fix) AND there are no meaningful alternatives. When in doubt, ask.

## Required outputs

### "NOT in scope" section
Every plan review MUST produce a "NOT in scope" section listing work that was considered and explicitly deferred, with a one-line rationale for each item.

### "What already exists" section
List existing code/flows that already partially solve sub-problems in this plan, and whether the plan reuses them or unnecessarily rebuilds them.

### TODOS.md updates
After all review sections are complete, present each potential TODO as its own individual available user-input mechanism. Never batch TODOs — one per question. Never silently skip this step. Follow the bundled TODOS format at `../../build-role-staffengineer/references/TODOS-format.md`.

For each TODO, describe:
* **What:** One-line description of the work.
* **Why:** The concrete problem it solves or value it unlocks.
* **Pros:** What you gain by doing this work.
* **Cons:** Cost, complexity, or risks of doing it.
* **Context:** Enough detail that someone picking this up in 3 months understands the motivation, the current state, and where to start.
* **Depends on / blocked by:** Any prerequisites or ordering constraints.

Then present options: **A)** Add to TODOS.md **B)** Skip — not valuable enough **C)** Build it now in this PR instead of deferring.

Do NOT just append vague bullet points. A TODO without context is worse than no TODO — it creates false confidence that the idea was captured while actually losing the reasoning.

### Diagrams
The plan itself should use ASCII diagrams for any non-trivial data flow, state machine, or processing pipeline. Additionally, identify which files in the implementation should get inline ASCII diagram comments — particularly Models with complex state transitions, Services with multi-step pipelines, and Concerns with non-obvious mixin behavior.

### Failure modes
For each new codepath identified in the test review diagram, list one realistic way it could fail in production (timeout, nil reference, race condition, stale data, etc.) and whether:
1. A test covers that failure
2. Error handling exists for it
3. The user would see a clear error or a silent failure

If any failure mode has no test AND no error handling AND would be silent, flag it as a **critical gap**.

### Worktree parallelization strategy

Analyze the plan's implementation steps for parallel execution opportunities. This helps the user split work across git worktrees (via host environment.s isolated-reviewer capability with `isolation: "worktree"` or parallel workspaces).

**Skip if:** all steps touch the same primary module, or the plan has fewer than 2 independent workstreams. In that case, write: "Sequential implementation, no parallelization opportunity."

**Otherwise, produce:**

1. **Dependency table** — for each implementation step/workstream:

| Step | Modules touched | Depends on |
|------|----------------|------------|
| (step name) | (directories/modules, NOT specific files) | (other steps, or —) |

Work at the module/directory level, not file level. Plans describe intent ("add API endpoints"), not specific files. Module-level ("controllers/, models/") is reliable; file-level is guesswork.

2. **Parallel lanes** — group steps into lanes:
   - Steps with no shared modules and no dependency go in separate lanes (parallel)
   - Steps sharing a module directory go in the same lane (sequential)
   - Steps depending on other steps go in later lanes

Format: `Lane A: step1 → step2 (sequential, shared models/)` / `Lane B: step3 (independent)`

3. **Execution order** — which lanes launch in parallel, which wait. Example: "Launch A + B in parallel worktrees. Merge both. Then C."

4. **Conflict flags** — if two parallel lanes touch the same module directory, flag it: "Lanes X and Y both touch module/ — potential merge conflict. Consider sequential execution or careful coordination."

### Completion summary
At the end of the review, fill in and display this summary so the user can see all findings at a glance:
- Step 0: Scope Challenge — ___ (scope accepted as-is / scope reduced per recommendation)
- Architecture Review: ___ issues found
- Code Quality Review: ___ issues found
- Test Review: diagram produced, ___ gaps identified
- Performance Review: ___ issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: ___ items proposed to user
- Failure modes: ___ critical gaps flagged
- Outside voice: ran (codex/claude) / skipped
- Parallelization: ___ lanes, ___ parallel / ___ sequential
- Lake Score: X/Y recommendations chose complete option

## Retrospective learning
Check the git log for this branch. If there are prior commits suggesting a previous review cycle (e.g., review-driven refactors, reverted changes), note what was changed and whether the current plan touches the same areas. Be more aggressive reviewing areas that were previously problematic.

## Formatting rules
* NUMBER issues (1, 2, 3...) and LETTERS for options (A, B, C...).
* Label with NUMBER + LETTER (e.g., "3A", "3B").
* One sentence max per option. Pick in under 5 seconds.
* After each review section, pause and ask for feedback before moving on.

## Review Log

After producing the Completion Summary above, persist the review result.

**PLAN MODE EXCEPTION — ALWAYS RUN:** This command writes review metadata to
`.build-stacks/` (user config directory, not project files). The skill preamble
already writes to `.build-stacks/sessions/` and `.build-stacks/analytics/` — this is
the same pattern. The review dashboard depends on this data. Skipping this
command breaks the review readiness dashboard in build-recipe-ship.

```bash
mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"build-role-engmanager","timestamp":"TIMESTAMP","status":"STATUS","unresolved":N,"critical_gaps":N,"issues_found":N,"mode":"MODE","commit":"COMMIT"}' >> .build-stacks/analytics/reviews.jsonl
```

Substitute values from the Completion Summary:
- **TIMESTAMP**: current ISO 8601 datetime
- **STATUS**: "clean" if 0 unresolved decisions AND 0 critical gaps; otherwise "issues_open"
- **unresolved**: number from "Unresolved decisions" count
- **critical_gaps**: number from "Failure modes: ___ critical gaps flagged"
- **issues_found**: total issues found across all review sections (Architecture + Code Quality + Performance + Test gaps)
- **MODE**: FULL_REVIEW / SCOPE_REDUCED
- **COMMIT**: output of `git rev-parse --short HEAD`

## Review Dashboard

Collect review evidence under .build-stacks/build-role-staffengineer-reviews/ when durable review state is needed. Summaries must include findings, decisions, evidence, residual risk, and next handoff.

## PRODUCT REVIEW REPORT

When a plan file is written, append this as the final top-level report section:

- Findings
- Decisions
- Evidence
- Residual risk
- Next handoff

## Learnings Log

When a reusable lesson emerges, write it as a candidate under .build-stacks/learnings/ only if the current task calls for durable runtime artifacts.

## Product Knowledge Save

Save durable workflow outputs under .build-stacks with explicit file paths in the final handoff. Do not write to .build-stacks.

## Next Steps — Review Chaining

After displaying the Review Readiness Dashboard, check if additional reviews would be valuable. Read the dashboard output to see which reviews have already been run and whether they are stale.

**Suggest build-role-designer if UI changes exist and no design review has been run** — detect from the test diagram, architecture review, or any section that touched frontend components, CSS, views, or user-facing interaction flows. If an existing design review's commit hash shows it predates significant changes found in this eng review, note that it may be stale.

**Mention build-role-founder if this is a significant product change and no CEO review exists** — this is a soft suggestion, not a push. CEO review is optional. Only mention it if the plan introduces new user-facing features, changes product direction, or expands scope substantially.

**Note staleness** of existing CEO or design reviews if this eng review found assumptions that contradict them, or if the commit hash shows significant drift.

**If no additional reviews are needed** (or `skip_eng_review` is `true` in the dashboard config, meaning this eng review was optional): state "All relevant reviews complete. Run build-recipe-ship when ready."

Use an available user-input mechanism with only the applicable options:
- **A)** Run build-role-designer (only if UI scope detected and no design review exists)
- **B)** Run build-role-founder (only if significant product change and no CEO review exists)
- **C)** Ready to implement — run build-recipe-ship when done

## Unresolved decisions
If the user does not respond to an available user-input mechanism or interrupts to move on, note which decisions were left unresolved. At the end of the review, list these as "Unresolved decisions that may bite you later" — never silently default to an option.
