# Script Naming Convention

`scripts/` is small enough to stay flat. Names should make the target object obvious from the file list, then state the operation.

## File Names

Use `<target-object>-<operation>.mjs` for runnable scripts. Keep shared data modules as simple nouns.

| File | Target object | Operation | Purpose |
| --- | --- | --- | --- |
| `apm-installed-skills-sync.mjs` | installed skill folders | sync | Compare or sync checked-in skill folders with a fresh `apm install --target all` result. |
| `apm-source-skills-verify.mjs` | source `.apm/skills/*/SKILL.md` files | verify | Validate the APM skill list against source skill frontmatter, titles, and adaptation metadata. |
| `apm-package-prepare.mjs` | local APM package | prepare | Create a clean local package for install smoke tests. |
| `apm-skill-install-smoke.mjs` | skill folders installed by APM | smoke | Install the local package into a temporary app and verify deployed skill roots. |
| `apm-package-verify.mjs` | APM package | verify | Verify package shape, browser policy docs, stale runtime references, script names, and install behavior. |
| `agent-browser-smoke.mjs` | official `agent-browser` | smoke | Run a live localhost open/snapshot/screenshot/close smoke and verify a concrete screenshot artifact. |
| `codex-skill-activation-smoke.mjs` | Codex skill activation | smoke | Install the local package into a temporary Codex app and verify skill discovery/activation. |
| `codex-browser-core-smoke.mjs` | Codex browser core | smoke | Run product browser skills against a local fixture through isolated Codex danger-full-access browser runs. |
| `gstack-skill-mapping-verify.mjs` | gstack legacy skill mapping | verify | Verify mapping coverage and usability docs. |
| `gstack-fidelity-audit.mjs` | product fidelity against upstream gstack | audit | Fetch upstream gstack tree data and report adapted/partial fidelity. |
| `gstack-skill-template-port.mjs` | upstream gstack skill templates being ported to product skills | port | Fetch upstream gstack skill templates and adapt them into `.apm/skills`. |
| `release-license-verify.mjs` | release license files | verify | Verify license files, release notes, and adaptation metadata license fields. |
| `script-names-verify.mjs` | script names | verify | Enforce this file naming rule and block stale script names. |
| `apm-skill-list.mjs` | APM skill list | module | Export skill metadata and name validation. |
| `release-verify.mjs` | release gate | verify | Run the full release gate command list. |
| `repo-secret-scan.mjs` | repository secret exposure | scan | Scan working tree and git history for secrets or private paths. |

Rules:

- Keep the target object first so related files sort together: `apm-*`, `gstack-*`, `release-*`.
- Use `verify` for deterministic validation that exits non-zero on mismatch.
- Use `smoke` only for runnable end-to-end probes.
- Use `audit` for report-producing analysis.
- Use `sync` only for bidirectional verify/write tools.
- Use `scan` only for content scanning.
- Use `prepare` only for scripts that create a local artifact used by another script.
- Do not use `check` in file names or public scripts; choose `verify`, `smoke`, `audit`, or `scan`.
- Avoid vague names that only say compliance, parity, end-to-end, or skill verification without naming the actual target object; they hide the actual scope.

## Function Names

- Entry points use `run<UseCase>()`, for example `runCodexSkillSmoke()`.
- Verifier helpers use explicit phrases, for example `verifyPublicPackageScripts()` or `checkNoRootLegacyRuntime()`.
- Assertions use `assert<Fact>()`, for example `assertAgentBrowserSuccess()`.
- Renderers use `render<Artifact>()`, for example `renderFidelityMarkdown()`.
- Parsers/readers use `parse<Thing>()` or `read<Thing>()`, for example `parseGstackMappingRows()`.
- Command helpers include the execution boundary, for example `runComplianceCommand()` or `runLoggedCommandAsync()`.
- Shared predicates use `is<Fact>()`, for example `isValidProductSkillName()`.

Do not use bare `run`, `main`, `check`, `assert`, `write`, or `parse` in executable scripts unless the file is a tiny one-off that has no reusable helpers.

## Public Scripts

`package.json` and `apm.yml` expose only the APM-facing stable commands:

- `build`
- `generated:verify`
- `browser:doctor`
- `browser:smoke`
- `skill:verify`
- `apm:verify`
- `smoke:codex`
- `smoke:all`
- `release:verify`

Other files under `scripts/` are maintainer tools and must be invoked by filename when needed.
