const baseSkills = [
    { name: "build-recipe-discovery", layer: "recipe", summary: "Shape ambiguous product requests into a design doc using forcing questions.", status: "shipped" },
    { name: "build-recipe-autoplan", layer: "recipe", summary: "Create and harden implementation plans through founder, design, engineering, and DX review.", status: "shipped" },
    { name: "build-role-founder", layer: "role", summary: "Founder and CEO-style review for wedge, adoption friction, MVP, and first payment reason.", status: "shipped" },
    { name: "build-role-designer", layer: "role", summary: "Product design review for UX plans, visual artifacts, flows, and honest browser status.", status: "shipped" },
    { name: "build-role-engmanager", layer: "role", summary: "Engineering manager review for sequencing, risk, maintainability, and scope control.", status: "shipped" },
    { name: "build-role-dxlead", layer: "role", summary: "Developer experience review for APIs, onboarding, docs, and adoption friction.", status: "shipped" },
    { name: "build-flow-plantune", layer: "flow", summary: "Tune plan scope, ordering, omissions, and handoffs.", status: "shipped" },
    { name: "build-role-staffengineer", layer: "role", summary: "Staff-level code review for diffs, architecture, correctness, migrations, and tests.", status: "shipped" },
    { name: "build-recipe-qa", layer: "recipe", summary: "Run browser QA, fix issues, and re-verify with evidence.", status: "shipped" },
    { name: "build-browser-qa", layer: "browser", summary: "Browser-centered QA routines and artifact capture.", status: "shipped" },
    { name: "build-flow-qareport", layer: "flow", summary: "Produce QA findings without modifying code.", status: "shipped" },
    { name: "build-recipe-ship", layer: "recipe", summary: "Prepare tests, coverage, docs, changelog, and PR handoff.", status: "shipped" },
    { name: "build-role-releaseengineer", layer: "role", summary: "Release engineering lens for rollout, rollback, and verification.", status: "shipped" },
    { name: "build-recipe-landdeploy", layer: "recipe", summary: "Merge, deploy, and verify production only with explicit approval.", status: "shipped" },
    { name: "build-browser-canary", layer: "browser", summary: "Post-deploy browser canary monitoring.", status: "shipped" },
    { name: "build-browser-benchmark", layer: "browser", summary: "Browser performance benchmark and web vitals evidence.", status: "shipped" },
    { name: "build-internal-modelbenchmark", layer: "internal", summary: "Internal maintainer and eval workflow for comparing model outputs and skill quality.", status: "shipped" },
    { name: "build-browser-runner", layer: "browser", summary: "Official agent-browser policy for safe browser QA.", status: "shipped" },
    { name: "build-browser-visible", layer: "browser", summary: "Open a headed browser session for visual inspection.", status: "shipped" },
    { name: "build-browser-auth", layer: "browser", summary: "Guarded cookie import and authenticated browser setup.", status: "shipped" },
    { name: "build-browser-scrape", layer: "browser", summary: "Extract page content in an untrusted envelope.", status: "shipped" },
    { name: "build-flow-skillify", layer: "flow", summary: "Turn repeated work into reviewed skill candidates.", status: "shipped" },
    { name: "build-flow-pdmscaffold", layer: "flow", summary: "Create a neutral, collision-safe canonical PdM documentation scaffold.", status: "shipped" },
    { name: "build-flow-infradesign", layer: "flow", summary: "Design evidence-backed infrastructure topologies from repository, user, and operational constraints.", status: "shipped" },
    { name: "build-flow-securitygate", layer: "flow", summary: "Run a complete evidence-backed prelaunch security gate with deterministic release verdicts.", status: "shipped" },
    { name: "build-recipe-investigate", layer: "recipe", summary: "Require investigation before risky fixes.", status: "shipped" },
    { name: "build-role-cso", layer: "role", summary: "Security review for threat model, privacy, auth, secrets, policy risk, and blockers.", status: "shipped" },
    { name: "build-guard-destructive", layer: "guard", summary: "Warn and require approval before destructive actions.", status: "shipped" },
    { name: "build-guard-scope", layer: "guard", summary: "Lock edit scope and report drift.", status: "shipped" },
    { name: "build-guard-scope-release", layer: "guard", summary: "Release an active scope lock.", status: "shipped" },
    { name: "build-guard-full", layer: "guard", summary: "Combine destructive, scope, privacy, and browser guards.", status: "shipped" },
    { name: "build-runtime-session", layer: "runtime", summary: "Save and restore session snapshots under .build-stacks.", status: "shipped" },
    { name: "build-runtime-learnings", layer: "runtime", summary: "Record learning candidates for review and promotion.", status: "shipped" },
    { name: "build-runtime-health", layer: "runtime", summary: "Summarize workflow health and quality signals.", status: "shipped" },
    { name: "build-role-docengineer", layer: "role", summary: "Documentation release review for changelog, migration notes, operator docs, and proof.", status: "shipped" },
    { name: "build-flow-designconsult", layer: "flow", summary: "Provide product design consultation.", status: "shipped" },
    { name: "build-flow-webuifinish", layer: "flow", summary: "Score and finish rendered Web UI with real-browser before/after evidence.", status: "shipped" },
    { name: "build-flow-mobileuifinish", layer: "flow", summary: "Score and finish native or cross-platform mobile UI with real-screen evidence.", status: "shipped" },
    { name: "build-flow-goaldirectedux", layer: "flow", summary: "Run Goal-Directed UX Design for personas, scenarios, requirements, and product build handoff.", status: "shipped" },
    { name: "build-flow-designhtml", layer: "flow", summary: "Create HTML artifacts and design previews.", status: "shipped" },
    { name: "build-flow-designshotgun", layer: "flow", summary: "Generate and compare multiple design directions.", status: "shipped" },
    { name: "build-source-pdf", layer: "source", summary: "PDF generation and document source support.", status: "shipped" },
    { name: "build-flow-landingreport", layer: "flow", summary: "Review landing pages and launch readiness.", status: "shipped" },
    { name: "build-browser-pairagent", layer: "browser", summary: "Browser QA handoff packets for pair-agent collaboration.", status: "shipped" },
    { name: "build-source-deploy", layer: "source", summary: "Deployment environment setup source integration.", status: "shipped" },
    { name: "build-runtime-upgrade", layer: "runtime", summary: "Stack update and migration workflow.", status: "shipped" },
    { name: "build-flow-organize-stack", layer: "flow", summary: "Audit APM skill placement and propose safe stack organization changes.", status: "shipped" },
    { name: "build-recipe-research", layer: "recipe", summary: "Research questions against primary sources and capture cited findings.", status: "shipped" },
    { name: "build-flow-domainmodeling", layer: "flow", summary: "Sharpen domain terminology and record durable architectural decisions.", status: "shipped" },
    { name: "build-flow-specwork", layer: "flow", summary: "Turn context into a specification or tracer-bullet ticket set.", status: "shipped" },
    { name: "build-flow-codebasearchitecture", layer: "flow", summary: "Design deep modules and audit codebase architecture for better seams.", status: "shipped" },
    { name: "build-recipe-implement", layer: "recipe", summary: "Implement an approved spec with tight feedback loops and optional TDD.", status: "shipped" },
    { name: "build-recipe-mergeconflicts", layer: "recipe", summary: "Resolve merge and rebase conflicts from the intent of both sides.", status: "shipped" },
    { name: "build-flow-triage", layer: "flow", summary: "Triage GitHub or local issues into verified agent-ready work.", status: "shipped" },
    { name: "build-flow-humanwizard", layer: "flow", summary: "Generate a guarded interactive shell wizard for human-only setup steps.", status: "shipped" }
];

