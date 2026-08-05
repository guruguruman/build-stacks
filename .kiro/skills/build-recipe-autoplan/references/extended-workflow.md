# build-recipe-autoplan extended workflow

## Contents

- Phase 0.5: Codex auth + version preflight
- Phase 1: CEO Review (Strategy & Scope)
- Phase 2: Design Review (conditional — skip if no UI scope)
- Phase 3: Eng Review + Dual Voices
- Phase 3.5: DX Review (conditional — skip if no developer-facing scope)
- Decision Audit Trail
- Decision Audit Trail
- Pre-Gate Verification
- Phase 4: Final Approval Gate
- /autoplan Review Complete
- Completion: Write Review Logs
- Important Rules

## Phase 0.5: Codex auth + version preflight

Before invoking any Codex voice, preflight the CLI: verify auth (multi-signal) and
warn on known-bad CLI versions. This is infrastructure for all 4 phases below —
source it once here and the helper functions stay in scope for the rest of the
workflow.

```bash
_TEL="${BUILD_STACKS_TELEMETRY:-off}"
command -v codex >/dev/null 2>&1

# Check Codex binary. If missing, tag the degradation matrix and continue
# with Claude subagent only (autoplan's existing degradation fallback).
if ! command -v codex >/dev/null 2>&1; then
  _product_codex_log_event "codex_cli_missing"
  echo "[codex-unavailable: binary not found] — proceeding with Claude subagent only"
  _CODEX_AVAILABLE=false
elif ! _product_codex_auth_probe >/dev/null; then
  _product_codex_log_event "codex_auth_failed"
  echo "[codex-unavailable: auth missing] — proceeding with Claude subagent only. Run \`codex login\` or set \$CODEX_API_KEY to enable dual-voice review."
  _CODEX_AVAILABLE=false
else
  _product_codex_version_check   # non-blocking warn if known-bad
  _CODEX_AVAILABLE=true
fi
```

If `_CODEX_AVAILABLE=false`, all Phase 1-3.5 Codex voices below degrade to
`[codex-unavailable]` in the degradation matrix. /autoplan completes with
Claude subagent only — saves token spend on Codex prompts we can't use.

---

## Phase 1: CEO Review (Strategy & Scope)

Follow build-role-founder/SKILL.md — all sections, full depth.
Override: every AskUserQuestion → auto-decide using the 6 principles.

**Override rules:**
- Mode selection: SELECTIVE EXPANSION
- Premises: accept reasonable ones (P6), challenge only clearly wrong ones
- **GATE: Present premises to user for confirmation** — this is the ONE AskUserQuestion
  that is NOT auto-decided. Premises require human judgment.
- Alternatives: pick highest completeness (P1). If tied, pick simplest (P5).
  If top 2 are close → mark TASTE DECISION.
- Scope expansion: in blast radius + <1d CC → approve (P2). Outside → defer to TODOS.md (P3).
  Duplicates → reject (P4). Borderline (3-5 files) → mark TASTE DECISION.
