# product-stacks Implementation Plan

この計画は、Garry Tan氏の `gstack` をAPM管理の `product-stacks` として再構築するための実装計画です。

前提は次の通りです。

```text
・外部interfaceは `product-*` にする
・旧gstack名は対応表にだけ残す
・機能parityは完全再現を目指す
・browser runtimeはBun daemonを前提にする
・generated browser skillの共有はglobal folderではなくAPM promotionで行う
・runtime stateは `.product/` に閉じる
・APMのsource/deploy/runtime境界を崩さない
```

## 1. 調査結果

gstack実コードでは、root `SKILL.md` を含めて45個の `SKILL.md` が確認できます。

```text
SKILL.md
autoplan
benchmark
benchmark-models
browse
canary
careful
codex
context-restore
context-save
cso
design-consultation
design-html
design-review
design-shotgun
devex-review
document-release
freeze
gstack-upgrade
guard
health
investigate
land-and-deploy
landing-report
learn
make-pdf
office-hours
open-gstack-browser
pair-agent
plan-ceo-review
plan-design-review
plan-devex-review
plan-eng-review
plan-tune
qa
qa-only
retro
review
scrape
setup-browser-cookies
setup-deploy
setup-gbrain
ship
skillify
unfreeze
```

gstackのbrowser実装は `browse/src` にあり、Bun daemon、Playwright、localhost HTTP command server、token registry、scoped token、content security、CDP allowlist、browser-skill runnerを持ちます。`package.json` でも `bun build --compile browse/src/cli.ts` を実行してcompiled binaryを作ります。

したがって、`tsx` script中心の軽量browserでは不十分です。browserはBun daemonとして移植します。

## 2. APM方針の修正

APM上の正しい分離は以下です。

| 領域 | 場所 | 役割 |
| --- | --- | --- |
| source | `.apm/` | authored primitives。review対象 |
| dependencies | `apm_modules/` | install済みAPM packages |
| deploy output | `.agents/skills/`, `.claude/skills/`, `.codex/agents/`, `AGENTS.md` | runtimeが読む生成物 |
| runtime state | `.product/` | ledger、browser state、session、artifact |
| distribution | git tag + `apm.yml` dependency + `apm.lock.yaml` | consumer repoへの配布 |

APMのsub-skill promotionは、`.apm/skills/*` を `apm install` 時にtargetのskill rootへdeployすることを指します。手元で生成されたbrowser skillを共有したい場合は、global folderへ置くのではなく、`.apm/skills/` へPRで昇格させ、versioned packageとして配布します。

## 3. gstack → product-stacks 対応表

| gstack要素 | 移植後 | 主Layer | 実装方針 |
| --- | --- | --- | --- |
| root `SKILL.md` | `SKILL.md` | core | package-level guideとrouting入口 |
| `office-hours` | `product-recipe-discovery` | recipe | six forcing questions、保存はdesign docのみ |
| `autoplan` | `product-recipe-autoplan` | recipe | CEO→Design→Eng→DXの順にplanを強化 |
| `plan-ceo-review` | `product-flow-ceoreview`, `product-role-founder` | flow/role | scope mode、wedge、10-star判断を維持 |
| `plan-design-review` | `product-flow-designreview`, `product-role-designer` | flow/role | UI planを0-10評価し修正 |
| `plan-eng-review` | `product-flow-engreview`, `product-role-engmanager` | flow/role | architecture、data flow、edge case、test plan |
| `plan-devex-review` | `product-flow-devexreview`, `product-role-dxlead` | flow/role | API/CLI/docs/onboardingのDX評価 |
| `plan-tune` | `product-flow-plantune` | flow | planの過不足、順序、scopeを調整 |
| `review` | `product-flow-codereview`, `product-role-staffengineer` | flow/role | pre-landing review、diff/SQL/trust boundary |
| `qa` | `product-recipe-qa`, `product-browser-qa` | recipe/browser | browser QA、修正、再検証、atomic commit |
| `qa-only` | `product-flow-qareport` | flow | 修正なしのQA report |
| `ship` | `product-recipe-ship`, `product-role-releaseengineer` | recipe/role | tests、coverage、docs、PR作成 |
| `land-and-deploy` | `product-recipe-landdeploy` | recipe | merge/deploy/prod verification |
| `canary` | `product-browser-canary` | browser | post-deploy monitoring |
| `benchmark` | `product-browser-benchmark` | browser | performance/Core Web Vitals相当 |
| `benchmark-models` | `product-source-models`, `product-flow-modelbenchmark` | source/flow | model比較とsecond opinion評価 |
| `browse` | `product-browser-runner` | browser | Bun daemon + command surface |
| `open-gstack-browser` | `product-browser-visible` | browser | headed browser/sidebar相当 |
| `setup-browser-cookies` | `product-browser-auth` | browser | cookie import、強redaction |
| `scrape` | `product-browser-scrape` | browser | page extraction、untrusted envelope |
| `skillify` | `product-flow-skillify` | flow | 作業手順をbrowser skill候補へ変換 |
| `codex` | `product-source-codex`, `product-flow-secondopinion` | source/flow | Codex CLI利用。未導入時はdegrade |
| `investigate` | `product-recipe-investigate` | recipe | 調査なし修正を禁止 |
| `cso` | `product-flow-securityreview`, `product-role-cso` | flow/role | OWASP/STRIDE/security review |
| `careful` | `product-guard-destructive` | guard | 破壊的操作の警告 |
| `freeze` | `product-guard-scope` | guard | 編集範囲lock |
| `unfreeze` | `product-guard-scope-release` | guard | scope lock解除 |
| `guard` | `product-guard-full` | guard | careful + freeze + policy |
| `context-save` | `product-runtime-session` | runtime | session snapshot保存 |
| `context-restore` | `product-runtime-session` | runtime | session restore |
| `learn` | `product-runtime-learnings` | runtime | learning candidate記録と昇格候補化 |
| `retro` | `product-recipe-retro` | recipe | 振り返り、改善候補抽出 |
| `health` | `product-runtime-health` | runtime | quality dashboard |
| `document-release` | `product-flow-docrelease`, `product-role-docengineer` | flow/role | docs/changelog/release note |
| `devex-review` | `product-flow-devexreview` | flow | 単体DX review入口 |
| `design-review` | `product-flow-designreview` | flow | 実装/画面に対するdesign review |
| `design-consultation` | `product-flow-designconsult` | flow | design相談 |
| `design-html` | `product-flow-designhtml` | flow | HTML artifact / design preview |
| `design-shotgun` | `product-flow-designshotgun` | flow | 複数案生成と比較 |
| `make-pdf` | `product-source-pdf` | source | PDF generation |
| `landing-report` | `product-flow-landingreport` | flow | LP/launch report |
| `pair-agent` | `product-browser-pairagent` | browser | remote/browser pairing、scoped token |
| `setup-deploy` | `product-source-deploy` | source | deploy環境初期化 |
| `setup-gbrain` | `product-runtime-knowledge` | runtime | knowledge/index setup相当 |
| `gstack-upgrade` | `product-runtime-upgrade` | runtime | stack update / migration |

