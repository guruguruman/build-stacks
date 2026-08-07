export const mattPocockSource = Object.freeze({
    repository: "https://github.com/mattpocock/skills",
    commit: "8b36d4fb2635b3c21998dcd8144439c9e5ba7302",
    upstreamVersion: "1.2.2",
    license: "MIT",
    scope: ["skills/engineering", "skills/productivity"]
});

export const mattPocockPortMap = Object.freeze([
    entry("ask-matt", "policy", ["packages/core/.apm/instructions/build-core-routing.instructions.md"]),
    entry("code-review", "merged", ["build-role-staffengineer"]),
    entry("codebase-design", "new", ["build-flow-codebasearchitecture"]),
    entry("diagnosing-bugs", "merged", ["build-recipe-investigate"]),
    entry("domain-modeling", "new", ["build-flow-domainmodeling"]),
    entry("grill-with-docs", "merged", ["build-recipe-discovery", "build-flow-domainmodeling"]),
    entry("implement", "new", ["build-recipe-implement"]),
    entry("improve-codebase-architecture", "new", ["build-flow-codebasearchitecture"]),
    entry("prototype", "merged", ["build-flow-designhtml", "build-flow-designshotgun"]),
    entry("research", "new", ["build-recipe-research"]),
    entry("resolving-merge-conflicts", "new", ["build-recipe-mergeconflicts"]),
    entry("setup-matt-pocock-skills", "omitted", [], "Project setup is repository-specific; durable conventions are created lazily by the owning workflow."),
    entry("tdd", "new", ["build-recipe-implement"]),
    entry("to-spec", "new", ["build-flow-specwork"]),
    entry("to-tickets", "new", ["build-flow-specwork"]),
    entry("triage", "new", ["build-flow-triage"]),
    entry("wayfinder", "merged", ["build-recipe-discovery", "build-flow-specwork", "build-runtime-session"]),
    entry("wizard", "new", ["build-flow-humanwizard"]),
    entry("grill-me", "merged", ["build-recipe-discovery"]),
    entry("grilling", "merged", ["build-recipe-discovery"]),
    entry("handoff", "merged", ["build-runtime-session"]),
    entry("teach", "omitted", [], "A broad teaching workspace collides with ordinary explanation and is outside the build workflow scope."),
    entry("to-questionnaire", "merged", ["build-recipe-discovery"]),
    entry("wait-what", "policy", ["packages/core/.apm/instructions/build-core-language.instructions.md"]),
    entry("writing-for-agents", "merged", ["build-flow-skillify"])
]);

function entry(upstream, disposition, destinations, rationale = "") {
    return Object.freeze({ upstream, disposition, destinations: Object.freeze(destinations), rationale });
}