- All 10 review sections: run fully, auto-decide each issue, log every decision.
- Dual voices: always run BOTH Claude subagent AND Codex if available (P6).
  Run them sequentially in foreground. First the Claude subagent (Agent tool,
  foreground — do NOT use run_in_background), then Codex (Bash). Both must
  complete before building the consensus table.

  **Codex CEO voice** (via Bash):
  ```bash
  _REPO_ROOT=$(git rev-parse --show-toplevel) || { echo "ERROR: not in a git repo" >&2; exit 1; }
  _product_codex_timeout_wrapper 600 codex exec "IMPORTANT: Do NOT read or execute any SKILL.md files or files in skill definition directories (paths containing skills/build-stacks). These are AI assistant skill definitions meant for a different system. Stay focused on repository code only.

  You are a CEO/founder advisor reviewing a development plan.
  Challenge the strategic foundations: Are the premises valid or assumed? Is this the
  right problem to solve, or is there a reframing that would be 10x more impactful?
  What alternatives were dismissed too quickly? What competitive or market risks are
  unaddressed? What scope decisions will look foolish in 6 months? Be adversarial.
  No compliments. Just the strategic blind spots.
  File: <plan_path>" -C "$_REPO_ROOT" -s read-only --enable web_search_cached < /dev/null
  _CODEX_EXIT=$?
  if [ "$_CODEX_EXIT" = "124" ]; then
    _product_codex_log_event "codex_timeout" "600"
    _product_codex_log_hang "autoplan" "0"
    echo "[codex stalled past 10 minutes — tagging as [codex-unavailable] for this phase and proceeding with Claude subagent only]"
  fi
  ```
  Timeout: 10 minutes (shell-wrapper) + 12 minutes (Bash outer gate). On hang, auto-degrades this phase's Codex voice.

  **Claude CEO subagent** (via Agent tool):
  "Read the plan file at <plan_path>. You are an independent CEO/strategist
  reviewing this plan. You have NOT seen any prior review. Evaluate:
  1. Is this the right problem to solve? Could a reframing yield 10x impact?
  2. Are the premises stated or just assumed? Which ones could be wrong?
  3. What's the 6-month regret scenario — what will look foolish?
  4. What alternatives were dismissed without sufficient analysis?
  5. What's the competitive risk — could someone else solve this first/better?
  For each finding: what's wrong, severity (critical/high/medium), and the fix."

  **Error handling:** Both calls block in foreground. Codex auth/timeout/empty → proceed with
  Claude subagent only, tagged `[single-model]`. If Claude subagent also fails →
  "Outside voices unavailable — continuing with primary review."

  **Degradation matrix:** Both fail → "single-reviewer mode". Codex only →
  tag `[codex-only]`. Subagent only → tag `[subagent-only]`.

- Strategy choices: if codex disagrees with a premise or scope decision with valid
  strategic reason → TASTE DECISION. If both models agree the user's stated structure
  should change (merge, split, add, remove) → USER CHALLENGE (never auto-decided).

**Required execution checklist (CEO):**

Step 0 (0A-0F) — run each sub-step and produce:
- 0A: Premise challenge with specific premises named and evaluated
- 0B: Existing code leverage map (sub-problems → existing code)
- 0C: Dream state diagram (CURRENT → THIS PLAN → 12-MONTH IDEAL)
- 0C-bis: Implementation alternatives table (2-3 approaches with effort/risk/pros/cons)
- 0D: Mode-specific analysis with scope decisions logged
- 0E: Temporal interrogation (HOUR 1 → HOUR 6+)
- 0F: Mode selection confirmation

Step 0.5 (Dual Voices): Run Claude subagent (foreground Agent tool) first, then
Codex (Bash). Present Codex output under CODEX SAYS (CEO — strategy challenge)
header. Present subagent output under CLAUDE SUBAGENT (CEO — strategic independence)
header. Produce CEO consensus table:

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   —       —      —
  2. Right problem to solve?           —       —      —
  3. Scope calibration correct?        —       —      —
  4. Alternatives sufficiently explored?—      —      —
  5. Competitive/market risks covered? —       —      —
  6. 6-month trajectory sound?         —       —      —