export const buildPackages = [
    { id: "core", name: "build-stacks-core", path: "packages/core", dependencies: [] },
    { id: "browser", name: "build-stacks-browser", path: "packages/browser", dependencies: ["core"] },
    { id: "design", name: "build-stacks-design", path: "packages/design", dependencies: ["browser"] },
    { id: "product", name: "build-stacks-product", path: "packages/product", dependencies: ["design"] },
    { id: "delivery", name: "build-stacks-delivery", path: "packages/delivery", dependencies: ["browser"] },
    { id: "maintainer", name: "build-stacks-maintainer", path: "packages/maintainer", dependencies: ["product", "delivery"] }
];

const packageSkills = {
    core: [
        "build-guard-destructive", "build-guard-scope", "build-guard-scope-release", "build-guard-full",
        "build-runtime-session", "build-runtime-learnings", "build-runtime-health", "build-recipe-investigate",
        "build-recipe-research"
    ],
    browser: [
        "build-browser-auth", "build-browser-benchmark", "build-browser-canary", "build-browser-pairagent",
        "build-browser-qa", "build-browser-runner", "build-browser-scrape", "build-browser-visible"
    ],
    design: [
        "build-role-designer", "build-flow-designconsult", "build-flow-webuifinish",
        "build-flow-mobileuifinish", "build-flow-designhtml", "build-flow-designshotgun"
    ],
    product: [
        "build-recipe-discovery", "build-role-founder", "build-flow-pdmscaffold",
        "build-flow-goaldirectedux", "build-flow-landingreport", "build-flow-domainmodeling",
        "build-flow-specwork"
    ],
    delivery: [
        "build-recipe-qa", "build-recipe-ship", "build-recipe-landdeploy", "build-role-engmanager",
        "build-role-staffengineer", "build-role-releaseengineer", "build-role-cso", "build-role-docengineer",
        "build-flow-plantune", "build-flow-qareport", "build-flow-infradesign", "build-flow-securitygate",
        "build-source-deploy", "build-source-pdf", "build-flow-codebasearchitecture", "build-recipe-implement",
        "build-recipe-mergeconflicts", "build-flow-triage", "build-flow-humanwizard"
    ],
    maintainer: [
        "build-recipe-autoplan", "build-role-dxlead", "build-flow-skillify", "build-internal-modelbenchmark",
        "build-runtime-upgrade", "build-flow-organize-stack"
    ]
};

