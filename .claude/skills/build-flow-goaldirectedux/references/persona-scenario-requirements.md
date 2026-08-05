# Persona, Scenario, and Requirements Guide

このファイルは、調査結果をペルソナ、シナリオ、要件へ変換する手順を定義する。

---

## 1. モデリングの目的

モデリングの目的は、調査メモを読みやすくまとめることではない。設計判断に使える構造へ変換することである。

変換の流れ:

`Evidence → Behavior Variables → Personas → Goals → Scenarios → Requirements`

---

## 2. ペルソナ作成手順

### 2.1 行動変数を並べる

調査対象者を、行動変数ごとに位置づける。

例:

| User | 速度優先 | 確実性優先 | 自動化信頼 | 手動確認 | 他者確認多い | 例外優先 |
|---|---:|---:|---:|---:|---:|---:|
| U1 | 2 | 5 | 1 | 5 | 4 | 5 |
| U2 | 5 | 2 | 4 | 2 | 1 | 2 |

数字は厳密な統計値ではなく、パターン把握の補助として使う。

### 2.2 クラスターを探す

似た行動変数のまとまりを探す。

分けるべき差:
- ゴールが違う。
- 成功条件が違う。
- 情報探索方法が違う。
- 例外処理への関心が違う。
- 自動化への信頼度が違う。
- 操作熟練度が設計に影響するほど違う。
- 権限や責任が違う。

分けるべきでない差:
- 年齢だけが違う。
- 役職名だけが違う。
- 所属部署だけが違う。
- 見た目のプロフィールだけが違う。

### 2.3 ペルソナを合成する

ペルソナは平均値ではない。設計判断に使えるよう、行動、ゴール、文脈が明確な代表類型として合成する。

必要項目:
- ID。
- status: validated / provisional。
- type: primary / secondary / supplemental / served / negative。
- 一行要約。
- 役割と責任。
- 利用文脈。
- experience goals。
- end goals。
- life goalsが必要な場合。
- 代表行動。
- メンタルモデル。
- 使用道具。
- 環境。
- 制約。
- 痛点。
- 成功条件。
- 証拠。

### 2.4 Primary Personaを選ぶ

次の観点で選ぶ。

1. この人を満たさないとプロダクトが成立しないか。
2. この人のゴールが最も重要な事業成果に直結するか。
3. この人の設計要件が他ペルソナを大きく包含するか。
4. この人の失敗コストが高いか。
5. この人の利用頻度または利用重要度が高いか。
6. この人を中心にすれば、secondary personaも大きく損なわず支援できるか。

ゴールが衝突するprimaryが複数ある場合は、1つのUIに押し込まず、別画面、別モード、別サービス接点を検討する。

---

## 3. ペルソナテンプレート

```yaml
persona:
  id: P1
  status: validated | provisional
  type: primary | secondary | supplemental | served | negative
  name: ""
  one_line_summary: ""
  role_and_responsibility: ""
  usage_context: ""
  experience_goals:
    - ""
  end_goals:
    - ""
  life_goals:
    - ""
  behaviors:
    - ""
  mental_models:
    - ""
  tools_and_artifacts:
    - ""
  environment:
    - ""
  skills_and_capabilities:
    - ""
  constraints:
    - ""
  key_pains:
    - ""
  success_definition:
    - ""
  evidence:
    - source_id: E001
      level: V | P | H
      summary: ""
```

---

## 4. シナリオ作成手順

### 4.1 Context Scenario

Context Scenarioは、画面やクリック列ではなく、利用文脈の物語として書く。

含めること:
- 発端。
- 利用前の状態。
- 場所、デバイス、時間、周囲の状況。
- ペルソナの達成ゴール。
- ペルソナの経験ゴール。
- 制約。
- 判断材料。
- システムに期待する支援。
- 成功した状態。

悪い例:
「ユーザーは一覧画面を開き、フィルタをクリックし、CSV出力ボタンを押す。」

良い例:
「月末最終日の夕方、経理担当者は未処理請求を確認しながら、対象期間の請求書データを会計事務所へ渡したい。差戻しや取消が混ざるため、出力前に何が含まれ、何が除外されたかを確認できないと不安が残る。」

