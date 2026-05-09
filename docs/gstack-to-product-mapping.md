# gstack to product-build-stacks Mapping

This document is the only place where legacy names are retained as inventory and parity evidence. Public interfaces in this project use `product-*`.

| Legacy element | product-build-stacks element | Layer |
| --- | --- | --- |
| root `SKILL.md` | `README.md` | core |
| `office-hours` | `product-recipe-discovery` | recipe |
| `autoplan` | `product-recipe-autoplan` | recipe |
| `plan-ceo-review` | `product-role-founder` | role |
| `plan-design-review` | `product-role-designer` | role |
| `plan-eng-review` | `product-role-engmanager` | role |
| `plan-devex-review` | `product-role-dxlead` | role |
| `plan-tune` | `product-flow-plantune` | flow |
| `review` | `product-role-staffengineer` | role |
| `qa` | `product-recipe-qa`, `product-browser-qa` | recipe/browser |
| `qa-only` | `product-flow-qareport` | flow |
| `ship` | `product-recipe-ship`, `product-role-releaseengineer` | recipe/role |
| `land-and-deploy` | `product-recipe-landdeploy` | recipe |
| `canary` | `product-browser-canary` | browser |
| `benchmark` | `product-browser-benchmark` | browser |
| `benchmark-models` | `product-internal-modelbenchmark` | internal |
| `browse` | `product-browser-runner` | browser |
| `open-gstack-browser` | `product-browser-visible` | browser |
| `setup-browser-cookies` | `product-browser-auth` | browser |
| `scrape` | `product-browser-scrape` | browser |
| `skillify` | `product-flow-skillify` | flow |
| `codex` | intentionally omitted | omitted |
| `investigate` | `product-recipe-investigate` | recipe |
| `cso` | `product-role-cso` | role |
| `careful` | `product-guard-destructive` | guard |
| `freeze` | `product-guard-scope` | guard |
| `unfreeze` | `product-guard-scope-release` | guard |
| `guard` | `product-guard-full` | guard |
| `context-save` | `product-runtime-session` | runtime |
| `context-restore` | `product-runtime-session` | runtime |
| `learn` | `product-runtime-learnings` | runtime |
| `retro` | intentionally omitted | omitted |
| `health` | `product-runtime-health` | runtime |
| `document-release` | `product-role-docengineer` | role |
| `devex-review` | `product-role-dxlead` | role |
| `design-review` | `product-role-designer` | role |
| `design-consultation` | `product-flow-designconsult` | flow |
| `design-html` | `product-flow-designhtml` | flow |
| `design-shotgun` | `product-flow-designshotgun` | flow |
| `make-pdf` | `product-source-pdf` | source |
| `landing-report` | `product-flow-landingreport` | flow |
| `pair-agent` | `product-browser-pairagent` | browser |
| `setup-deploy` | `product-source-deploy` | source |
| `setup-gbrain` | intentionally omitted | omitted |
| `gstack-upgrade` | `product-runtime-upgrade` | runtime |

The parity checker treats this file as the migration inventory.

## Removal Timing

Delete this document only after all of these are true:

- `scripts/gstack-skill-mapping-verify.mjs` no longer reads this file.
- `scripts/gstack-fidelity-audit.mjs` no longer needs legacy-to-product rows as its input.
- Every `.apm/skills/*/references/gstack-adaptation.json` is either removed or replaced by release metadata that does not cite a legacy gstack skill name.
- Release verification no longer depends on gstack mapping coverage as proof that the 40 shipped `product-*` skills cover the upstream inventory.

Until then, this file is not user-facing documentation. It is a migration and parity ledger for maintainers.