const relationships = {
    "build-browser-auth": { benefitsFrom: ["build-browser-runner", "build-guard-destructive"], activationExamples: ["build-browser-auth", "browser auth", "authenticated browser", "cookie setup"] },
    "build-browser-benchmark": { benefitsFrom: ["build-browser-runner", "build-browser-canary"], activationExamples: ["build-browser-benchmark", "browser benchmark", "performance evidence", "web vitals"] },
    "build-browser-canary": { benefitsFrom: ["build-browser-runner", "build-role-releaseengineer"], activationExamples: ["build-browser-canary", "browser canary", "post deploy canary", "launch check"] },
    "build-browser-pairagent": { benefitsFrom: ["build-browser-runner", "build-flow-qareport"], activationExamples: ["build-browser-pairagent", "browser pairagent", "pair agent handoff", "browser QA packet", "handoff packet"] },
    "build-browser-qa": { benefitsFrom: ["build-browser-runner", "build-flow-qareport", "build-recipe-qa"], activationExamples: ["build-browser-qa", "browser qa", "browser QA", "test the page", "capture evidence"] },
    "build-browser-runner": { benefitsFrom: ["build-guard-destructive"], activationExamples: ["build-browser-runner", "browser runner", "browser evidence", "open the page", "take a screenshot"] },
    "build-browser-scrape": { benefitsFrom: ["build-browser-runner", "build-role-cso", "build-recipe-qa", "build-flow-skillify"], activationExamples: ["build-browser-scrape", "browser scrape", "scrape page", "public page evidence", "extract content"] },
    "build-browser-visible": { benefitsFrom: ["build-browser-runner", "build-browser-auth"], activationExamples: ["build-browser-visible", "browser visible", "visible browser", "headed browser", "watch browser"] },
    "build-guard-destructive": { benefitsFrom: ["build-guard-full"], activationExamples: ["build-guard-destructive", "guard destructive", "destructive guard", "risky command", "approval check"] },
    "build-guard-full": { benefitsFrom: ["build-guard-destructive", "build-guard-scope"], activationExamples: ["build-guard-full", "guard full", "full guard", "safe mode", "guard posture"] },
    "build-guard-scope": { benefitsFrom: ["build-guard-full", "build-guard-scope-release"], activationExamples: ["build-guard-scope", "guard scope", "scope guard", "freeze scope", "lock edits"] },
    "build-guard-scope-release": { benefitsFrom: ["build-guard-scope"], activationExamples: ["build-guard-scope-release", "guard scope release", "release scope", "unfreeze scope", "remove scope lock"] },
    "build-recipe-investigate": { benefitsFrom: ["build-runtime-learnings", "build-guard-scope", "build-flow-codebasearchitecture"], activationExamples: ["build-recipe-investigate", "recipe investigate", "investigate", "root cause", "debug this"] },
    "build-runtime-health": { benefitsFrom: ["build-runtime-session", "build-runtime-learnings"], activationExamples: ["build-runtime-health", "runtime health", "workflow health", "stack health", "quality signals"] },
    "build-runtime-learnings": { benefitsFrom: ["build-recipe-investigate", "build-runtime-session", "build-role-staffengineer", "build-recipe-ship"], activationExamples: ["build-runtime-learnings", "runtime learnings", "record learning", "retrieve learning", "repo memory"] },
    "build-runtime-session": { benefitsFrom: ["build-runtime-learnings"], activationExamples: ["build-runtime-session", "runtime session", "save session", "restore session", "working context"] },
    "build-flow-infradesign": { benefitsFrom: ["build-recipe-discovery", "build-recipe-autoplan", "build-role-engmanager", "build-role-cso", "build-source-deploy"], activationExamples: ["build-flow-infradesign", "flow infradesign", "infrastructure design", "hosting selection", "database selection"] },
    "build-flow-plantune": { benefitsFrom: ["build-role-engmanager", "build-role-founder"], activationExamples: ["build-flow-plantune", "flow plantune", "tune the plan", "plan tuning", "scope review"] },
    "build-flow-qareport": { benefitsFrom: ["build-browser-qa", "build-browser-runner", "build-role-founder"], activationExamples: ["build-flow-qareport", "flow qareport", "QA report", "report only QA", "browser findings"] },
    "build-flow-securitygate": { benefitsFrom: ["build-guard-destructive", "build-runtime-session"], activationExamples: ["build-flow-securitygate", "flow securitygate", "prelaunch security gate", "release security gate", "security go/no-go"] },
    "build-recipe-landdeploy": { benefitsFrom: ["build-role-releaseengineer", "build-browser-canary", "build-guard-destructive", "build-role-founder", "build-role-designer", "build-recipe-autoplan"], activationExamples: ["build-recipe-landdeploy", "recipe landdeploy", "land deploy", "merge and deploy", "ship to production"] },
    "build-recipe-qa": { benefitsFrom: ["build-browser-qa", "build-flow-qareport", "build-role-founder"], activationExamples: ["build-recipe-qa", "recipe qa", "run QA", "test and fix", "browser QA"] },
    "build-recipe-ship": { benefitsFrom: ["build-role-staffengineer", "build-role-docengineer", "build-role-releaseengineer", "build-role-designer"], activationExamples: ["build-recipe-ship", "recipe ship", "prepare release", "ship branch", "release handoff"] },
    "build-role-cso": { benefitsFrom: ["build-guard-destructive", "build-runtime-session"], activationExamples: ["build-role-cso", "role cso", "security review", "CSO review", "threat model"] },
    "build-role-docengineer": { benefitsFrom: ["build-recipe-ship", "build-source-pdf"], activationExamples: ["build-role-docengineer", "role docengineer", "docs review", "documentation release", "operator docs"] },
    "build-role-engmanager": { benefitsFrom: ["build-flow-plantune", "build-role-staffengineer", "build-role-designer", "build-role-founder"], activationExamples: ["build-role-engmanager", "role engmanager", "engineering manager review", "plan review", "delivery review"] },
    "build-role-releaseengineer": { benefitsFrom: ["build-recipe-ship", "build-recipe-landdeploy", "build-browser-canary"], activationExamples: ["build-role-releaseengineer", "role releaseengineer", "release review", "rollback plan", "release engineer"] },
    "build-role-staffengineer": { benefitsFrom: ["build-role-cso", "build-role-releaseengineer", "build-runtime-session", "build-role-founder", "build-role-designer", "build-flow-codebasearchitecture"], activationExamples: ["build-role-staffengineer", "role staffengineer", "staff engineer review", "review the diff", "pre landing review"] },
    "build-source-deploy": { benefitsFrom: ["build-role-releaseengineer", "build-recipe-landdeploy"], activationExamples: ["build-source-deploy", "source deploy", "deploy setup", "deployment readiness", "provider assumptions"] },
    "build-source-pdf": { benefitsFrom: ["build-role-docengineer", "build-flow-designhtml"], activationExamples: ["build-source-pdf", "source pdf", "PDF support", "create PDF", "verify PDF"] },
    "build-flow-designconsult": { benefitsFrom: ["build-role-designer", "build-browser-runner", "build-recipe-discovery"], activationExamples: ["build-flow-designconsult", "flow designconsult", "design consult", "product design advice", "UX consultation"] },
    "build-flow-designhtml": { benefitsFrom: ["build-role-designer", "build-browser-runner", "build-role-founder"], activationExamples: ["build-flow-designhtml", "flow designhtml", "design HTML", "HTML mockup", "preview page"] },
    "build-flow-designshotgun": { benefitsFrom: ["build-role-designer", "build-flow-designhtml", "build-recipe-discovery"], activationExamples: ["build-flow-designshotgun", "flow designshotgun", "design shotgun", "multiple directions", "design variants"] },
    "build-flow-mobileuifinish": { benefitsFrom: ["build-role-designer", "build-flow-designconsult", "build-flow-qareport"], activationExamples: ["build-flow-mobileuifinish", "flow mobileuifinish", "finish the mobile UI", "mobile UI review", "polish this mobile UI"] },
    "build-flow-webuifinish": { benefitsFrom: ["build-browser-runner", "build-role-designer", "build-flow-designconsult", "build-flow-qareport", "build-recipe-qa", "build-flow-landingreport"], activationExamples: ["build-flow-webuifinish", "flow webuifinish", "finish the Web UI", "Web UI review", "polish this web UI"] },
    "build-role-designer": { benefitsFrom: ["build-flow-designconsult", "build-flow-designshotgun", "build-browser-runner", "build-recipe-ship", "build-role-engmanager", "build-role-founder"], activationExamples: ["build-role-designer", "role designer", "designer review", "design review", "UX review"] },
    "build-flow-skillify": { benefitsFrom: ["build-role-dxlead", "build-role-staffengineer", "build-flow-codebasearchitecture"], activationExamples: ["build-flow-skillify", "flow skillify", "skillify", "make a skill", "workflow skill"] },
    "build-internal-modelbenchmark": { benefitsFrom: ["build-runtime-health", "build-role-staffengineer"], activationExamples: ["build-internal-modelbenchmark", "internal modelbenchmark", "model benchmark", "compare models", "skill quality"] },
    "build-recipe-autoplan": { benefitsFrom: ["build-role-founder", "build-role-designer", "build-role-engmanager", "build-role-dxlead"], activationExamples: ["build-recipe-autoplan", "recipe autoplan", "auto plan", "automatic review", "plan review chain"] },
    "build-role-dxlead": { benefitsFrom: ["build-role-docengineer", "build-flow-skillify"], activationExamples: ["build-role-dxlead", "role dxlead", "DX review", "developer experience review", "API review"] },
    "build-runtime-upgrade": { benefitsFrom: ["build-runtime-health", "build-recipe-ship"], activationExamples: ["build-runtime-upgrade", "runtime upgrade", "upgrade stack", "migration check", "update build stacks"] },
    "build-flow-goaldirectedux": { benefitsFrom: ["build-role-designer", "build-recipe-discovery", "build-role-dxlead"], activationExamples: ["build-flow-goaldirectedux", "flow goaldirectedux", "Goal-Directed Design", "GDD", "UX requirements", "persona scenarios"] },
    "build-flow-landingreport": { benefitsFrom: ["build-role-founder", "build-browser-runner"], activationExamples: ["build-flow-landingreport", "flow landingreport", "landing report", "conversion review", "landing page review"] },
    "build-flow-pdmscaffold": { benefitsFrom: ["build-recipe-discovery", "build-flow-goaldirectedux", "build-role-docengineer", "build-flow-plantune", "build-flow-skillify"], activationExamples: ["build-flow-pdmscaffold", "flow pdmscaffold", "PdM documentation scaffold", "PRODUCT_PLAN template", "docs/pdm scaffold"] },
    "build-recipe-discovery": { benefitsFrom: ["build-role-founder", "build-flow-plantune", "build-role-engmanager", "build-flow-domainmodeling"], activationExamples: ["build-recipe-discovery", "recipe discovery", "discovery", "shape the idea", "product brief"] },
    "build-role-founder": { benefitsFrom: ["build-recipe-discovery", "build-flow-plantune", "build-recipe-ship", "build-role-engmanager"], activationExamples: ["build-role-founder", "role founder", "founder review", "CEO review", "wedge review"] },
    "build-flow-organize-stack": { benefitsFrom: ["build-role-dxlead", "build-role-staffengineer"], activationExamples: ["organize this APM stack", "check the package graph", "where should this skill live"] },
    "build-recipe-research": { benefitsFrom: ["build-runtime-learnings"], activationExamples: ["build-recipe-research", "research this", "check primary sources", "write a cited research note"] },
    "build-flow-domainmodeling": { benefitsFrom: [], activationExamples: ["build-flow-domainmodeling", "domain model", "ubiquitous language", "record an ADR"] },
    "build-flow-specwork": { benefitsFrom: ["build-flow-domainmodeling", "build-recipe-implement"], activationExamples: ["build-flow-specwork", "write a spec", "split this into tickets", "tracer bullet tickets"] },
    "build-flow-codebasearchitecture": { benefitsFrom: ["build-browser-runner", "build-flow-designhtml", "build-flow-domainmodeling", "build-role-staffengineer"], activationExamples: ["build-flow-codebasearchitecture", "deep module design", "architecture audit", "improve codebase architecture"] },
    "build-recipe-implement": { benefitsFrom: ["build-role-staffengineer", "build-guard-scope", "build-flow-domainmodeling"], activationExamples: ["build-recipe-implement", "implement this spec", "TDD", "red green refactor"] },
    "build-recipe-mergeconflicts": { benefitsFrom: ["build-guard-destructive", "build-role-staffengineer"], activationExamples: ["build-recipe-mergeconflicts", "resolve merge conflicts", "fix rebase conflicts", "conflict resolution"] },
    "build-flow-triage": { benefitsFrom: ["build-recipe-investigate", "build-flow-domainmodeling", "build-guard-destructive"], activationExamples: ["build-flow-triage", "triage issues", "verify a bug report", "make issue agent ready"] },
    "build-flow-humanwizard": { benefitsFrom: ["build-guard-destructive", "build-role-cso"], activationExamples: ["build-flow-humanwizard", "setup wizard", "human-only provisioning", "credential setup script"] }
};

