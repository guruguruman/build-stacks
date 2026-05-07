# gstack to product-build-stacks Mapping

This document is the only place where legacy names are retained as inventory and parity evidence. Public interfaces in this project use `product-*`.

| Legacy element | product-build-stacks element | Layer |
| --- | --- | --- |
| root `SKILL.md` | `README.md` | core |
| `office-hours` | `product-recipe-discovery` | recipe |
| `autoplan` | `product-recipe-autoplan` | recipe |
| `plan-ceo-review` | `product-flow-ceoreview`, `product-role-founder` | flow/role |
| `plan-design-review` | `product-flow-designreview`, `product-role-designer` | flow/role |
| `plan-eng-review` | `product-flow-engreview`, `product-role-engmanager` | flow/role |
| `plan-devex-review` | `product-flow-devexreview`, `product-role-dxlead` | flow/role |
| `plan-tune` | `product-flow-plantune` | flow |
| `review` | `product-flow-codereview`, `product-role-staffengineer` | flow/role |
| `qa` | `product-recipe-qa`, `product-browser-qa` | recipe/browser |
| `qa-only` | `product-flow-qareport` | flow |
| `ship` | `product-recipe-ship`, `product-role-releaseengineer` | recipe/role |
| `land-and-deploy` | `product-recipe-landdeploy` | recipe |
| `canary` | `product-browser-canary` | browser |
| `benchmark` | `product-browser-benchmark` | browser |
| `benchmark-models` | `product-source-models`, `product-flow-modelbenchmark` | source/flow |
| `browse` | `product-browser-runner` | browser |
| `open-gstack-browser` | `product-browser-visible` | browser |
| `setup-browser-cookies` | `product-browser-auth` | browser |
| `scrape` | `product-browser-scrape` | browser |
| `skillify` | `product-flow-skillify` | flow |
| `codex` | `product-source-codex`, `product-flow-secondopinion` | source/flow |
| `investigate` | `product-recipe-investigate` | recipe |
| `cso` | `product-flow-securityreview`, `product-role-cso` | flow/role |
| `careful` | `product-guard-destructive` | guard |
| `freeze` | `product-guard-scope` | guard |
| `unfreeze` | `product-guard-scope-release` | guard |
| `guard` | `product-guard-full` | guard |
| `context-save` | `product-runtime-session` | runtime |
| `context-restore` | `product-runtime-session` | runtime |
| `learn` | `product-runtime-learnings` | runtime |
| `retro` | `product-recipe-retro` | recipe |
| `health` | `product-runtime-health` | runtime |
| `document-release` | `product-flow-docrelease`, `product-role-docengineer` | flow/role |
| `devex-review` | `product-flow-devexreview` | flow |
| `design-review` | `product-flow-designreview` | flow |
| `design-consultation` | `product-flow-designconsult` | flow |
| `design-html` | `product-flow-designhtml` | flow |
| `design-shotgun` | `product-flow-designshotgun` | flow |
| `make-pdf` | `product-source-pdf` | source |
| `landing-report` | `product-flow-landingreport` | flow |
| `pair-agent` | `product-browser-pairagent` | browser |
| `setup-deploy` | `product-source-deploy` | source |
| `setup-gbrain` | `product-runtime-knowledge` | runtime |
| `gstack-upgrade` | `product-runtime-upgrade` | runtime |

The parity checker treats this file as the migration inventory.

## Removal Timing

Delete this document only after all of these are true:

- `scripts/gstack-skill-mapping-verify.ts` no longer reads this file.
- `scripts/gstack-fidelity-audit.ts` no longer needs legacy-to-product rows as its input.
- Every `.apm/skills/*/references/gstack-adaptation.json` is either removed or replaced by release metadata that does not cite a legacy gstack skill name.
- Release verification no longer depends on gstack mapping coverage as proof that the 52 public `product-*` skills cover the upstream inventory.

Until then, this file is not user-facing documentation. It is a migration and parity ledger for maintainers.