═══════════════════════════════════════════════════════════════
CONFIRMED = both agree. DISAGREE = models differ (→ taste decision).
Missing voice = N/A (not CONFIRMED). Single critical finding from one voice = flagged regardless.
```

Sections 1-10 — for EACH section, run the evaluation criteria from the loaded skill file:
- Sections WITH findings: full analysis, auto-decide each issue, log to audit trail
- Sections with NO findings: 1-2 sentences stating what was examined and why nothing
  was flagged. NEVER compress a section to just its name in a table row.
- Section 11 (Design): run only if UI scope was detected in Phase 0

**Mandatory outputs from Phase 1:**
- "NOT in scope" section with deferred items and rationale
- "What already exists" section mapping sub-problems to existing code
- Error & Rescue Registry table (from Section 2)
- Failure Modes Registry table (from review sections)
- Dream state delta (where this plan leaves us vs 12-month ideal)
- Completion Summary (the full summary table from the CEO skill)

**PHASE 1 COMPLETE.** Emit phase-transition summary:
> **Phase 1 complete.** Codex: [N concerns]. Claude subagent: [N issues].
> Consensus: [X/6 confirmed, Y disagreements → surfaced at gate].
> Passing to Phase 2.

Do NOT begin Phase 2 until all Phase 1 outputs are written to the plan file
and the premise gate has been passed.

---

**Pre-Phase 2 checklist (verify before starting):**
- [ ] CEO completion summary written to plan file
- [ ] CEO dual voices ran (Codex + Claude subagent, or noted unavailable)
- [ ] CEO consensus table produced
- [ ] Premise gate passed (user confirmed)
- [ ] Phase-transition summary emitted

## Phase 2: Design Review (conditional — skip if no UI scope)

Follow build-role-designer/SKILL.md — all 7 dimensions, full depth.
Override: every AskUserQuestion → auto-decide using the 6 principles.

**Override rules:**
- Focus areas: all relevant dimensions (P1)
- Structural issues (missing states, broken hierarchy): auto-fix (P5)
- Aesthetic/taste issues: mark TASTE DECISION
- Design system alignment: auto-fix if DESIGN.md exists and fix is obvious
- Dual voices: always run BOTH Claude subagent AND Codex if available (P6).

  **Codex design voice** (via Bash):
  ```bash
  _REPO_ROOT=$(git rev-parse --show-toplevel) || { echo "ERROR: not in a git repo" >&2; exit 1; }
  _product_codex_timeout_wrapper 600 codex exec "IMPORTANT: Do NOT read or execute any SKILL.md files or files in skill definition directories (paths containing skills/build-stacks). These are AI assistant skill definitions meant for a different system. Stay focused on repository code only.

  Read the plan file at <plan_path>. Evaluate this plan's
  UI/UX design decisions.

  Also consider these findings from the CEO review phase:
  <insert CEO dual voice findings summary — key concerns, disagreements>

  Does the information hierarchy serve the user or the developer? Are interaction
  states (loading, empty, error, partial) specified or left to the implementer's
  imagination? Is the responsive strategy intentional or afterthought? Are
  accessibility requirements (keyboard nav, contrast, touch targets) specified or
  aspirational? Does the plan describe specific UI decisions or generic patterns?
  What design decisions will haunt the implementer if left ambiguous?
  Be opinionated. No hedging." -C "$_REPO_ROOT" -s read-only --enable web_search_cached < /dev/null
  _CODEX_EXIT=$?
  if [ "$_CODEX_EXIT" = "124" ]; then
    _product_codex_log_event "codex_timeout" "600"
    _product_codex_log_hang "autoplan" "0"
    echo "[codex stalled past 10 minutes — tagging as [codex-unavailable] for this phase and proceeding with Claude subagent only]"
  fi
  ```
  Timeout: 10 minutes (shell-wrapper) + 12 minutes (Bash outer gate). On hang, auto-degrades this phase's Codex voice.

  **Claude design subagent** (via Agent tool):
  "Read the plan file at <plan_path>. You are an independent senior product designer
  reviewing this plan. You have NOT seen any prior review. Evaluate:
  1. Information hierarchy: what does the user see first, second, third? Is it right?
  2. Missing states: loading, empty, error, success, partial — which are unspecified?
  3. User journey: what's the emotional arc? Where does it break?
  4. Specificity: does the plan describe SPECIFIC UI or generic patterns?
  5. What design decisions will haunt the implementer if left ambiguous?
  For each finding: what's wrong, severity (critical/high/medium), and the fix."
  NO prior-phase context — subagent must be truly independent.

  Error handling: same as Phase 1 (both foreground/blocking, degradation matrix applies).

- Design choices: if codex disagrees with a design decision with valid UX reasoning
  → TASTE DECISION. Scope changes both models agree on → USER CHALLENGE.

**Required execution checklist (Design):**

1. Step 0 (Design Scope): Rate completeness 0-10. Check DESIGN.md. Map existing patterns.

2. Step 0.5 (Dual Voices): Run Claude subagent (foreground) first, then Codex. Present under
   CODEX SAYS (design — UX challenge) and CLAUDE SUBAGENT (design — independent review)
   headers. Produce design litmus scorecard (consensus table). Use the litmus scorecard
   format from build-role-designer. Include CEO phase findings in Codex prompt ONLY
   (not Claude subagent — stays independent).

3. Passes 1-7: Run each from loaded skill. Rate 0-10. Auto-decide each issue.
   DISAGREE items from scorecard → raised in the relevant pass with both perspectives.

**PHASE 2 COMPLETE.** Emit phase-transition summary:
> **Phase 2 complete.** Codex: [N concerns]. Claude subagent: [N issues].
> Consensus: [X/Y confirmed, Z disagreements → surfaced at gate].
> Passing to Phase 3.

Do NOT begin Phase 3 until all Phase 2 outputs (if run) are written to the plan file.

---

**Pre-Phase 3 checklist (verify before starting):**
- [ ] All Phase 1 items above confirmed
- [ ] Design completion summary written (or "skipped, no UI scope")
- [ ] Design dual voices ran (if Phase 2 ran)
- [ ] Design consensus table produced (if Phase 2 ran)
- [ ] Phase-transition summary emitted

## Phase 3: Eng Review + Dual Voices

Follow build-role-engmanager/SKILL.md — all sections, full depth.
Override: every AskUserQuestion → auto-decide using the 6 principles.

**Override rules:**
- Scope challenge: never reduce (P2)
- Dual voices: always run BOTH Claude subagent AND Codex if available (P6).

  **Codex eng voice** (via Bash):
  ```bash
  _REPO_ROOT=$(git rev-parse --show-toplevel) || { echo "ERROR: not in a git repo" >&2; exit 1; }
  _product_codex_timeout_wrapper 600 codex exec "IMPORTANT: Do NOT read or execute any SKILL.md files or files in skill definition directories (paths containing skills/build-stacks). These are AI assistant skill definitions meant for a different system. Stay focused on repository code only.

  Review this plan for architectural issues, missing edge cases,
  and hidden complexity. Be adversarial.

  Also consider these findings from prior review phases:
  CEO: <insert CEO consensus table summary — key concerns, DISAGREEs>
  Design: <insert Design consensus table summary, or 'skipped, no UI scope'>

  File: <plan_path>" -C "$_REPO_ROOT" -s read-only --enable web_search_cached < /dev/null
  _CODEX_EXIT=$?
  if [ "$_CODEX_EXIT" = "124" ]; then
    _product_codex_log_event "codex_timeout" "600"
    _product_codex_log_hang "autoplan" "0"
    echo "[codex stalled past 10 minutes — tagging as [codex-unavailable] for this phase and proceeding with Claude subagent only]"
  fi
  ```
  Timeout: 10 minutes (shell-wrapper) + 12 minutes (Bash outer gate). On hang, auto-degrades this phase's Codex voice.

  **Claude eng subagent** (via Agent tool):
  "Read the plan file at <plan_path>. You are an independent senior engineer
  reviewing this plan. You have NOT seen any prior review. Evaluate:
  1. Architecture: Is the component structure sound? Coupling concerns?
  2. Edge cases: What breaks under 10x load? What's the nil/empty/error path?
  3. Tests: What's missing from the test plan? What would break at 2am Friday?
  4. Security: New attack surface? Auth boundaries? Input validation?
  5. Hidden complexity: What looks simple but isn't?
  For each finding: what's wrong, severity, and the fix."
  NO prior-phase context — subagent must be truly independent.

  Error handling: same as Phase 1 (both foreground/blocking, degradation matrix applies).

- Architecture choices: explicit over clever (P5). If codex disagrees with valid reason → TASTE DECISION. Scope changes both models agree on → USER CHALLENGE.
- Evals: always include all relevant suites (P1)
- Test plan: generate artifact at `.build-stacks/design-docs/$SLUG/{user}-{branch}-test-plan-{datetime}.md`
- TODOS.md: collect all deferred scope expansions from Phase 1, auto-write

**Required execution checklist (Eng):**

1. Step 0 (Scope Challenge): Read actual code referenced by the plan. Map each
   sub-problem to existing code. Run the complexity check. Produce concrete findings.

2. Step 0.5 (Dual Voices): Run Claude subagent (foreground) first, then Codex. Present
   Codex output under CODEX SAYS (eng — architecture challenge) header. Present subagent
   output under CLAUDE SUBAGENT (eng — independent review) header. Produce eng consensus
   table:

```
ENG DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?               —       —      —
  2. Test coverage sufficient?         —       —      —
  3. Performance risks addressed?      —       —      —
  4. Security threats covered?         —       —      —
  5. Error paths handled?              —       —      —
  6. Deployment risk manageable?       —       —      —