const japaneseActivationExamples = {
    "build-recipe-discovery": "曖昧なアイデアを整理して",
    "build-recipe-autoplan": "複数の専門視点で計画を自動レビューして",
    "build-role-founder": "創業者の視点でレビューして",
    "build-role-designer": "デザイナーとしてUXをレビューして",
    "build-role-engmanager": "エンジニアリングマネージャーとして計画を見て",
    "build-role-dxlead": "DX責任者としてAPIをレビューして",
    "build-flow-plantune": "この実装計画を具体化して",
    "build-role-staffengineer": "スタッフエンジニアとしてコードレビューして",
    "build-recipe-qa": "ブラウザでテストして問題を直して",
    "build-browser-qa": "画面をブラウザで確認して証跡を残して",
    "build-flow-qareport": "修正せずにQAレポートを作って",
    "build-recipe-ship": "このブランチをPRに出せる状態にして",
    "build-role-releaseengineer": "リリースエンジニアとしてロールバックを確認して",
    "build-recipe-landdeploy": "マージして本番反映まで確認して",
    "build-browser-canary": "デプロイ後の画面を監視して",
    "build-browser-benchmark": "Webパフォーマンスを計測して",
    "build-internal-modelbenchmark": "モデルごとのskill品質を比較して",
    "build-browser-runner": "ブラウザ操作を安全に実行して",
    "build-browser-visible": "見えるブラウザを開いて",
    "build-browser-auth": "認証済みブラウザを安全に準備して",
    "build-browser-scrape": "公開ページから内容を抽出して",
    "build-flow-skillify": "この繰り返し作業をskillにして",
    "build-flow-pdmscaffold": "PdM文書の雛形を作って",
    "build-flow-infradesign": "インフラ構成を設計して",
    "build-flow-securitygate": "リリース前のセキュリティ判定をして",
    "build-recipe-investigate": "この不具合の根本原因を調べて",
    "build-role-cso": "セキュリティ責任者としてレビューして",
    "build-guard-destructive": "危険な操作の前に承認を確認して",
    "build-guard-scope": "編集範囲を固定して",
    "build-guard-scope-release": "編集範囲の固定を解除して",
    "build-guard-full": "安全ガードを全部有効にして",
    "build-runtime-session": "作業状況を保存して次回に引き継いで",
    "build-runtime-learnings": "今回の学びを記録して",
    "build-runtime-health": "workflowの状態を確認して",
    "build-role-docengineer": "ドキュメントエンジニアとしてリリース文書をレビューして",
    "build-flow-designconsult": "プロダクトデザインを相談したい",
    "build-flow-webuifinish": "Web UIを実画面で仕上げて",
    "build-flow-mobileuifinish": "モバイルUIを実画面で仕上げて",
    "build-flow-goaldirectedux": "ゴール指向でペルソナとシナリオを設計して",
    "build-flow-designhtml": "HTMLでデザイン案を作って",
    "build-flow-designshotgun": "複数のデザイン方向を出して比較して",
    "build-source-pdf": "PDFを生成して表示を検証して",
    "build-flow-landingreport": "ランディングページをレビューして",
    "build-browser-pairagent": "ブラウザQAの引き継ぎ資料を作って",
    "build-source-deploy": "承認済みのデプロイ環境設定をリポジトリへ組み込んで",
    "build-runtime-upgrade": "build-stacksを更新して移行を確認して",
    "build-flow-organize-stack": "APMのpackage構成を整理して",
    "build-recipe-research": "一次情報を調べて出典付きでまとめて",
    "build-flow-domainmodeling": "ドメイン用語を整理してADRを残して",
    "build-flow-specwork": "この内容を仕様書かチケットにして",
    "build-flow-codebasearchitecture": "コードベースの境界と構造を設計して",
    "build-recipe-implement": "承認済みの仕様をTDDで実装して",
    "build-recipe-mergeconflicts": "rebaseの競合を両側の意図を残して解消して",
    "build-flow-triage": "このissueを調査して着手可能にして",
    "build-flow-humanwizard": "人が実行する認証設定wizardを作って"
};

