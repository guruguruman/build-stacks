import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, it } from "node:test";

const analyzerPath = resolve("packages/maintainer/.apm/skills/build-flow-organize-stack/scripts/analyze-stack.mjs");
const fixtures = [];

afterEach(() => {
    for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

describe("build stack analyzer", () => {
    it("reports manifest drift and computes closure from the actual package graph", () => {
        const fixture = createStackFixture();
        const manifestPath = join(fixture, "packages", "design", "apm.yml");
        const manifest = readFileSync(manifestPath, "utf8");
        assert.match(manifest, /- path: \.\.\/browser/);
        writeFileSync(manifestPath, manifest.replace("- path: ../browser", "- path: ../core"));

        const report = runAnalyzer(fixture);

        assert.equal(report.status, 1);
        assert.equal(report.body.findings.some((finding) => finding.code === "package-dependency-drift"), true);
        assert.equal(report.body.closures.design.length, 15);
        assert.equal(report.body.closures.design.includes("build-browser-runner"), false);
    });

    it("finds legacy identifiers in supporting skill resources", () => {
        const fixture = createStackFixture();
        const referencePath = join(fixture, "packages", "maintainer", ".apm", "skills", "build-flow-organize-stack", "references", "legacy-probe.md");
        writeFileSync(referencePath, "Retired identifier: product-flow-plantune\n");

        const report = runAnalyzer(fixture);

        assert.equal(report.status, 1);
        const finding = report.body.findings.find((entry) => entry.code === "legacy-identifier" && entry.message.endsWith("legacy-probe.md"));
        assert.ok(finding, "expected a legacy-identifier finding for the supporting resource");
    });
});

function createStackFixture() {
    const fixture = mkdtempSync(join(tmpdir(), "build-stacks-analyzer-"));
    fixtures.push(fixture);
    cpSync("apm.yml", join(fixture, "apm.yml"));
    cpSync("packages", join(fixture, "packages"), { recursive: true });
    const catalogTarget = join(fixture, "scripts", "build-skill-catalog.mjs");
    mkdirSync(dirname(catalogTarget), { recursive: true });
    cpSync("scripts/build-skill-catalog.mjs", catalogTarget);
    return fixture;
}

function runAnalyzer(root) {
    const result = spawnSync(process.execPath, [analyzerPath, "--root", root, "--check", "--json"], { encoding: "utf8" });
    assert.equal(result.signal, null, result.stderr);
    assert.doesNotThrow(() => JSON.parse(result.stdout), result.stderr);
    return { status: result.status, body: JSON.parse(result.stdout) };
}