═══════════════════════════════════════════════════════════════
CONFIRMED = both agree. DISAGREE = models differ (→ taste decision).
Missing voice = N/A (not CONFIRMED). Single critical finding from one voice = flagged regardless.
```

3. Section 1 (Architecture): Produce ASCII dependency graph showing new components
   and their relationships to existing ones. Evaluate coupling, scaling, security.

4. Section 2 (Code Quality): Identify DRY violations, naming issues, complexity.
   Reference specific files and patterns. Auto-decide each finding.

5. **Section 3 (Test Review) — NEVER SKIP OR COMPRESS.**
   This section requires reading actual code, not summarizing from memory.
   - Read the diff or the plan's affected files
   - Build the test diagram: list every NEW UX flow, data flow, codepath, and branch
   - For EACH item in the diagram: what type of test covers it? Does one exist? Gaps?
   - For LLM/prompt changes: which eval suites must run?
   - Auto-deciding test gaps means: identify the gap → decide whether to add a test
     or defer (with rationale and principle) → log the decision. It does NOT mean
     skipping the analysis.
   - Write the test plan artifact to disk

6. Section 4 (Performance): Evaluate N+1 queries, memory, caching, slow paths.

**Mandatory outputs from Phase 3:**
- "NOT in scope" section
- "What already exists" section
- Architecture ASCII diagram (Section 1)
- Test diagram mapping codepaths to coverage (Section 3)
- Test plan artifact written to disk (Section 3)
- Failure modes registry with critical gap flags
- Completion Summary (the full summary from the Eng skill)
- TODOS.md updates (collected from all phases)

**PHASE 3 COMPLETE.** Emit phase-transition summary:
> **Phase 3 complete.** Codex: [N concerns]. Claude subagent: [N issues].
> Consensus: [X/6 confirmed, Y disagreements → surfaced at gate].
> Passing to Phase 3.5 (DX Review) or Phase 4 (Final Gate).

---

## Phase 3.5: DX Review (conditional — skip if no developer-facing scope)

Follow build-role-dxlead/SKILL.md — all 8 DX dimensions, full depth.
Override: every AskUserQuestion → auto-decide using the 6 principles.

**Skip condition:** If DX scope was NOT detected in Phase 0, skip this phase entirely.
Log: "Phase 3.5 skipped — no developer-facing scope detected."

**Override rules:**
- Mode selection: DX POLISH
- Persona: infer from README/docs, pick the most common developer type (P6)
- Competitive benchmark: run searches if WebSearch available, use reference benchmarks otherwise (P1)
- Magical moment: pick the lowest-effort delivery vehicle that achieves the competitive tier (P5)
- Getting started friction: always optimize toward fewer steps (P5, simpler over clever)
- Error message quality: always require problem + cause + fix (P1, completeness)
- API/CLI naming: consistency wins over cleverness (P5)
- DX taste decisions (e.g., opinionated defaults vs flexibility): mark TASTE DECISION
- Dual voices: always run BOTH Claude subagent AND Codex if available (P6).

  **Codex DX voice** (via Bash):
  ```bash
  _REPO_ROOT=$(git rev-parse --show-toplevel) || { echo "ERROR: not in a git repo" >&2; exit 1; }
  _product_codex_timeout_wrapper 600 codex exec "IMPORTANT: Do NOT read or execute any SKILL.md files or files in skill definition directories (paths containing skills/build-stacks). These are AI assistant skill definitions meant for a different system. Stay focused on repository code only.

  Read the plan file at <plan_path>. Evaluate this plan's developer experience.

  Also consider these findings from prior review phases:
  CEO: <insert CEO consensus summary>
  Eng: <insert Eng consensus summary>

  You are a developer who has never seen this product. Evaluate:
  1. Time to hello world: how many steps from zero to working? Target is under 5 minutes.
  2. Error messages: when something goes wrong, does the dev know what, why, and how to fix?
  3. API/CLI design: are names guessable? Are defaults sensible? Is it consistent?
  4. Docs: can a dev find what they need in under 2 minutes? Are examples copy-paste-complete?
  5. Upgrade path: can devs upgrade without fear? Migration guides? Deprecation warnings?
  Be adversarial. Think like a developer who is evaluating this against 3 competitors." -C "$_REPO_ROOT" -s read-only --enable web_search_cached < /dev/null
  _CODEX_EXIT=$?
  if [ "$_CODEX_EXIT" = "124" ]; then
    _product_codex_log_event "codex_timeout" "600"
    _product_codex_log_hang "autoplan" "0"
    echo "[codex stalled past 10 minutes — tagging as [codex-unavailable] for this phase and proceeding with Claude subagent only]"
  fi
  ```
  Timeout: 10 minutes (shell-wrapper) + 12 minutes (Bash outer gate). On hang, auto-degrades this phase's Codex voice.

  **Claude DX subagent** (via Agent tool):
  "Read the plan file at <plan_path>. You are an independent DX engineer
  reviewing this plan. You have NOT seen any prior review. Evaluate:
  1. Getting started: how many steps from zero to hello world? What's the TTHW?
  2. API/CLI ergonomics: naming consistency, sensible defaults, progressive disclosure?
  3. Error handling: does every error path specify problem + cause + fix + docs link?
  4. Documentation: copy-paste examples? Information architecture? Interactive elements?
  5. Escape hatches: can developers override every opinionated default?
  For each finding: what's wrong, severity (critical/high/medium), and the fix."
  NO prior-phase context — subagent must be truly independent.

  Error handling: same as Phase 1 (both foreground/blocking, degradation matrix applies).

- DX choices: if codex disagrees with a DX decision with valid developer empathy reasoning
  → TASTE DECISION. Scope changes both models agree on → USER CHALLENGE.

**Required execution checklist (DX):**

1. Step 0 (DX Scope Assessment): Auto-detect product type. Map the developer journey.
   Rate initial DX completeness 0-10. Assess TTHW.

2. Step 0.5 (Dual Voices): Run Claude subagent (foreground) first, then Codex. Present
   under CODEX SAYS (DX — developer experience challenge) and CLAUDE SUBAGENT
   (DX — independent review) headers. Produce DX consensus table:

```
DX DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Getting started < 5 min?          —       —      —
  2. API/CLI naming guessable?         —       —      —
  3. Error messages actionable?        —       —      —
  4. Docs findable & complete?         —       —      —
  5. Upgrade path safe?                —       —      —
  6. Dev environment friction-free?    —       —      —
