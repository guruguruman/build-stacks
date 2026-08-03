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

    it("does not overwrite a destination created after collision preflight", () => {
        const projectRoot = mkdtempSync(join(tmpdir(), "product-flow-pdmscaffold-race-"));
        try {
            const probe = spawnSync("python3", ["-c", raceProbe, installer, projectRoot], {
                cwd: process.cwd(),
                encoding: "utf8",
                env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" }
            });

            assert.equal(probe.status, 0, commandFailure(probe));
            assert.match(probe.stdout, /status=3/);
            assert.match(probe.stdout, /user_content_survived=True/);
            assert.match(probe.stdout, /created_files_remaining=1/);
        }
        finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });
});

const raceProbe = String.raw`
import argparse
import importlib.util
import sys
from pathlib import Path

installer = Path(sys.argv[1]).resolve()
project_root = Path(sys.argv[2]).resolve()
spec = importlib.util.spec_from_file_location("pdm_scaffold_race_test", installer)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.parse_args = lambda: argparse.Namespace(target=str(project_root), dry_run=False)

original_copy = module.copy_file_exclusively
injected = {"calls": 0, "path": None}

def racing_copy(source, destination):
    injected["calls"] += 1
    if injected["calls"] == 2:
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text("user-created-during-race\n", encoding="utf-8")
        injected["path"] = destination
    return original_copy(source, destination)

module.copy_file_exclusively = racing_copy
status = module.main()
remaining = sorted(path for path in (project_root / "docs" / "pdm").rglob("*") if path.is_file())
print(f"status={status}")
print(f"user_content_survived={injected['path'].read_text(encoding='utf-8') == 'user-created-during-race' + chr(10)}")
print(f"created_files_remaining={len(remaining)}")
`;

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
