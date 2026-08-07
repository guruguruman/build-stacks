import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, test } from "node:test";
import { buildSkills } from "../../scripts/build-skill-catalog.mjs";
import { mattPocockPortMap, mattPocockSource } from "../../scripts/mattpocock-port-map.mjs";

const stableUpstream = [
    "ask-matt", "code-review", "codebase-design", "diagnosing-bugs", "domain-modeling",
    "grill-with-docs", "implement", "improve-codebase-architecture", "prototype", "research",
    "resolving-merge-conflicts", "setup-matt-pocock-skills", "tdd", "to-spec", "to-tickets",
    "triage", "wayfinder", "wizard", "grill-me", "grilling", "handoff", "teach",
    "to-questionnaire", "wait-what", "writing-for-agents"
].sort();

describe("Matt Pocock stable skill port provenance", () => {
    test("pins one snapshot and accounts for every stable capability exactly once", () => {
        assert.equal(mattPocockSource.commit, "8b36d4fb2635b3c21998dcd8144439c9e5ba7302");
        assert.equal(mattPocockSource.upstreamVersion, "1.2.2");
        assert.deepEqual(mattPocockPortMap.map((entry) => entry.upstream).sort(), stableUpstream);
        assert.equal(new Set(mattPocockPortMap.map((entry) => entry.upstream)).size, 25);
        assert.equal(mattPocockPortMap.filter((entry) => entry.disposition === "new").length, 11);
        assert.deepEqual(
            mattPocockPortMap.filter((entry) => entry.disposition === "omitted").map((entry) => entry.upstream).sort(),
            ["setup-matt-pocock-skills", "teach"]
        );
    });

    test("resolves every destination to a shipped build skill or policy file", () => {
        const names = new Set(buildSkills.map((skill) => skill.name));
        for (const entry of mattPocockPortMap) {
            assert.ok(["new", "merged", "policy", "omitted"].includes(entry.disposition), entry.upstream);
            if (entry.disposition === "omitted") {
                assert.equal(entry.destinations.length, 0, entry.upstream);
                assert.ok(entry.rationale.length > 0, entry.upstream);
            }
            else assert.ok(entry.destinations.length > 0, entry.upstream);
            for (const destination of entry.destinations) {
                if (destination.startsWith("build-")) assert.ok(names.has(destination), `${entry.upstream} -> ${destination}`);
                else assert.ok(existsSync(destination), `${entry.upstream} -> ${destination}`);
            }
        }
        const newDestinations = new Set(mattPocockPortMap.filter((entry) => entry.disposition === "new").flatMap((entry) => entry.destinations));
        assert.equal(newDestinations.size, 8);
    });
});