### 4.2 Key Path Scenario

主要ゴールを自然に達成する標準的な流れを書く。

含めること:
- 開始条件。
- 主要な判断。
- システムからのフィードバック。
- ユーザーが迷わず進める理由。
- 完了条件。

### 4.3 Validation Scenario

例外や境界条件を書く。

典型例:
- データが0件。
- 必須データが欠落。
- 権限不足。
- API失敗。
- ネットワーク遅延。
- 一部だけ成功。
- 同時編集衝突。
- 期限切れ。
- 入力値が業務ルールに反する。
- 取り消し、やり直し、再試行が必要。
- 監査ログが必要。

---

## 5. シナリオテンプレート

```yaml
scenario:
  id: S1
  type: context | key_path | validation
  status: validated | provisional
  persona_id: P1
  trigger: ""
  preconditions:
    - ""
  desired_outcome: ""
  experience_goal_supported: ""
  narrative: ""
  required_information:
    - ""
  required_system_support:
    - ""
  alternate_conditions:
    - ""
  success_criteria:
    - ""
  evidence:
    - source_id: E001
      level: V | P | H
```

---

## 6. 要件抽出手順

シナリオから要件を抽出する。次の質問を各段落に適用する。

1. ユーザーは何を達成したいか。
2. そのために何を知る必要があるか。
3. 何を判断する必要があるか。
4. どの判断をシステムが肩代わりできるか。
5. 何を記録、保存、再利用する必要があるか。
6. どんな失敗や例外があり得るか。
7. 成功したとユーザーが分かるには何が必要か。
8. 事業、法務、技術、運用の制約は何か。

### 6.1 要件の書き方

悪い要件:
- 「CSVボタンを置く」
- 「一覧にカードを出す」
- 「確認モーダルを作る」

良い要件:
- 「ユーザーが対象期間と状態条件を確認してから出力できること」
- 「出力対象件数と除外理由を事前に把握できること」
- 「同じ条件で再実行できること」
- 「処理失敗時に原因と再試行可否が分かること」

### 6.2 要件テンプレート

```yaml
requirement:
  id: R1
  status: validated | provisional
  statement: ""
  category: functional | data | content | interaction | constraint | measurement
  source_persona: P1
  source_goal: ""
  goal_type: experience | end | life
  source_scenarios:
    - S1
  evidence:
    - source_id: E001
      level: V | P | H
  business_rationale: ""
  technical_constraints:
    - ""
  priority: must | should | could | wont
  acceptance_criteria:
    - ""
  non_goals:
    - ""
```

---

## 7. Traceability Matrix

すべての重要要件は、次の行列に入れる。

| Evidence | Persona | Goal | Scenario | Requirement | Design Element | Implementation Task |
|---|---|---|---|---|---|---|
| E001 | P1 | G1 | S1 | R1 | D1 | T1 |

この表に入らない機能は、原則として実装しない。実装する場合は、別途理由をDesign Decision Logに残す。

---

## 8. 要件優先順位

優先順位は「声の大きさ」ではなく、次の基準で決める。

1. primary personaのend goalに必須か。
2. experience goalを大きく損なう問題を防ぐか。
3. 失敗コストが高いか。
4. 利用頻度が高いか。
5. 事業KPIに効くか。
6. 技術的に先に作らないと後続が成立しないか。
7. リスクを早期検証できるか。

---

## 9. 非目標の定義

非目標を必ず定義する。非目標は、スコープ膨張を防ぐための設計資産である。

例:
- 今回は管理者向け一括編集を扱わない。
- 今回は分析用の自由集計を作らない。
- 今回はモバイル最適化を対象外とする。
- 今回は外部会計システムへの自動連携ではなく、手動出力までとする。

---

## 10. 完了判定

次を満たせば、UXフレームワーク定義へ進める。

- primary personaが決まっている。
- 主要ゴールがexperience/endの両方で定義されている。
- context scenarioがある。
- key path scenarioがある。
- validation scenarioがある。
- 要件がシナリオから抽出されている。
- 非目標がある。
- traceability matrixの初版がある。