## 4. 実装ステージ

### Stage 0: 文書とinventoryを固定

成果物:

```text
ARCHTECTURE.md
PLAN.md
docs/gstack-to-product-mapping.md
README.md
docs/release-acceptance-scenarios.md
```

作業:

```text
・gstack cloneからSKILL.md一覧を生成する
・対応表をdocsへ分離する
・APM source/deploy/runtime境界をdocsに固定する
・旧gstack名を外部interfaceとして使わない方針を明文化する
```

完了条件:

古い方針、壊れた脚注、旧gstackのruntime pathが本文に残っていないこと。

### Stage 1: APM package skeleton

成果物:

```text
apm.yml
SKILL.md
.apm/instructions/
.apm/skills/
.apm/prompts/
.apm/agents/
.apm/hooks/
scripts/apm-installed-skills-sync.ts
scripts/apm-source-skills-verify.ts
scripts/gstack-skill-mapping-verify.ts
```

作業:

```text
・`product-*` namespaceの空skillを全件作る
・root SKILL.mdにroutingを入れる
・共通preamble/status/evidence/storageをinstructionsへ分離する
・host別にSKILL.mdを生成できるtemplate pipelineを用意する
・APM targetは claude/codex/cursor/copilot を初期対象にする
```

完了条件:

```bash
apm install --dry-run --target claude,codex,cursor,copilot
apm compile --target claude,codex,cursor,copilot
bun run scripts/apm-source-skills-verify.ts
```

### Stage 2: Browser runtime parity

成果物:

```text
browser/src/cli.ts
browser/src/server.ts
browser/src/commands.ts
browser/src/browser-manager.ts
browser/src/browse-client.ts
browser/src/token-registry.ts
browser/src/skill-token.ts
browser/src/content-security.ts
browser/src/cdp-allowlist.ts
browser/src/browser-skills.ts
browser/src/browser-skill-commands.ts
```

作業:

```text
・Bun daemonを実装する
・`.product/browser/browse.json` にport/token/versionを書く
・stale daemon検出とversion mismatch restartを入れる
・read/write/meta/admin/control scopeを実装する
・snapshot/screenshot/console/network/goto/click/fillを最初に入れる
・CDPはdeny-default allowlistにする
・untrusted page contentをenvelope化する
・browser skill実行時にper-spawn scoped tokenを渡す
・cookie importはStage 2ではUI/flowだけ用意し、実操作はguard付きにする
```

完了条件:

```bash
product-browser status --json
product-browser open https://example.com --mode safe --json
product-browser snapshot --json
bun test tests/browser
```

### Stage 3: Core workflows

対象:

```text
product-recipe-discovery
product-recipe-autoplan
product-flow-ceoreview
product-flow-designreview
product-flow-engreview
product-flow-devexreview
product-recipe-investigate
```

