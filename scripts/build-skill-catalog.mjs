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
    { name: "build-flow-organize-stack", layer: "flow", summary: "Audit APM skill placement and propose safe stack organization changes.", status: "shipped" }
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
        "build-runtime-session", "build-runtime-learnings", "build-runtime-health", "build-recipe-investigate"
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
        "build-flow-goaldirectedux", "build-flow-landingreport"
    ],
    delivery: [
        "build-recipe-qa", "build-recipe-ship", "build-recipe-landdeploy", "build-role-engmanager",
        "build-role-staffengineer", "build-role-releaseengineer", "build-role-cso", "build-role-docengineer",
        "build-flow-plantune", "build-flow-qareport", "build-flow-infradesign", "build-flow-securitygate",
        "build-source-deploy", "build-source-pdf"
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
    "build-browser-qa": { benefitsFrom: ["build-browser-runner", "build-flow-qareport"], activationExamples: ["build-browser-qa", "browser qa", "browser QA", "test the page", "capture evidence"] },
    "build-browser-runner": { benefitsFrom: ["build-guard-destructive"], activationExamples: ["build-browser-runner", "browser runner", "browser evidence", "open the page", "take a screenshot"] },
    "build-browser-scrape": { benefitsFrom: ["build-browser-runner", "build-role-cso"], activationExamples: ["build-browser-scrape", "browser scrape", "scrape page", "public page evidence", "extract content"] },
    "build-browser-visible": { benefitsFrom: ["build-browser-runner", "build-browser-auth"], activationExamples: ["build-browser-visible", "browser visible", "visible browser", "headed browser", "watch browser"] },
    "build-guard-destructive": { benefitsFrom: ["build-guard-full"], activationExamples: ["build-guard-destructive", "guard destructive", "destructive guard", "risky command", "approval check"] },
    "build-guard-full": { benefitsFrom: ["build-guard-destructive", "build-guard-scope"], activationExamples: ["build-guard-full", "guard full", "full guard", "safe mode", "guard posture"] },
    "build-guard-scope": { benefitsFrom: ["build-guard-full", "build-guard-scope-release"], activationExamples: ["build-guard-scope", "guard scope", "scope guard", "freeze scope", "lock edits"] },
    "build-guard-scope-release": { benefitsFrom: ["build-guard-scope"], activationExamples: ["build-guard-scope-release", "guard scope release", "release scope", "unfreeze scope", "remove scope lock"] },
    "build-recipe-investigate": { benefitsFrom: ["build-runtime-learnings", "build-guard-scope"], activationExamples: ["build-recipe-investigate", "recipe investigate", "investigate", "root cause", "debug this"] },
    "build-runtime-health": { benefitsFrom: ["build-runtime-session", "build-runtime-learnings"], activationExamples: ["build-runtime-health", "runtime health", "workflow health", "stack health", "quality signals"] },
    "build-runtime-learnings": { benefitsFrom: ["build-recipe-investigate", "build-runtime-session"], activationExamples: ["build-runtime-learnings", "runtime learnings", "record learning", "retrieve learning", "repo memory"] },
    "build-runtime-session": { benefitsFrom: ["build-runtime-learnings"], activationExamples: ["build-runtime-session", "runtime session", "save session", "restore session", "working context"] },
    "build-flow-infradesign": { benefitsFrom: ["build-recipe-discovery", "build-role-engmanager", "build-role-cso", "build-source-deploy"], activationExamples: ["build-flow-infradesign", "flow infradesign", "infrastructure design", "hosting selection", "database selection"] },
    "build-flow-plantune": { benefitsFrom: ["build-role-engmanager", "build-role-founder"], activationExamples: ["build-flow-plantune", "flow plantune", "tune the plan", "plan tuning", "scope review"] },
    "build-flow-qareport": { benefitsFrom: ["build-browser-qa", "build-browser-runner"], activationExamples: ["build-flow-qareport", "flow qareport", "QA report", "report only QA", "browser findings"] },
    "build-flow-securitygate": { benefitsFrom: ["build-guard-destructive", "build-runtime-session"], activationExamples: ["build-flow-securitygate", "flow securitygate", "prelaunch security gate", "release security gate", "security go/no-go"] },
    "build-recipe-landdeploy": { benefitsFrom: ["build-role-releaseengineer", "build-browser-canary", "build-guard-destructive"], activationExamples: ["build-recipe-landdeploy", "recipe landdeploy", "land deploy", "merge and deploy", "ship to production"] },
    "build-recipe-qa": { benefitsFrom: ["build-browser-qa", "build-flow-qareport"], activationExamples: ["build-recipe-qa", "recipe qa", "run QA", "test and fix", "browser QA"] },
    "build-recipe-ship": { benefitsFrom: ["build-role-staffengineer", "build-role-docengineer", "build-role-releaseengineer"], activationExamples: ["build-recipe-ship", "recipe ship", "prepare release", "ship branch", "release handoff"] },
    "build-role-cso": { benefitsFrom: ["build-guard-destructive", "build-runtime-session"], activationExamples: ["build-role-cso", "role cso", "security review", "CSO review", "threat model"] },
    "build-role-docengineer": { benefitsFrom: ["build-recipe-ship", "build-source-pdf"], activationExamples: ["build-role-docengineer", "role docengineer", "docs review", "documentation release", "operator docs"] },
    "build-role-engmanager": { benefitsFrom: ["build-flow-plantune", "build-role-staffengineer"], activationExamples: ["build-role-engmanager", "role engmanager", "engineering manager review", "plan review", "delivery review"] },
    "build-role-releaseengineer": { benefitsFrom: ["build-recipe-ship", "build-recipe-landdeploy", "build-browser-canary"], activationExamples: ["build-role-releaseengineer", "role releaseengineer", "release review", "rollback plan", "release engineer"] },
    "build-role-staffengineer": { benefitsFrom: ["build-role-cso", "build-role-releaseengineer", "build-runtime-session"], activationExamples: ["build-role-staffengineer", "role staffengineer", "staff engineer review", "review the diff", "pre landing review"] },
    "build-source-deploy": { benefitsFrom: ["build-role-releaseengineer", "build-recipe-landdeploy"], activationExamples: ["build-source-deploy", "source deploy", "deploy setup", "deployment readiness", "provider assumptions"] },
    "build-source-pdf": { benefitsFrom: ["build-role-docengineer", "build-flow-designhtml"], activationExamples: ["build-source-pdf", "source pdf", "PDF support", "create PDF", "verify PDF"] },
    "build-flow-designconsult": { benefitsFrom: ["build-role-designer", "build-browser-runner"], activationExamples: ["build-flow-designconsult", "flow designconsult", "design consult", "product design advice", "UX consultation"] },
    "build-flow-designhtml": { benefitsFrom: ["build-role-designer", "build-browser-runner"], activationExamples: ["build-flow-designhtml", "flow designhtml", "design HTML", "HTML mockup", "preview page"] },
    "build-flow-designshotgun": { benefitsFrom: ["build-role-designer", "build-flow-designhtml"], activationExamples: ["build-flow-designshotgun", "flow designshotgun", "design shotgun", "multiple directions", "design variants"] },
    "build-flow-mobileuifinish": { benefitsFrom: ["build-role-designer", "build-flow-designconsult"], activationExamples: ["build-flow-mobileuifinish", "flow mobileuifinish", "finish the mobile UI", "mobile UI review", "polish this mobile UI"] },
    "build-flow-webuifinish": { benefitsFrom: ["build-browser-runner", "build-role-designer", "build-flow-designconsult"], activationExamples: ["build-flow-webuifinish", "flow webuifinish", "finish the Web UI", "Web UI review", "polish this web UI"] },
    "build-role-designer": { benefitsFrom: ["build-flow-designconsult", "build-flow-designshotgun", "build-browser-runner"], activationExamples: ["build-role-designer", "role designer", "designer review", "design review", "UX review"] },
    "build-flow-skillify": { benefitsFrom: ["build-role-dxlead", "build-role-staffengineer"], activationExamples: ["build-flow-skillify", "flow skillify", "skillify", "make a skill", "workflow skill"] },
    "build-internal-modelbenchmark": { benefitsFrom: ["build-runtime-health", "build-role-staffengineer"], activationExamples: ["build-internal-modelbenchmark", "internal modelbenchmark", "model benchmark", "compare models", "skill quality"] },
    "build-recipe-autoplan": { benefitsFrom: ["build-role-founder", "build-role-designer", "build-role-engmanager", "build-role-dxlead"], activationExamples: ["build-recipe-autoplan", "recipe autoplan", "auto plan", "automatic review", "plan review chain"] },
    "build-role-dxlead": { benefitsFrom: ["build-role-docengineer", "build-flow-skillify"], activationExamples: ["build-role-dxlead", "role dxlead", "DX review", "developer experience review", "API review"] },
    "build-runtime-upgrade": { benefitsFrom: ["build-runtime-health", "build-recipe-ship"], activationExamples: ["build-runtime-upgrade", "runtime upgrade", "upgrade stack", "migration check", "update build stacks"] },
    "build-flow-goaldirectedux": { benefitsFrom: ["build-role-designer", "build-recipe-discovery", "build-role-dxlead"], activationExamples: ["build-flow-goaldirectedux", "flow goaldirectedux", "Goal-Directed Design", "GDD", "UX requirements", "persona scenarios"] },
    "build-flow-landingreport": { benefitsFrom: ["build-role-founder", "build-browser-runner"], activationExamples: ["build-flow-landingreport", "flow landingreport", "landing report", "conversion review", "landing page review"] },
    "build-flow-pdmscaffold": { benefitsFrom: ["build-recipe-discovery", "build-flow-goaldirectedux", "build-role-docengineer"], activationExamples: ["build-flow-pdmscaffold", "flow pdmscaffold", "PdM documentation scaffold", "PRODUCT_PLAN template", "docs/pdm scaffold"] },
    "build-recipe-discovery": { benefitsFrom: ["build-role-founder", "build-flow-plantune"], activationExamples: ["build-recipe-discovery", "recipe discovery", "discovery", "shape the idea", "product brief"] },
    "build-role-founder": { benefitsFrom: ["build-recipe-discovery", "build-flow-plantune"], activationExamples: ["build-role-founder", "role founder", "founder review", "CEO review", "wedge review"] },
    "build-flow-organize-stack": { benefitsFrom: ["build-role-dxlead", "build-role-staffengineer"], activationExamples: ["organize this APM stack", "check the package graph", "where should this skill live"] }
};

const packageBySkill = new Map(Object.entries(packageSkills).flatMap(([packageId, names]) => names.map((name) => [name, packageId])));

export const buildSkills = baseSkills.map((skill) => {
    const relation = relationships[skill.name];
    const packageId = packageBySkill.get(skill.name);
    if (!relation || !packageId) {
        throw new Error(`incomplete build skill catalog entry: ${skill.name}`);
    }
    const displayName = skill.name
        .replace(/^build-/, "")
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
    const shortDescription = skill.summary.length <= 64 ? skill.summary : `${skill.summary.slice(0, 61).trimEnd()}...`;
    return {
        ...skill,
        package: packageId,
        sourcePath: `${buildPackages.find((pkg) => pkg.id === packageId).path}/.apm/skills/${skill.name}`,
        benefitsFrom: relation.benefitsFrom,
        activationExamples: relation.activationExamples,
        preambleTier: expectedPreambleTier(skill),
        skillVersion: "1.0.0",
        interface: {
            displayName,
            shortDescription,
            defaultPrompt: `Use $${skill.name} to ${skill.summary[0].toLowerCase()}${skill.summary.slice(1)}`
        }
    };
});

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