const activationExclusions = {
    "build-recipe-discovery": "Do not use for an already approved implementation plan.",
    "build-recipe-autoplan": "Do not use for one explicitly named review role.",
    "build-flow-plantune": "Do not use when the user explicitly asks for an engineering manager or another named role stance; the named role owns that review.",
    "build-role-staffengineer": "Do not edit code; pair this role with build-recipe-implement when changes are requested.",
    "build-recipe-qa": "Do not use for a report-only QA request.",
    "build-browser-qa": "Use for executing browser checks and capturing fresh evidence; if no runnable surface exists, report that blocker without substituting a report-only flow.",
    "build-flow-qareport": "Do not use when the user asked to fix defects or to execute browser checks and capture fresh evidence.",
    "build-recipe-ship": "Do not use for merge or production deployment.",
    "build-recipe-landdeploy": "Do not use for PR preparation only.",
    "build-recipe-investigate": "Do not use for cited topic research unrelated to a defect.",
    "build-recipe-research": "Do not use for debugging a concrete defect.",
    "build-flow-domainmodeling": "Do not use for broad product discovery without a terminology or decision-record goal.",
    "build-flow-specwork": "Do not use before material product decisions are settled.",
    "build-flow-codebasearchitecture": "Do not use for a read-only diff review.",
    "build-recipe-implement": "Do not use for review-only requests or unresolved merge conflicts.",
    "build-recipe-mergeconflicts": "Do not use for ordinary implementation work without conflicted paths.",
    "build-flow-triage": "Do not use for root-cause debugging when no issue intake outcome is requested.",
    "build-flow-humanwizard": "Do not use for ordinary project setup that the agent can perform safely.",
    "build-flow-designconsult": "Do not use when the user asked for rendered implementation or multiple visual variants.",
    "build-flow-designshotgun": "Do not use when the user wants one settled direction implemented.",
    "build-flow-webuifinish": "Do not use for report-only review without fixes.",
    "build-flow-mobileuifinish": "Do not use for report-only review without fixes."
};