═══════════════════════════════════════════════════════════════
CONFIRMED = both agree. DISAGREE = models differ (→ taste decision).
Missing voice = N/A (not CONFIRMED). Single critical finding from one voice = flagged regardless.
```

3. Passes 1-8: Run each from loaded skill. Rate 0-10. Auto-decide each issue.
   DISAGREE items from consensus table → raised in the relevant pass with both perspectives.

4. DX Scorecard: Produce the full scorecard with all 8 dimensions scored.

**Mandatory outputs from Phase 3.5:**
- Developer journey map (9-stage table)
- Developer empathy narrative (first-person perspective)
- DX Scorecard with all 8 dimension scores
- DX Implementation Checklist
- TTHW assessment with target

**PHASE 3.5 COMPLETE.** Emit phase-transition summary:
> **Phase 3.5 complete.** DX overall: [N]/10. TTHW: [N] min → [target] min.
> Codex: [N concerns]. Claude subagent: [N issues].
> Consensus: [X/6 confirmed, Y disagreements → surfaced at gate].
> Passing to Phase 4 (Final Gate).

---

## Decision Audit Trail

After each auto-decision, append a row to the plan file using Edit:

```markdown
<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
```

Write one row per decision incrementally (via Edit). This keeps the audit on disk,
not accumulated in conversation context.

---

## Pre-Gate Verification

Before presenting the Final Approval Gate, verify that required outputs were actually
produced. Check the plan file and conversation for each item.

**Phase 1 (CEO) outputs:**
- [ ] Premise challenge with specific premises named (not just "premises accepted")
- [ ] All applicable review sections have findings OR explicit "examined X, nothing flagged"
- [ ] Error & Rescue Registry table produced (or noted N/A with reason)
- [ ] Failure Modes Registry table produced (or noted N/A with reason)
- [ ] "NOT in scope" section written
- [ ] "What already exists" section written
- [ ] Dream state delta written
- [ ] Completion Summary produced
- [ ] Dual voices ran (Codex + Claude subagent, or noted unavailable)
- [ ] CEO consensus table produced

**Phase 2 (Design) outputs — only if UI scope detected:**
- [ ] All 7 dimensions evaluated with scores
- [ ] Issues identified and auto-decided
- [ ] Dual voices ran (or noted unavailable/skipped with phase)
- [ ] Design litmus scorecard produced

**Phase 3 (Eng) outputs:**
- [ ] Scope challenge with actual code analysis (not just "scope is fine")
- [ ] Architecture ASCII diagram produced
- [ ] Test diagram mapping codepaths to test coverage
- [ ] Test plan artifact written to disk at .build-stacks/design-docs/$SLUG/
- [ ] "NOT in scope" section written
- [ ] "What already exists" section written
- [ ] Failure modes registry with critical gap assessment
- [ ] Completion Summary produced
- [ ] Dual voices ran (Codex + Claude subagent, or noted unavailable)
- [ ] Eng consensus table produced

**Phase 3.5 (DX) outputs — only if DX scope detected:**
- [ ] All 8 DX dimensions evaluated with scores
- [ ] Developer journey map produced
- [ ] Developer empathy narrative written
- [ ] TTHW assessment with target
- [ ] DX Implementation Checklist produced
- [ ] Dual voices ran (or noted unavailable/skipped with phase)
- [ ] DX consensus table produced

**Cross-phase:**
- [ ] Cross-phase themes section written

**Audit trail:**
- [ ] Decision Audit Trail has at least one row per auto-decision (not empty)

If ANY checkbox above is missing, go back and produce the missing output. Max 2
attempts — if still missing after retrying twice, proceed to the gate with a warning
noting which items are incomplete. Do not loop indefinitely.

---

## Phase 4: Final Approval Gate

**STOP here and present the final state to the user.**

Present as a message, then use AskUserQuestion:

```
## /autoplan Review Complete

