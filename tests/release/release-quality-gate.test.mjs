import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const qualityScript = "scripts/release-quality-verify.mjs";
const qualityCommand = "node scripts/release-quality-verify.mjs";

describe("release quality gate", () => {
    it("is exposed through both package manifests", () => {
        const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
        const apmManifest = readFileSync("apm.yml", "utf8");

        assert.equal(packageJson.scripts["quality:verify"], qualityCommand);
        assert.match(apmManifest, /quality:verify: "node scripts\/release-quality-verify\.mjs"/);
    });

    it("runs every required deterministic and live quality check", async () => {
        assert.equal(existsSync(qualityScript), true, `missing ${qualityScript}`);
        if (!existsSync(qualityScript))
            return;

        const { releaseQualityCommands } = await import(`../../${qualityScript}`);
        assert.deepEqual(releaseQualityCommands, [
            ["npm", "test"],
            ["npm", "run", "skill:verify"],
            ["npm", "run", "metadata:verify"],
            ["npm", "run", "stack:verify"],
            ["npm", "run", "generated:verify"],
            ["npm", "run", "apm:verify"],
            ["apm", "audit", "--ci"],
            ["node", "scripts/apm-compile-verify.mjs"],
            ["npm", "run", "smoke:codex"],
            ["npm", "run", "smoke:all"],
            ["npm", "run", "smoke:packages"],
            ["npm", "run", "smoke:codex-activation-install"],
            ["npm", "run", "browser:doctor"],
            ["npm", "run", "browser:smoke"],
            ["node", "scripts/repo-secret-scan.mjs"],
            ["node", "scripts/repo-whitespace-verify.mjs"]
        ]);
    });

    it("verifies compilation through an isolated installed root", () => {
        const compileVerifier = readFileSync("scripts/apm-compile-verify.mjs", "utf8");

        assert.match(compileVerifier, /\["apm\.yml", "apm\.lock\.yaml", "packages"\]/);
        assert.match(compileVerifier, /"install", "--frozen", "--target", "all"/);
        assert.match(compileVerifier, /run\(\["apm", "compile"\]\)/);
        assert.match(compileVerifier, /"compile", "--validate"/);
        assert.match(compileVerifier, /generated AGENTS\.md missing/);
        assert.match(compileVerifier, /cwd: workspaceRoot/);
        assert.doesNotMatch(compileVerifier, /--local-only/);
    });

    it("is mandatory for release verification and CI", () => {
        const releaseGate = readFileSync("scripts/release-verify.mjs", "utf8");
        const workflow = readFileSync(".github/workflows/apm-verify.yml", "utf8");

        assert.match(releaseGate, /\["npm", "run", "quality:verify"\]/);
        assert.match(workflow, /AGENT_BROWSER_EXPECTED_VERSION: "0\.27\.0"/);
        assert.match(workflow, /npm run release:verify/);
    });

    it("requires bilingual read-event routing, collisions, and mocked GitHub for a release candidate", async () => {
        const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
        assert.equal(packageJson.scripts["release:candidate-verify"], "node scripts/release-candidate-verify.mjs");
        const { releaseCandidateCommands } = await import("../../scripts/release-candidate-verify.mjs");
        assert.deepEqual(releaseCandidateCommands.slice(0, 3), [
            ["npm", "run", "quality:verify"],
            ["node", "scripts/host-neutral-source-verify.mjs"],
            ["node", "scripts/github-workflow-forward-test.mjs"]
        ]);
        assert.equal(releaseCandidateCommands.filter((command) => command.includes("--natural-ja")).length, 2);
        assert.equal(releaseCandidateCommands.filter((command) => command.includes("--natural-en")).length, 2);
        assert.equal(releaseCandidateCommands.filter((command) => command.includes("--collisions")).length, 2);
        for (const label of ["natural-ja", "natural-en", "collisions-ja", "collisions-en"]) {
            assert.ok(releaseCandidateCommands.some((command) => command.includes(`BUILD_CODEX_SMOKE_EVIDENCE_LABEL=${label}`)));
        }
        assert.ok(releaseCandidateCommands.some((command) => command.includes("BUILD_CODEX_BROWSER_EVIDENCE_LABEL=browser-core")));
    });

    it("keeps archived routing summaries portable", () => {
        const activationSmoke = readFileSync("scripts/codex-skill-activation-smoke.mjs", "utf8");
        assert.match(activationSmoke, /- logs: all-skills\//);
        assert.doesNotMatch(activationSmoke, /- logs: \$\{join\(smokeResultsRoot/);
    });

    it("includes Python skill sources in repository secret scanning", () => {
        const secretScanner = readFileSync("scripts/repo-secret-scan.mjs", "utf8");
        assert.match(secretScanner, /\|py\|/);
    });

    it("checks unstaged, staged, and untracked whitespace", () => {
        const whitespaceVerifier = readFileSync("scripts/repo-whitespace-verify.mjs", "utf8");
        assert.match(whitespaceVerifier, /\["diff", "--check"\]/);
        assert.match(whitespaceVerifier, /\["diff", "--cached", "--check"\]/);
        assert.match(whitespaceVerifier, /"ls-files", "--others", "--exclude-standard", "-z"/);
        assert.match(whitespaceVerifier, /"diff", "--no-index", "--check"/);
    });
});