作業:

```text
・office-hoursのsix forcing questionsを移植する
・autoplanはplan file restore pointを作る
・UI scopeならdesign review、DX scopeならdevex reviewを条件実行する
・各reviewはplanを直接書き換える前にfindings/decision logを残す
・hard gateとして、discovery/review skillは実装しない
```

完了条件:

```bash
bun test tests/golden-paths/discovery.test.ts
bun test tests/golden-paths/autoplan.test.ts
bun test tests/routing
```

### Stage 4: Review, QA, Ship

対象:

```text
product-flow-codereview
product-flow-securityreview
product-recipe-qa
product-flow-qareport
product-recipe-ship
product-recipe-landdeploy
product-browser-canary
product-browser-benchmark
```

作業:

```text
・reviewはbase branch検出、diff、risk taxonomy、fix-first policyを実装する
・qaはquick/standard/exhaustive tierを持つ
・before/after screenshot、console/network、regression testを残す
・shipはtest/coverage/docs/CHANGELOG/PR作成まで段階化する
・deploy/merge/publishは明示承認必須にする
```

完了条件:

```bash
bun test tests/golden-paths/review.test.ts
bun test tests/golden-paths/qa.test.ts
bun test tests/golden-paths/ship.test.ts
bun test tests/guards
```

### Stage 5: Remaining parity

対象:

```text
design-consultation
design-html
design-shotgun
devex-review
document-release
landing-report
make-pdf
pair-agent
scrape
skillify
setup-deploy
setup-gbrain
benchmark-models
gstack-upgrade
health
learn
retro
context-save
context-restore
```

作業:

```text
・各gstack skillのREADME/SKILL.md相当のbehaviorをproduct名で再実装する
・browser skill生成はcandidate→review→`.apm/skills/` promotionへ統一する
・Codex/model benchmarkは未導入時にdegradeする
・PDF/design/pair-agentは独立testを追加する
```

完了条件:

```bash
bun run scripts/gstack-skill-mapping-verify.ts
bun test tests/parity
apm pack --dry-run
apm audit
```

## 5. Browser Skill Promotion

生成browser skillの扱いは以下に固定します。

```text
1. `product-flow-skillify` または `product-browser-scrape` がcandidateを生成
2. candidateを `.product/browser-skill-candidates/<name>/` に保存
3. testを書ける状態に整える
4. reviewで採用判断
5. `.apm/skills/product-browser-<name>/` へ移す
6. `script.test.ts` を追加
7. `apm install --dry-run` と browser tests を通す
8. version/tagを切る
9. consumer repoが `apm deps update` で取り込む
```

禁止:

```text
・旧gstack相当のmachine-wide browser-skill global層を共有標準にする
・生成skillをreviewなしに`.apm/`へ入れる
・root tokenをbrowser skillへ渡す
・cookie、header、token、screenshotをredactionなしで保存する
```

## 6. Test Plan

### Static checks

```bash
bun run scripts/apm-source-skills-verify.ts
bun run scripts/gstack-skill-mapping-verify.ts
rg "gstack|\\.gstack" .apm SKILL.md README.md
```

`gstack` 文字列は対応表、移行説明、参照リンク以外に残さないこと。

### APM checks

```bash
apm install --dry-run --target claude,codex,cursor,copilot
apm compile --target claude,codex,cursor,copilot
apm pack --dry-run
apm deps tree
apm audit
```

### Browser checks

```bash
bun test tests/browser
product-browser doctor --json
product-browser open https://example.com --mode safe --json
product-browser snapshot --json
product-browser screenshot --json
```

### Golden workflows

```bash
bun test tests/golden-paths/discovery.test.ts
bun test tests/golden-paths/autoplan.test.ts
bun test tests/golden-paths/review.test.ts
bun test tests/golden-paths/qa.test.ts
bun test tests/golden-paths/ship.test.ts
```

## 7. Acceptance Criteria

```text
・gstackの45 SKILL.mdに対応するproduct側skillまたは明示的な統合先がある
・browserはBun daemonとして動く
・`.apm/` sourceとdeploy outputの責務が混ざっていない
・`.product/` はgit管理されない
・browser skill共有はAPM promotionで行う
・consumer repoはAPM dependencyとして取り込める
・Codex/browser/cookie/deployなどoptional能力は未設定時に壊れずdegradeする
・review/QA/ship workflowは証拠、判断、artifact、次工程へのhandoffを残す
```

## 8. References

- gstack repository: https://github.com/garrytan/gstack
- APM manifest schema: https://microsoft.github.io/apm/reference/manifest-schema/
- APM package anatomy: https://microsoft.github.io/apm/introduction/anatomy-of-an-apm-package/
- APM skills guide: https://microsoft.github.io/apm/guides/skills/
- APM dependencies guide: https://microsoft.github.io/apm/guides/dependencies/
- APM pack and distribute: https://microsoft.github.io/apm/guides/pack-distribute/