### Plan Summary
[1-3 sentence summary]

### Decisions Made: [N] total ([M] auto-decided, [K] taste choices, [J] user challenges)

### User Challenges (both models disagree with your stated direction)
[For each user challenge:]
**Challenge [N]: [title]** (from [phase])
You said: [user's original direction]
Both models recommend: [the change]
Why: [reasoning]
What we might be missing: [blind spots]
If we're wrong, the cost is: [downside of changing]
[If security/feasibility: "WARNING: Both models flag this as a security/feasibility risk,
not just a preference."]

Your call — your original direction stands unless you explicitly change it.

### Your Choices (taste decisions)
[For each taste decision:]
**Choice [N]: [title]** (from [phase])
I recommend [X] — [principle]. But [Y] is also viable:
  [1-sentence downstream impact if you pick Y]

### Auto-Decided: [M] decisions [see Decision Audit Trail in plan file]

### Review Scores
- CEO: [summary]
- CEO Voices: Codex [summary], Claude subagent [summary], Consensus [X/6 confirmed]
- Design: [summary or "skipped, no UI scope"]
- Design Voices: Codex [summary], Claude subagent [summary], Consensus [X/7 confirmed] (or "skipped")
- Eng: [summary]
- Eng Voices: Codex [summary], Claude subagent [summary], Consensus [X/6 confirmed]
- DX: [summary or "skipped, no developer-facing scope"]
- DX Voices: Codex [summary], Claude subagent [summary], Consensus [X/6 confirmed] (or "skipped")

### Cross-Phase Themes
[For any concern that appeared in 2+ phases' dual voices independently:]
**Theme: [topic]** — flagged in [Phase 1, Phase 3]. High-confidence signal.
[If no themes span phases:] "No cross-phase themes — each phase's concerns were distinct."

### Deferred to TODOS.md
[Items auto-deferred with reasons]
```

**Cognitive load management:**
- 0 user challenges: skip "User Challenges" section
- 0 taste decisions: skip "Your Choices" section
- 1-7 taste decisions: flat list
- 8+: group by phase. Add warning: "This plan had unusually high ambiguity ([N] taste decisions). Review carefully."

AskUserQuestion options:
- A) Approve as-is (accept all recommendations)
- B) Approve with overrides (specify which taste decisions to change)
- B2) Approve with user challenge responses (accept or reject each challenge)
- C) Interrogate (ask about any specific decision)
- D) Revise (the plan itself needs changes)
- E) Reject (start over)

**Option handling:**
- A: mark APPROVED, write review logs, suggest build-recipe-ship
- B: ask which overrides, apply, re-present gate
- C: answer freeform, re-present gate
- D: make changes, re-run affected phases (scope→1B, design→2, test plan→3, arch→3). Max 3 cycles.
- E: start over

---

## Completion: Write Review Logs

On approval, write 3 separate review log entries so build-recipe-ship's dashboard recognizes them.
Replace TIMESTAMP, STATUS, and N with actual values from each review phase.
STATUS is "clean" if no unresolved issues, "issues_open" otherwise.

```bash
COMMIT=$(git rev-parse --short HEAD 2>/dev/null)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"build-role-founder","timestamp":"'"$TIMESTAMP"'","status":"STATUS","unresolved":N,"critical_gaps":N,"mode":"SELECTIVE_EXPANSION","via":"autoplan","commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl

mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"build-role-engmanager","timestamp":"'"$TIMESTAMP"'","status":"STATUS","unresolved":N,"critical_gaps":N,"issues_found":N,"mode":"FULL_REVIEW","via":"autoplan","commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl
```

If Phase 2 ran (UI scope):
```bash
mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"build-role-designer","timestamp":"'"$TIMESTAMP"'","status":"STATUS","unresolved":N,"via":"autoplan","commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl
```

If Phase 3.5 ran (DX scope):
```bash
mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"build-role-dxlead","timestamp":"'"$TIMESTAMP"'","status":"STATUS","initial_score":N,"overall_score":N,"product_type":"TYPE","tthw_current":"TTHW","tthw_target":"TARGET","unresolved":N,"via":"autoplan","commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl
```

Dual voice logs (one per phase that ran):
```bash
mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"autoplan-voices","timestamp":"'"$TIMESTAMP"'","status":"STATUS","source":"SOURCE","phase":"ceo","via":"autoplan","consensus_confirmed":N,"consensus_disagree":N,"commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl

mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"autoplan-voices","timestamp":"'"$TIMESTAMP"'","status":"STATUS","source":"SOURCE","phase":"eng","via":"autoplan","consensus_confirmed":N,"consensus_disagree":N,"commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl
```

If Phase 2 ran (UI scope), also log:
```bash
mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"autoplan-voices","timestamp":"'"$TIMESTAMP"'","status":"STATUS","source":"SOURCE","phase":"design","via":"autoplan","consensus_confirmed":N,"consensus_disagree":N,"commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl
```

If Phase 3.5 ran (DX scope), also log:
```bash
mkdir -p .build-stacks/analytics; printf %s
 '{"skill":"autoplan-voices","timestamp":"'"$TIMESTAMP"'","status":"STATUS","source":"SOURCE","phase":"dx","via":"autoplan","consensus_confirmed":N,"consensus_disagree":N,"commit":"'"$COMMIT"'"}' >> .build-stacks/analytics/reviews.jsonl
```

SOURCE = "codex+subagent", "codex-only", "subagent-only", or "unavailable".
Replace N values with actual consensus counts from the tables.

Suggest next step: `build-recipe-ship` when ready to create the PR.

---

## Important Rules

- **Never abort.** The user chose /autoplan. Respect that choice. Surface all taste decisions, never redirect to interactive review.
- **Two gates.** The non-auto-decided AskUserQuestions are: (1) premise confirmation in Phase 1, and (2) User Challenges — when both models agree the user's stated direction should change. Everything else is auto-decided using the 6 principles.
- **Log every decision.** No silent auto-decisions. Every choice gets a row in the audit trail.
- **Full depth means full depth.** Do not compress or skip sections from the loaded skill files (except the skip list in Phase 0). "Full depth" means: read the code the section asks you to read, produce the outputs the section requires, identify every issue, and decide each one. A one-sentence summary of a section is not "full depth" — it is a skip. If you catch yourself writing fewer than 3 sentences for any review section, you are likely compressing.
- **Artifacts are deliverables.** Test plan artifact, failure modes registry, error/rescue table, ASCII diagrams — these must exist on disk or in the plan file when the review completes. If they don't exist, the review is incomplete.
- **Sequential order.** CEO → Design → Eng → DX. Each phase builds on the last.
