# Source Map

このスキル作成時に参照した主要出典。スキル本文は、これらの出典の考え方を、UX/体験設計とプロダクト構築ハンドオフ向けに再構成したものである。

---

## Agent Skills / SKILL.md形式

1. OpenAI Developers: Skills
   - URL: https://developers.openai.com/api/docs/guides/tools-skills
   - 参照点: Skillはversioned bundle + SKILL.md manifestであり、front matter + instructionsで構成される。Skillsはプロセスや規約をモジュール化するために使える。

2. OpenAI Developers: Agent Skills – Codex
   - URL: https://developers.openai.com/codex/skills
   - 参照点: SkillはSKILL.md、scripts、references、assetsを持つディレクトリとして構成できる。nameとdescriptionは必須。Codexはname/description/pathからskillを選び、必要時にSKILL.md全文を読む。

3. Agent Skills Specification
   - URL: https://agentskills.io/specification
   - 参照点: SKILL.mdのYAML frontmatter、name/description制約、optional directories、progressive disclosure、reference filesの扱い。

4. Agent Skills Best Practices
   - URL: https://agentskills.io/skill-creation/best-practices
   - 参照点: 実務知識に基づくskill作成、progressive disclosure、procedure重視、checklists、validation loops、output templates。

5. Anthropic Engineering: Equipping agents for the real world with Agent Skills
   - URL: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
   - 参照点: Skillsはinstructions/scripts/resourcesをフォルダとしてパッケージ化し、progressive disclosureで必要な情報だけを読む。

---

## Goal-Directed Design / UX Design

1. About Face excerpt: Goal-Directed Design
   - URL: https://catalogimages.wiley.com/images/db/pdf/0764526413.ch01.pdf
   - 参照点: GDDはethnography、stakeholder interviews、market research、product/literature reviews、user models、scenario-based design、interaction principles/patternsを組み合わせる。Research、Modeling、Requirements Definition、Framework Definition、Refinementのフェーズを持つ。

2. About Face chapter excerpt: Persona-based scenarios and requirements
   - URL: https://athena.ecs.csus.edu/~buckley/CSc238/About_Face_Ch4.pdf
   - 参照点: context scenario、key path scenario、validation scenario、requirementsはfeatures/specificationsではないこと、problem statementとvision statement。

3. Hugh Dubberly: Alan Cooper and the Goal Directed Design Process
   - URL: https://www.dubberly.com/articles/alan-cooper-and-the-goal-directed-design-process.html
   - 参照点: design first / program second、ユーザーとゴールの明示、goals are not tasks、ペルソナとシナリオの関係。

4. Alan Cooper: Defending Personas
   - URL: https://mralancooper.medium.com/defending-personas-2657fe26dd0f
   - 参照点: field researchに基づくペルソナ合成、機能正当化のための捏造ペルソナ批判。

5. Robert Reimann: Personas, Goals, and Emotional Design
   - URL: https://www.uxmatters.com/mt/archives/2005/11/personas-goals-and-emotional-design.php
   - 参照点: experience goals、end goals、life goals、context scenariosがtouch-points、mental models、attitudesを照らすこと。

6. Nielsen Norman Group: Personas vs. Jobs-to-Be-Done
   - URL: https://www.nngroup.com/articles/personas-jobs-be-done/
   - 参照点: 良いペルソナはdemographicsだけでなく、behavioral、attitudinal、mental-model dataを含む。

7. Flylib About Face excerpt: Persona types and Sony P@ssport example
   - URL: https://flylib.com/books/en/2.151.1.93/3/
   - 参照点: primary、secondary、supplemental、served、negative personaの区分、primary personaによる設計優先順位。

---

## このスキルでの拡張点

次は、上記出典を現代のAIエージェントおよびプロダクト構築用に拡張した運用規約である。

- `V/P/H` 証拠レベル。
- `Full / Assisted / Provisional` 実行モード。
- コーディングエージェント用のBuild Handoff形式。
- API/Data Requirements、Telemetry、Accessibility、State Modelの必須化。
- `Evidence → Persona → Goal → Scenario → Requirement → Design Element → Implementation Task` のtraceability chain。
- 省略版プロトコル。
