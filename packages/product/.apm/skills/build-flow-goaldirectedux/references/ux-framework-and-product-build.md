# UX Framework and Product Build Handoff Guide

このファイルは、GDDで定義したペルソナ、ゴール、シナリオ、要件を、UXフレームワーク、詳細仕様、実装タスクへ変換する手順を定義する。

---

## 1. UXフレームワークの目的

UXフレームワークは、画面の見た目ではなく、プロダクト全体の「骨格」である。ここでは、ユーザーがゴールへ向かうために、どんな概念、情報、導線、状態、接点が必要かを定義する。

先にフレームワークを作る理由:
- 画面単位の局所最適を防ぐ。
- 情報設計、状態管理、権限、例外処理を一貫させる。
- 実装タスクを意味のある単位に分解できる。
- primary personaの主導線を守れる。

---

## 2. UXフレームワーク作成手順

### 2.1 Conceptual Model

ユーザーが理解すべき主要概念を定義する。

確認すること:
- ユーザーが中心に扱う主オブジェクトは何か。
- オブジェクト同士の関係は何か。
- ユーザーの語彙では何と呼ばれているか。
- システム内部の概念とユーザーの概念がズレていないか。
- どの概念を隠し、どの概念を見せるべきか。

成果物例:

```yaml
conceptual_model:
  primary_objects:
    - name: Invoice
      user_term: 請求書
      description: 請求処理の基本単位
  relationships:
    - Invoice belongs_to Customer
    - Invoice has_many ExportJobs
  hidden_system_concepts:
    - internal_job_id
  user_visible_concepts:
    - 請求書
    - 対象期間
    - 出力履歴
```

### 2.2 Information Architecture

ユーザーの判断順に情報を構造化する。

確認すること:
- 最初に見るべき情報は何か。
- 次に判断する情報は何か。
- 詳細はいつ開くべきか。
- 例外や警告はどこで見せるべきか。
- 初心者と熟練者で表示密度をどう調整するか。
- 検索、フィルタ、並び替え、保存条件は必要か。

### 2.3 Navigation Model

ユーザーが迷わず現在地と次行動を理解できる導線を作る。

確認すること:
- 主導線は何か。
- 分岐はどこで起きるか。
- 途中離脱後に戻れるか。
- 同じ条件で再実行できるか。
- 戻る、キャンセル、保存、下書き、再試行の扱いは明確か。

### 2.4 Flow Overview

key path scenarioをフローへ変換する。

最低限含める状態:
- entry。
- selection。
- review。
- action。
- confirmation。
- result。
- recovery。

### 2.5 Service Blueprint

画面外の人、業務、通知、バックグラウンド処理、サポートが関わる場合に作る。

含めること:
- frontstage: ユーザーが見る接点。
- backstage: システム、運用担当、承認者、外部サービス。
- support process: バッチ、通知、監査ログ、エスカレーション。
- failure recovery: 失敗時に誰が何をするか。

---

## 3. 詳細UX仕様

### 3.1 画面仕様

各画面または接点ごとに次を書く。

```yaml
screen:
  id: D1
  name: ""
  supported_persona: P1
  supported_scenarios:
    - S1
  supported_requirements:
    - R1
  user_goal: ""
  primary_user_question: "この画面でユーザーが答えたい問い"
  information_priority:
    - priority: 1
      item: ""
      reason: ""
  main_actions:
    - action: ""
      requirement_id: R1
  secondary_actions:
    - action: ""
  states:
    - default
    - empty
    - loading
    - success
    - error
    - partial_success
    - permission_denied
  accessibility:
    - ""
  telemetry:
    - ""
```

### 3.2 状態設計

すべての主要接点で、次の状態を検討する。

- default: 通常表示。
- empty: データがない。
- loading: 読み込み中。
- success: 成功。
- error: 失敗。
- partial success: 一部成功。
- validation error: 入力不備。
- permission denied: 権限不足。
- conflict: 同時編集や状態衝突。
- offline/network failure: ネットワーク問題。
- expired: セッション、リンク、期限切れ。
- cancelled: 取り消し。
- retrying: 再試行中。

各状態で定義すること:
- ユーザーに何が起きたと伝えるか。
- 次に何ができるか。
- 原因をどこまで出すか。
- ユーザーが回復できるか。
- ログや監査が必要か。
- サポート導線が必要か。

### 3.3 フォーム設計

入力フォームでは、次を定義する。

