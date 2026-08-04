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
            ["apm", "compile", "--validate", "--local-only"],
            ["npm", "run", "smoke:codex"],
            ["npm", "run", "smoke:all"],
            ["npm", "run", "smoke:packages"],
            ["npm", "run", "browser:doctor"],
            ["npm", "run", "browser:smoke"],
            ["node", "scripts/repo-secret-scan.mjs"],
            ["node", "scripts/repo-whitespace-verify.mjs"]
        ]);
    });

    it("is mandatory for release verification and CI", () => {
        const releaseGate = readFileSync("scripts/release-verify.mjs", "utf8");
        const workflow = readFileSync(".github/workflows/apm-verify.yml", "utf8");

        assert.match(releaseGate, /\["npm", "run", "quality:verify"\]/);
        assert.match(workflow, /AGENT_BROWSER_EXPECTED_VERSION: "0\.27\.0"/);
        assert.match(workflow, /npm run release:verify/);
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