const roleStances = {
    "build-role-founder": "Challenge the problem wedge, adoption friction, commercial value, and reason a first customer would pay.",
    "build-role-designer": "Judge interaction quality, visual hierarchy, accessibility, and whether rendered evidence supports the UX claim.",
    "build-role-engmanager": "Judge sequencing, ownership, delivery risk, maintainability, and whether scope can be executed predictably.",
    "build-role-dxlead": "Judge API ergonomics, onboarding, documentation, debugging, and developer adoption friction.",
    "build-role-staffengineer": "Review correctness, architecture, integration seams, migrations, tests, and long-term maintainability without editing.",
    "build-role-releaseengineer": "Judge rollout, rollback, observability, versioning, operational readiness, and post-release verification.",
    "build-role-cso": "Judge threats, authentication, authorization, privacy, secrets, abuse paths, policy exposure, and security blockers.",
    "build-role-docengineer": "Judge changelogs, migrations, operator guidance, reference accuracy, and documentation release evidence."
};

const orchestrations = {
    "build-recipe-autoplan": ["build-role-founder", "build-role-designer", "build-role-engmanager", "build-role-dxlead"],
    "build-recipe-qa": ["build-browser-qa", "build-flow-qareport"],
    "build-recipe-landdeploy": ["build-recipe-ship", "build-browser-canary"]
};