- 入力の目的。
- 必須/任意。
- デフォルト値。
- 入力制約。
- 入力例。
- バリデーションタイミング。
- エラー文言。
- 保存、下書き、破棄。
- 自動補完、自動計算、自動整形。
- ユーザーが確認すべき値。
- 監査ログが必要な項目。

### 3.4 コピー設計

コピーは、経験ゴールを支える設計要素として扱う。

原則:
- ユーザー語彙を使う。
- システム内部語を出さない。
- 何が起きたか、なぜ起きたか、次に何をすればよいかを書く。
- エラーでユーザーを責めない。
- 不可逆操作は明確に警告する。
- 成功時は、完了した事実と次にできることを示す。

エラー文言テンプレート:

```text
[何が起きたか]。[原因または条件]。[次にできること]。
```

例:
「3件の請求書を出力できませんでした。取消済みの請求書が含まれています。除外して再出力するか、対象条件を変更してください。」

### 3.5 アクセシビリティ

最低限、次を定義する。

- キーボード操作。
- フォーカス順。
- スクリーンリーダー用ラベル。
- エラーと入力項目の関連付け。
- 色だけに依存しない状態表現。
- 十分なコントラスト。
- モーション低減。
- タッチターゲット。
- 読み上げ順。
- 時間制限がある場合の延長や警告。

---

## 4. 実装ハンドオフ

### 4.1 実装タスク分解

実装タスクは、要件IDに紐づける。

```yaml
implementation_task:
  id: T1
  title: ""
  requirement_ids:
    - R1
  design_element_ids:
    - D1
  description: ""
  frontend:
    - ""
  backend:
    - ""
  data:
    - ""
  api:
    - ""
  states:
    - ""
  accessibility:
    - ""
  telemetry:
    - ""
  tests:
    - ""
  acceptance_criteria:
    - ""
```

### 4.2 API/Data Requirements

UI実装前に、必要なデータを定義する。

確認すること:
- 表示に必要なデータ。
- 判断に必要なデータ。
- アクション実行に必要なデータ。
- 履歴、監査、権限に必要なデータ。
- キャッシュ可否。
- 更新頻度。
- 一貫性要件。
- 個人情報や機密情報の扱い。

API仕様に最低限含めること:

```yaml
api_requirement:
  id: API1
  supports_requirement: R1
  endpoint_or_capability: ""
  request:
    fields:
      - ""
  response:
    fields:
      - ""
  errors:
    - code: ""
      user_message: ""
      recovery: ""
  permissions:
    - ""
  audit_log:
    required: true | false
    fields:
      - ""
```

### 4.3 Acceptance Criteria

acceptance criteriaは、ユーザーゴールとシナリオに基づいてテスト可能に書く。

悪い例:
- 「CSV出力ができる」

良い例:
- 「P1が対象期間と状態を指定すると、出力前に対象件数、除外件数、除外理由を確認できる」
- 「出力ジョブが失敗した場合、原因、再試行可否、サポートに伝えるIDが表示される」
- 「同一条件の再出力では、前回条件が復元され、差分がある場合は警告される」

### 4.4 テスト観点

最低限、次をテストする。

- key path scenario。
- validation scenario。
- 権限別表示。
- 0件、1件、大量件数。
- API遅延、API失敗。
- 部分成功。
- 入力不備。
- 取り消し、再試行、戻る。
- アクセシビリティ。
- イベント計測。
- 監査ログ。

### 4.5 Telemetry / Measurement

体験改善のために、計測点を定義する。

例:
- フロー開始。
- 条件変更。
- 確認画面到達。
- 主要アクション実行。
- 成功。
- 失敗。
- 再試行。
- 離脱。
- エラー種別。
- 処理時間。
- サポート導線クリック。

各イベントに紐づけること:
- 対応するゴール。
- 対応する要件。
- 成功/失敗判定。
- 個人情報を含まないプロパティ。

---

## 5. Design Decision Log

設計変更やトレードオフは記録する。

```yaml
design_decision:
  id: DD1
  date: "YYYY-MM-DD"
  decision: ""
  reason: ""
  affected_personas:
    - P1
  affected_requirements:
    - R1
  alternatives_considered:
    - ""
  tradeoffs:
    - ""
  evidence:
    - E001
  status: proposed | accepted | rejected | superseded
```

---

## 6. 完了判定

次を満たせば、実装または検証に進める。

- UXフレームワークがprimary personaのkey pathを支えている。
- 詳細仕様に状態と例外が含まれる。
- API/データ要件が明確。
- 実装タスクが要件に紐づく。
- acceptance criteriaがテスト可能。
- アクセシビリティと計測が含まれる。
- 変更ログがある。
