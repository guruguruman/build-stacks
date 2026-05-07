export type ProductSkillLayer =
  | "browser"
  | "core"
  | "flow"
  | "guard"
  | "recipe"
  | "role"
  | "runtime"
  | "source";

export type ProductSkill = {
  name: string;
  layer: ProductSkillLayer;
  summary: string;
  status: "shipped";
};

export const productSkills: ProductSkill[] = [
  { name: "product-recipe-discovery", layer: "recipe", summary: "Shape ambiguous product requests into a design doc using forcing questions.", status: "shipped" },
  { name: "product-recipe-autoplan", layer: "recipe", summary: "Create and harden implementation plans through founder, design, engineering, and DX review.", status: "shipped" },
  { name: "product-flow-ceoreview", layer: "flow", summary: "Review plan scope, wedge, user value, and 10-star judgment.", status: "shipped" },
  { name: "product-role-founder", layer: "role", summary: "Founder review lens for scope, urgency, wedge, and user value.", status: "shipped" },
  { name: "product-flow-designreview", layer: "flow", summary: "Evaluate UI plans and implementations against product design quality.", status: "shipped" },
  { name: "product-role-designer", layer: "role", summary: "Product designer role lens for UX quality and visual hierarchy.", status: "shipped" },
  { name: "product-flow-engreview", layer: "flow", summary: "Review architecture, data flow, edge cases, and test plans.", status: "shipped" },
  { name: "product-role-engmanager", layer: "role", summary: "Engineering manager lens for sequencing, risk, and maintainability.", status: "shipped" },
  { name: "product-flow-devexreview", layer: "flow", summary: "Review API, CLI, docs, onboarding, and developer experience.", status: "shipped" },
  { name: "product-role-dxlead", layer: "role", summary: "Developer experience lead lens for integration ergonomics.", status: "shipped" },
  { name: "product-flow-plantune", layer: "flow", summary: "Tune plan scope, ordering, omissions, and handoffs.", status: "shipped" },
  { name: "product-flow-codereview", layer: "flow", summary: "Review diffs for bugs, regressions, tests, SQL, and trust boundaries.", status: "shipped" },
  { name: "product-role-staffengineer", layer: "role", summary: "Staff engineer review lens for correctness and long-term system health.", status: "shipped" },
  { name: "product-recipe-qa", layer: "recipe", summary: "Run browser QA, fix issues, and re-verify with evidence.", status: "shipped" },
  { name: "product-browser-qa", layer: "browser", summary: "Browser-centered QA routines and artifact capture.", status: "shipped" },
  { name: "product-flow-qareport", layer: "flow", summary: "Produce QA findings without modifying code.", status: "shipped" },
  { name: "product-recipe-ship", layer: "recipe", summary: "Prepare tests, coverage, docs, changelog, and PR handoff.", status: "shipped" },
  { name: "product-role-releaseengineer", layer: "role", summary: "Release engineering lens for rollout, rollback, and verification.", status: "shipped" },
  { name: "product-recipe-landdeploy", layer: "recipe", summary: "Merge, deploy, and verify production only with explicit approval.", status: "shipped" },
  { name: "product-browser-canary", layer: "browser", summary: "Post-deploy browser canary monitoring.", status: "shipped" },
  { name: "product-browser-benchmark", layer: "browser", summary: "Browser performance benchmark and web vitals evidence.", status: "shipped" },
  { name: "product-source-models", layer: "source", summary: "Model inventory and optional benchmark sources.", status: "shipped" },
  { name: "product-flow-modelbenchmark", layer: "flow", summary: "Compare model outputs and second-opinion evaluations.", status: "shipped" },
  { name: "product-browser-runner", layer: "browser", summary: "Official agent-browser policy for safe browser QA.", status: "shipped" },
  { name: "product-browser-visible", layer: "browser", summary: "Open a headed browser session for visual inspection.", status: "shipped" },
  { name: "product-browser-auth", layer: "browser", summary: "Guarded cookie import and authenticated browser setup.", status: "shipped" },
  { name: "product-browser-scrape", layer: "browser", summary: "Extract page content in an untrusted envelope.", status: "shipped" },
  { name: "product-flow-skillify", layer: "flow", summary: "Turn repeated work into browser skill promotion candidates.", status: "shipped" },
  { name: "product-source-codex", layer: "source", summary: "Optional Codex CLI source integration with configuration-aware fallback.", status: "shipped" },
  { name: "product-flow-secondopinion", layer: "flow", summary: "Run second-opinion review when model tooling is available.", status: "shipped" },
  { name: "product-recipe-investigate", layer: "recipe", summary: "Require investigation before risky fixes.", status: "shipped" },
  { name: "product-flow-securityreview", layer: "flow", summary: "Run security review using OWASP, STRIDE, and trust-boundary checks.", status: "shipped" },
  { name: "product-role-cso", layer: "role", summary: "Security leadership lens for risk and policy.", status: "shipped" },
  { name: "product-guard-destructive", layer: "guard", summary: "Warn and require approval before destructive actions.", status: "shipped" },
  { name: "product-guard-scope", layer: "guard", summary: "Lock edit scope and report drift.", status: "shipped" },
  { name: "product-guard-scope-release", layer: "guard", summary: "Release an active scope lock.", status: "shipped" },
  { name: "product-guard-full", layer: "guard", summary: "Combine destructive, scope, privacy, and browser guards.", status: "shipped" },
  { name: "product-runtime-session", layer: "runtime", summary: "Save and restore session snapshots under .product-build-stacks.", status: "shipped" },
  { name: "product-runtime-learnings", layer: "runtime", summary: "Record learning candidates for review and promotion.", status: "shipped" },
  { name: "product-recipe-retro", layer: "recipe", summary: "Run retrospective and extract improvement candidates.", status: "shipped" },
  { name: "product-runtime-health", layer: "runtime", summary: "Summarize workflow health and quality signals.", status: "shipped" },
  { name: "product-flow-docrelease", layer: "flow", summary: "Prepare docs, changelog entries, and release notes.", status: "shipped" },
  { name: "product-role-docengineer", layer: "role", summary: "Documentation engineering lens for release communication.", status: "shipped" },
  { name: "product-flow-designconsult", layer: "flow", summary: "Provide product design consultation.", status: "shipped" },
  { name: "product-flow-designhtml", layer: "flow", summary: "Create HTML artifacts and design previews.", status: "shipped" },
  { name: "product-flow-designshotgun", layer: "flow", summary: "Generate and compare multiple design directions.", status: "shipped" },
  { name: "product-source-pdf", layer: "source", summary: "PDF generation and document source support.", status: "shipped" },
  { name: "product-flow-landingreport", layer: "flow", summary: "Review landing pages and launch readiness.", status: "shipped" },
  { name: "product-browser-pairagent", layer: "browser", summary: "Remote/browser pairing with scoped tokens.", status: "shipped" },
  { name: "product-source-deploy", layer: "source", summary: "Deployment environment setup source integration.", status: "shipped" },
  { name: "product-runtime-knowledge", layer: "runtime", summary: "Knowledge and index setup under product runtime state.", status: "shipped" },
  { name: "product-runtime-upgrade", layer: "runtime", summary: "Stack update and migration workflow.", status: "shipped" }
];

export function isValidProductSkillName(name: string): boolean {
  return /^product-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 64;
}