const actionOverrides = {
    "build-role-founder": "review product strategy through a founder and CEO lens",
    "build-role-designer": "review product UX, visual artifacts, flows, and browser evidence",
    "build-role-engmanager": "review sequencing, risk, maintainability, and scope as an engineering manager",
    "build-role-dxlead": "review APIs, onboarding, documentation, and adoption friction",
    "build-role-staffengineer": "review diffs, architecture, correctness, migrations, and tests at staff level",
    "build-browser-qa": "run browser-centered QA and capture evidence",
    "build-role-releaseengineer": "review rollout, rollback, and verification readiness",
    "build-browser-canary": "monitor a post-deploy browser canary",
    "build-browser-benchmark": "benchmark browser performance and collect Web Vitals evidence",
    "build-internal-modelbenchmark": "compare model outputs and skill quality for maintainer evaluation",
    "build-browser-runner": "apply the official agent-browser policy for safe browser QA",
    "build-browser-auth": "import cookies safely and set up authenticated browser access",
    "build-role-cso": "review threats, privacy, auth, secrets, policy risk, and security blockers",
    "build-role-docengineer": "review changelogs, migration notes, operator docs, and release documentation",
    "build-source-pdf": "generate and verify PDFs and supporting document sources",
    "build-browser-pairagent": "prepare browser QA handoff packets for pair-agent collaboration",
    "build-source-deploy": "integrate deployment environment setup and readiness evidence",
    "build-runtime-upgrade": "upgrade build-stacks and verify its migration"
};

