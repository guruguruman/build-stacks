# Goal-Directed UX Design Method Reference

この参照ファイルは、スキル本文の背景となるGDDの理論、用語、処理順序をまとめる。AIエージェントは、GDDの考え方を忘れた場合、またはチームに説明する必要がある場合に読む。

---

## 1. 定義

Goal-Directed Designは、ユーザーが達成したい「ゴール」を中心に、製品やサービスの振る舞いを設計する方法である。機能一覧や実装都合から始めず、ユーザーの行動、動機、文脈、制約、成功条件を調査し、それをペルソナ、シナリオ、要件、UXフレームワーク、詳細仕様、実装支援へ変換する。

このスキルでは、GDDをUX/体験設計に特化して扱う。対象は、単一画面だけでなく、プロダクト全体、業務フロー、オンボーディング、サービス接点、AIエージェント体験、実装ハンドオフまで含む。

---

## 2. GDDが解く問題

GDDが避けるべき典型的な失敗は次である。

1. 機能の寄せ集めになり、体験の一貫性がない。
2. 声の大きいステークホルダーの要望が優先される。
3. 開発者、PM、デザイナーが自分自身をユーザーとして投影する。
4. ユーザーの本当の成功条件ではなく、現行作業の表面的な手順だけを再現する。
5. 要件がUI部品や実装タスクに早く落ちすぎる。
6. 例外系や運用制約が後回しになり、実プロダクトで破綻する。

GDDは、ユーザーゴールを判断基準にすることで、設計、要件、実装、検証を同じ軸でつなげる。

---

## 3. ゴールの三層

GDDでは、ゴールを次の三層で扱う。

### 3.1 Experience Goals

ユーザーが利用中にどう感じたいか。

例:
- 安心したい。
- 自分で制御できていると感じたい。
- 迷いたくない。
- 面倒な作業を短く済ませたい。
- 誤操作しても回復できると感じたい。

UX設計では、コピー、フィードバック、視覚階層、遷移速度、エラー処理、確認タイミングに影響する。

### 3.2 End Goals

ユーザーが最終的に何を達成したいか。

例:
- 月次締めを期限内に完了する。
- 顧客に正しい見積を提示する。
- 自分に合う商品を迷わず選ぶ。
- 異常を見逃さず検知する。

要件、主要フロー、情報設計、機能優先順位に影響する。

### 3.3 Life Goals

ユーザーがどんな自分でありたいか、または長期的にどんな価値を得たいか。

例:
- 信頼される担当者でありたい。
- 専門家として有能だと思われたい。
- 家族を安心させたい。
- 自分らしく選択したい。

ブランド、継続利用、コミュニティ、自己表現、長期関係性に影響する。

---

## 4. GDDの標準フェーズ

このスキルでは、GDDを次の8フェーズとして運用する。原典のResearch、Modeling、Requirements Definition、Framework Definition、Refinement、Supportを、現代のプロダクト構築向けに拡張している。

### 4.1 Intake / Scope

依頼を機能要求からUX設計課題へ変換する。ここで重要なのは、作るものではなく、解くべきユーザーゴールと事業影響を明確にすることである。

成果物:
- Discovery Brief
- Problem Statement
- Vision Statement
- Non-goals
- Gap List
- Execution Mode

### 4.2 Research Plan and Evidence Collection

ユーザー、業務、事業、技術、制約の情報を集める。観察とコンテクスチュアルインタビューを重視する。ステークホルダー面談、開発者面談、SME面談、競合監査、ログ分析、サポート問い合わせ分析も補助的に使う。

成果物:
- Research Plan
- Interview Guide
- Observation Checklist
- Evidence Log
- Audit Summary

### 4.3 Modeling

証拠から行動変数を抽出し、ペルソナ、primary persona、ドメインモデルを作る。

成果物:
- Behavior Variable Matrix
- Persona Set
- Persona Priority Rationale
- Domain Model

### 4.4 Scenario and Requirements Definition

ペルソナがゴールを達成する文脈をシナリオとして書き、そこから要件を抽出する。要件は機能名ではなく、ユーザーがゴール達成に必要とする能力として書く。

成果物:
- Context Scenarios
- Key Path Scenarios
- Validation Scenarios
- Requirements Pack
- Traceability Matrix

### 4.5 UX Framework Definition

プロダクトの骨格を設計する。概念モデル、情報設計、主要オブジェクト、ナビゲーション、主要フロー、サービス接点を定義する。

成果物:
- Conceptual Model
- Information Architecture
- Navigation Model
- Flow Overview
- Service Blueprint
- Interaction Framework

### 4.6 Refinement

骨格を詳細仕様へ落とす。状態、エラー、空状態、権限不足、部分成功、フォーム、コピー、アクセシビリティ、通知、計測を定義する。

成果物:
- Detailed UX Spec
- State Model
- Content/Copy Spec
- Accessibility Notes
- Analytics Plan

### 4.7 Build Support / Handoff

コーディングエージェントや開発チームが実装できる単位へ分解する。要件IDと実装タスクを紐づけ、acceptance criteriaを定義する。

成果物:
- Implementation Task List
- API/Data Requirements
- Test Plan
- Acceptance Criteria
- Change Log

### 4.8 Validation and Iteration

シナリオウォークスルー、ユーザーテスト、定量メトリクス、ログ分析で検証し、仮説を更新する。

成果物:
- Validation Report
- Revised Personas
- Revised Requirements
- Residual Risk List

---

## 5. ペルソナ種別

### Primary Persona

設計の主対象。主導線と優先順位はこのペルソナを中心に決める。primary personaを満たさない設計は失敗とみなす。

### Secondary Persona

primary personaとは異なる追加ニーズを持つが、primary向け設計を壊さずに支援できる対象。

### Supplemental Persona

primaryとsecondaryで十分にカバーされるため、個別最適化しない対象。

### Served Persona

直接操作しないが、体験の結果に影響を受ける対象。例: 管理者が入力した情報を見る顧客。

### Negative Persona

あえて最適化しない対象。スコープ膨張を防ぐために定義する。

---

## 6. シナリオ種別

### Context Scenario

ペルソナがどの文脈で、何を達成したくて、製品とどう関わるかを描く。画面内操作ではなく、発端、環境、制約、感情、成功条件を書く。

### Key Path Scenario

主要ゴールを最も自然に達成する代表的な流れ。UXフレームワークと詳細仕様の中心となる。

### Validation Scenario

例外、境界条件、失敗、権限不足、データ欠落、ネットワーク不安定、複数ユーザー衝突などを検証するためのシナリオ。

---

## 7. 要件の分類

- `functional`: ユーザーができる必要のある行為やシステム支援。
- `data`: 必要なデータ、データ構造、保存、取得、履歴、監査。
- `content`: 文言、ラベル、説明、ヘルプ、通知。
- `interaction`: 入力、出力、操作、フィードバック、状態遷移。
- `constraint`: 法務、セキュリティ、権限、技術、運用、アクセシビリティ。
- `measurement`: 成功指標、イベント計測、ログ、分析観点。

---

## 8. GDDの完成条件

GDDの成果物は、次を満たす必要がある。

1. 誰のための設計かが明確。
2. その人の達成ゴールと経験ゴールが明確。
3. ゴール達成の文脈がシナリオとして描かれている。
4. 要件がシナリオから抽出されている。
5. UXフレームワークが要件を支える。
6. 詳細仕様が状態と例外を含む。
7. 実装タスクが要件に紐づいている。
8. 検証計画がある。
9. 証拠と仮説が区別されている。

---

## 9. 参照出典

詳細な出典は `references/source-map.md` を参照する。
