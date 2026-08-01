import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const skillRoot = ".apm/skills/product-flow-pdmscaffold";
const installer = `${skillRoot}/scripts/create_pdm_docs.py`;
const expectedFiles = [
    "CURRENT_PRODUCT.md",
    "PRODUCT_GAP_ANALYSIS.md",
    "PRODUCT_PLAN.md",
    "README.md",
    "STRATEGY.md",
    "personas/README.md",
    "references/README.md",
    "references/competitive-review-template.md",
    "references/financial-model-template.md",
    "references/hypothesis-ledger-template.md",
    "references/interview-notes-template.md",
    "references/research-brief-template.md",
    "references/source-register-template.md"
];

describe("product-flow-pdmscaffold", () => {
    it("creates the neutral scaffold and refuses every overwrite", () => {
        const projectRoot = mkdtempSync(join(tmpdir(), "product-flow-pdmscaffold-"));
        try {
            const dryRun = runInstaller(projectRoot, "--dry-run");
            assert.equal(dryRun.status, 0, commandFailure(dryRun));

            const creation = runInstaller(projectRoot);
            assert.equal(creation.status, 0, commandFailure(creation));
            assert.match(creation.stdout, /created 13 files/);

            const pdmRoot = join(projectRoot, "docs", "pdm");
            assert.deepEqual(collectFiles(pdmRoot), expectedFiles);
            assertNeutralTemplate(pdmRoot);

            const collision = runInstaller(projectRoot);
            assert.equal(collision.status, 3, commandFailure(collision));
            assert.match(collision.stderr, /no files were written/);
            assert.match(collision.stderr, /never overwrites files/);
            assert.deepEqual(collectFiles(pdmRoot), expectedFiles);
        }
        finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });

    it("refuses a destination directory symlink without writing outside the project", () => {
        const projectRoot = mkdtempSync(join(tmpdir(), "product-flow-pdmscaffold-project-"));
        const outsideRoot = mkdtempSync(join(tmpdir(), "product-flow-pdmscaffold-outside-"));
        try {
            symlinkSync(outsideRoot, join(projectRoot, "docs"), "dir");

            const creation = runInstaller(projectRoot);
            assert.equal(creation.status, 4, commandFailure(creation));
            assert.match(creation.stderr, /destination contains symbolic links/);
            assert.match(creation.stderr, /no files were written/);
            assert.deepEqual(collectFiles(outsideRoot), []);
        }
        finally {
            rmSync(projectRoot, { recursive: true, force: true });
            rmSync(outsideRoot, { recursive: true, force: true });
        }
    });

    it("refuses a broken destination directory symlink", () => {
        const projectRoot = mkdtempSync(join(tmpdir(), "product-flow-pdmscaffold-broken-"));
        const missingDocsRoot = join(projectRoot, "missing-docs");
        try {
            symlinkSync(missingDocsRoot, join(projectRoot, "docs"), "dir");

            const creation = runInstaller(projectRoot);
            assert.equal(creation.status, 4, commandFailure(creation));
            assert.match(creation.stderr, /destination contains symbolic links/);
            assert.equal(existsSync(missingDocsRoot), false);
        }
        finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });
});

function runInstaller(projectRoot, ...args) {
    return spawnSync("python3", [installer, "--target", projectRoot, ...args], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" }
    });
}

function collectFiles(root) {
    const files = [];
    walk(root, root, files);
    return files.sort();
}

function walk(root, current, files) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) {
            walk(root, path, files);
        }
        else if (entry.isFile()) {
            files.push(relative(root, path));
        }
    }
}

function assertNeutralTemplate(root) {
    const body = collectFiles(root)
        .map((file) => readFileSync(join(root, file), "utf8"))
        .join("\n");
    for (const inheritedTerm of ["nightly", "Kartio", "RevenueCat", "Store Standard"]) {
        assert.equal(body.includes(inheritedTerm), false, `unexpected inherited term: ${inheritedTerm}`);
    }
}

function commandFailure(result) {
    return [result.stdout, result.stderr, result.error?.message]
        .filter(Boolean)
        .join("\n");
}