const displayTokenLabels = {
    autoplan: "Auto Plan",
    canary: "Canary",
    cso: "CSO",
    designconsult: "Design Consult",
    designhtml: "Design HTML",
    designshotgun: "Design Shotgun",
    docengineer: "Documentation Engineer",
    dxlead: "DX Lead",
    engmanager: "Engineering Manager",
    goaldirectedux: "Goal-Directed UX",
    infradesign: "Infrastructure Design",
    landdeploy: "Land & Deploy",
    landingreport: "Landing Report",
    mobileuifinish: "Mobile UI Finish",
    modelbenchmark: "Model Benchmark",
    pairagent: "Pair-Agent",
    pdmscaffold: "PdM Scaffold",
    plantune: "Plan Tune",
    qareport: "QA Report",
    releaseengineer: "Release Engineer",
    securitygate: "Security Gate",
    staffengineer: "Staff Engineer",
    webuifinish: "Web UI Finish"
};

const packageBySkill = new Map(Object.entries(packageSkills).flatMap(([packageId, names]) => names.map((name) => [name, packageId])));

export const buildSkills = baseSkills.map((skill) => {
    const relation = relationships[skill.name];
    const packageId = packageBySkill.get(skill.name);
    const japaneseActivation = japaneseActivationExamples[skill.name];
    if (!relation || !packageId || !japaneseActivation) {
        throw new Error(`incomplete build skill catalog entry: ${skill.name}`);
    }
    const action = actionOverrides[skill.name] ?? `${skill.summary[0].toLowerCase()}${skill.summary.slice(1).replace(/\.$/, "")}`;
    const englishActivation = `Please ${action}.`;
    const displayName = skill.name
        .replace(/^build-/, "")
        .split("-")
        .map((part) => displayTokenLabels[part] ?? part[0].toUpperCase() + part.slice(1))
        .join(" ");
    const shortDescription = truncateAtWord(skill.summary, 64);
    return {
        ...skill,
        action,
        package: packageId,
        sourcePath: `${buildPackages.find((pkg) => pkg.id === packageId).path}/.apm/skills/${skill.name}`,
        benefitsFrom: relation.benefitsFrom,
        orchestrates: orchestrations[skill.name] ?? [],
        activationExamples: [...relation.activationExamples, englishActivation, japaneseActivation],
        naturalActivationExamples: { en: englishActivation, ja: japaneseActivation },
        activationExclusions: activationExclusions[skill.name] ? [activationExclusions[skill.name]] : [],
        routingKind: routingKindFor(skill),
        roleStance: roleStances[skill.name],
        preambleTier: expectedPreambleTier(skill),
        skillVersion: "1.0.0",
        interface: {
            displayName,
            shortDescription,
            defaultPrompt: `Use $${skill.name} to ${action}.`
        }
    };
});

function truncateAtWord(value, maxLength) {
    if (value.length <= maxLength) return value;
    const candidate = value.slice(0, maxLength - 3).trimEnd();
    const boundary = candidate.lastIndexOf(" ");
    const prefix = boundary >= 25 ? candidate.slice(0, boundary) : candidate;
    return `${prefix}...`;
}

function routingKindFor(skill) {
    if (["flow", "recipe"].includes(skill.layer)) return "coordinator";
    if (skill.layer === "role") return "role";
    if (skill.layer === "internal") return "internal";
    return "support";
}

export function isValidBuildSkillName(name) {
    return /^build-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64;
}

export function skillsForPackage(packageId) {
    return buildSkills.filter((skill) => skill.package === packageId);
}

export function packageClosure(packageId) {
    const byId = new Map(buildPackages.map((pkg) => [pkg.id, pkg]));
    const visited = new Set();
    const visit = (id) => {
        if (visited.has(id)) return;
        const pkg = byId.get(id);
        if (!pkg) throw new Error(`unknown build package: ${id}`);
        visited.add(id);
        pkg.dependencies.forEach(visit);
    };
    visit(packageId);
    return buildSkills.filter((skill) => visited.has(skill.package));
}

function expectedPreambleTier(skill) {
    const highPreambleFlows = new Set([
        "build-flow-designconsult",
        "build-flow-designshotgun",
        "build-flow-goaldirectedux",
        "build-flow-infradesign",
        "build-flow-landingreport",
        "build-flow-mobileuifinish",
        "build-flow-pdmscaffold",
        "build-flow-plantune",
        "build-flow-securitygate",
        "build-flow-skillify",
        "build-flow-webuifinish"
    ]);
    if (["recipe", "role"].includes(skill.layer)) return 3;
    if (highPreambleFlows.has(skill.name)) return 3;
    if (["guard", "internal"].includes(skill.layer)) return 1;
    return 2;
}
