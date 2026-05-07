import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
const upstreamRepo = "garrytan/gstack";
const upstreamCommit = "30fe6bb11c6915e6264440b8a044ed0dcfbe06e0";
const treeUrl = `https://api.github.com/repos/${upstreamRepo}/git/trees/${upstreamCommit}?recursive=1`;
const writeFidelityDocs = process.argv.includes("--write-docs");
const isStrictFidelityAudit = process.argv.includes("--strict");
const fidelityJsonOut = readCliOption("--json-out") ?? ".product-build-stacks/gstack-fidelity/latest/audit.json";
const fidelityDocsOut = readCliOption("--docs-out") ?? "docs/gstack-fidelity-audit.md";
const gstackMappingRows = parseGstackMappingRows(readFileSync("docs/gstack-to-product-mapping.md", "utf8"));
const gstackTree = await fetchGstackTree();
const fidelityRows = gstackMappingRows.map((mapping) => auditGstackMapping(mapping, gstackTree));
const fidelitySummary = summarizeFidelityRows(fidelityRows);
writeJsonFile(fidelityJsonOut, {
    upstreamRepo,
    upstreamCommit,
    generatedAt: new Date().toISOString(),
    summary: fidelitySummary,
    rows: fidelityRows
});
if (writeFidelityDocs) {
    writeFileSync(fidelityDocsOut, renderFidelityMarkdown(fidelityRows, fidelitySummary));
}
const fatalFidelityRows = fidelityRows.filter((row) => row.status === "missing" || row.status === "stub");
console.log(`gstack fidelity audit: ${fidelitySummary.total} mappings at ${upstreamRepo}@${upstreamCommit}`);
console.log(`faithful=${fidelitySummary.faithful} adapted=${fidelitySummary.adapted} partial=${fidelitySummary.partial} stub=${fidelitySummary.stub} missing=${fidelitySummary.missing} intentionally-degraded=${fidelitySummary["intentionally-degraded"]}`);
console.log(`json: ${fidelityJsonOut}`);
if (writeFidelityDocs)
    console.log(`docs: ${fidelityDocsOut}`);
if (isStrictFidelityAudit && fatalFidelityRows.length > 0) {
    console.error(`strict fidelity audit failed: ${fatalFidelityRows.length} stub/missing mappings`);
    for (const row of fatalFidelityRows.slice(0, 20)) {
        console.error(`- ${row.legacy}: ${row.status}; ${row.gaps.join("; ")}`);
    }
    process.exit(1);
}
function parseGstackMappingRows(markdown) {
    const fidelityRows = [];
    for (const line of markdown.split("\n")) {
        if (!line.startsWith("|"))
            continue;
        if (line.includes("Legacy element") || line.includes("---"))
            continue;
        const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
        if (cells.length < 3)
            continue;
        const [legacyCell, productCell, layer] = cells;
        const legacy = legacyCell === "root `SKILL.md`"
            ? "root SKILL.md"
            : extractBacktickValues(legacyCell)[0];
        const products = extractBacktickValues(productCell);
        if (!legacy || products.length === 0)
            continue;
        fidelityRows.push({
            legacy,
            legacyPath: legacy === "root SKILL.md" ? "" : legacy,
            products,
            layer
        });
    }
    return fidelityRows;
}
function extractBacktickValues(value) {
    return [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}
async function fetchGstackTree() {
    const response = await fetch(treeUrl, {
        headers: {
            "accept": "application/vnd.github+json",
            "user-agent": "product-stacks-fidelity-audit"
        }
    });
    if (!response.ok) {
        throw new Error(`failed to fetch ${treeUrl}: ${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    if (!Array.isArray(body.tree))
        throw new Error("unexpected GitHub tree response");
    if (body.truncated)
        throw new Error("upstream GitHub tree response is truncated");
    return body.tree;
}
function auditGstackMapping(mapping, gstackTree) {
    const upstreamEntries = selectUpstreamEntriesForMapping(mapping, gstackTree);
    const upstreamSkillPath = mapping.legacyPath ? `${mapping.legacyPath}/SKILL.md` : "SKILL.md";
    const upstreamTemplatePath = mapping.legacyPath ? `${mapping.legacyPath}/SKILL.md.tmpl` : "SKILL.md.tmpl";
    const upstreamSkill = gstackTree.find((entry) => entry.path === upstreamSkillPath);
    const upstreamTemplate = gstackTree.find((entry) => entry.path === upstreamTemplatePath);
    const upstreamSupport = upstreamEntries.filter((entry) => !entry.path.endsWith("/SKILL.md") && entry.path !== "SKILL.md" && !entry.path.endsWith("/SKILL.md.tmpl") && entry.path !== "SKILL.md.tmpl");
    const productSkillPaths = mapping.products.map(resolveProductSkillPath).filter(Boolean);
    const productSkillBytes = productSkillPaths.reduce((sum, path) => sum + readFileSize(path), 0);
    const productSupport = collectProductSupportEntries(mapping.products);
    const adaptation = readProductAdaptationMetadata(mapping.products);
    const gaps = findFidelityGaps({
        mapping,
        upstreamComparableSize: upstreamTemplate?.size ?? upstreamSkill?.size ?? 0,
        upstreamTemplate,
        upstreamSupport,
        productSkillPaths,
        productSkillBytes,
        productSupport,
        adaptation
    });
    return {
        legacy: mapping.legacy,
        legacyPath: mapping.legacyPath,
        products: mapping.products,
        layer: mapping.layer,
        status: classifyFidelityStatus(gaps),
        upstream: {
            skillPath: upstreamSkillPath,
            skillSize: upstreamSkill?.size ?? 0,
            templatePath: upstreamTemplate?.path,
            templateSize: upstreamTemplate?.size,
            supportCount: upstreamSupport.length,
            supportBytes: sumTreeEntrySizes(upstreamSupport),
            supportKinds: countPathKinds(upstreamSupport.map((entry) => entry.path))
        },
        product: {
            skillPaths: productSkillPaths,
            skillBytes: productSkillBytes,
            supportCount: productSupport.length,
            supportBytes: sumLocalFileSizes(productSupport),
            supportKinds: countPathKinds(productSupport),
            adaptation
        },
        gaps
    };
}
function selectUpstreamEntriesForMapping(mapping, gstackTree) {
    if (!mapping.legacyPath) {
        return gstackTree.filter((entry) => entry.path === "SKILL.md" || entry.path === "SKILL.md.tmpl");
    }
    const prefix = `${mapping.legacyPath}/`;
    return gstackTree.filter((entry) => entry.path.startsWith(prefix));
}
function resolveProductSkillPath(product) {
    if (product === "SKILL.md")
        return "SKILL.md";
    return `.apm/skills/${product}/SKILL.md`;
}
function collectProductSupportEntries(products) {
    const candidates = new Set();
    for (const product of products) {
        addExistingPath(candidates, `.apm/skills/${product}/references`);
        addExistingPath(candidates, `.apm/skills/${product}/src`);
        addExistingPath(candidates, `.apm/skills/${product}/bin`);
        addExistingPath(candidates, `.apm/skills/${product}/test`);
    }
    return [...candidates].flatMap((path) => collectLocalFiles(path));
}
function readProductAdaptationMetadata(products) {
    for (const product of products) {
        if (product === "SKILL.md")
            continue;
        const path = `.apm/skills/${product}/references/gstack-adaptation.json`;
        if (!existsSync(path))
            continue;
        try {
            return JSON.parse(readFileSync(path, "utf8"));
        }
        catch {
            return undefined;
        }
    }
    return undefined;
}
function addExistingPath(paths, path) {
    if (existsSync(path))
        paths.add(path);
}
function collectLocalFiles(path) {
    if (!existsSync(path))
        return [];
    const stat = statSync(path);
    if (stat.isFile())
        return [path];
    const proc = spawnSync("find", [path, "-type", "f"], { encoding: "utf8" });
    if (proc.status !== 0)
        return [];
    return proc.stdout.split("\n").filter(Boolean);
}
function readFileSize(path) {
    return existsSync(path) ? statSync(path).size : 0;
}
function sumTreeEntrySizes(entries) {
    return entries.reduce((sum, entry) => sum + (entry.size ?? 0), 0);
}
function sumLocalFileSizes(paths) {
    return paths.reduce((sum, path) => sum + readFileSize(path), 0);
}
function countPathKinds(paths) {
    const counts = {};
    for (const path of paths) {
        const kind = classifyPathKind(path);
        counts[kind] = (counts[kind] ?? 0) + 1;
    }
    return counts;
}
function classifyPathKind(path) {
    if (path.includes("/test/") || path.startsWith("tests/") || path.includes("/tests/"))
        return "test";
    if (path.includes("/bin/") || path.startsWith("bin/"))
        return "bin";
    if (path.includes("/references/"))
        return "references";
    if (path.includes("/docs/") || path.startsWith("docs/"))
        return "docs";
    if (path.includes("/scripts/") || path.startsWith("scripts/"))
        return "scripts";
    if (path.includes("/src/") || path.endsWith(".mjs"))
        return "src";
    return "other";
}
function findFidelityGaps(input) {
    const gaps = [];
    const missingProducts = input.productSkillPaths.filter((path) => !existsSync(path));
    if (missingProducts.length > 0)
        gaps.push(`missing product skill file(s): ${missingProducts.join(", ")}`);
    if (input.adaptation?.status === "intentionally-degraded") {
        const features = input.adaptation.degradedFeatures?.join(", ") || "documented unsupported features";
        gaps.push(`blocked by product-stacks architecture: ${features}`);
    }
    if (input.upstreamComparableSize >= 10000 && input.productSkillBytes < Math.min(input.upstreamComparableSize * 0.25, 10000)) {
        gaps.push(`product skill text is too thin (${input.productSkillBytes} bytes vs upstream comparable source ${input.upstreamComparableSize} bytes)`);
    }
    const upstreamKinds = countPathKinds(input.upstreamSupport.map((entry) => entry.path));
    const productKinds = countPathKinds(input.productSupport);
    for (const kind of ["src", "bin", "references", "test"]) {
        if ((upstreamKinds[kind] ?? 0) > 0 && (productKinds[kind] ?? 0) === 0) {
            gaps.push(`missing product ${kind} support for upstream ${kind} files`);
        }
    }
    if (input.upstreamSupport.length > 0 && input.productSupport.length === 0) {
        gaps.push(`missing supporting implementation/reference files (${input.upstreamSupport.length} upstream files)`);
    }
    return gaps;
}
function classifyFidelityStatus(gaps) {
    if (gaps.some((gap) => gap.startsWith("missing product skill")))
        return "missing";
    if (gaps.some((gap) => gap.startsWith("blocked by product-stacks architecture")))
        return "intentionally-degraded";
    if (gaps.some((gap) => gap.includes("too thin")))
        return "stub";
    if (gaps.length > 0)
        return "partial";
    return "adapted";
}
function summarizeFidelityRows(fidelityRows) {
    const fidelitySummary = {
        total: fidelityRows.length,
        faithful: 0,
        adapted: 0,
        partial: 0,
        stub: 0,
        missing: 0,
        "intentionally-degraded": 0
    };
    for (const row of fidelityRows)
        fidelitySummary[row.status] += 1;
    return fidelitySummary;
}
function renderFidelityMarkdown(fidelityRows, fidelitySummary) {
    const sorted = [...fidelityRows].sort((a, b) => rankFidelityStatus(a.status) - rankFidelityStatus(b.status) || b.upstream.skillSize - a.upstream.skillSize);
    const table = sorted.map((row) => [
        row.legacy,
        row.products.join(", "),
        row.status,
        formatByteCount(row.upstream.skillSize),
        formatByteCount(row.product.skillBytes),
        row.upstream.supportCount,
        row.product.supportCount,
        row.gaps.join("<br>")
    ]);
    return `# gstack Fidelity Audit

Generated from \`${upstreamRepo}@${upstreamCommit}\`.

This audit measures whether product-stacks is faithfully reproducing gstack behavior under the product-stacks architecture. It is intentionally stricter than skill activation: a skill can activate and still be a stub if it lacks the upstream workflow, artifacts, scripts, references, or tests.

## Summary

| Status | Count |
| --- | ---: |
| faithful | ${fidelitySummary.faithful} |
| adapted | ${fidelitySummary.adapted} |
| partial | ${fidelitySummary.partial} |
| stub | ${fidelitySummary.stub} |
| missing | ${fidelitySummary.missing} |
| intentionally-degraded | ${fidelitySummary["intentionally-degraded"]} |
| total | ${fidelitySummary.total} |

## Criteria

- \`faithful\`: product-stacks has the mapped skill plus comparable workflow detail and supporting files.
- \`adapted\`: product-stacks has the substantive upstream workflow contract, transformed for the product-stacks architecture.
- \`partial\`: product-stacks has meaningful coverage but lacks some upstream support files or contracts.
- \`stub\`: product-stacks has a mapped skill, but its body is materially thinner than upstream.
- \`missing\`: mapped product file is absent.
- \`intentionally-degraded\`: unsupported by design and documented with a concrete fallback.

## Current Findings

| gstack | product-stacks | Status | Upstream SKILL | Product SKILL | Upstream support | Product support | Gaps |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
${table.map((cells) => `| ${cells.join(" | ")} |`).join("\n")}

## Next Implementation Rule

Do not treat \`codex exec\` activation as parity. For every \`stub\` or \`partial\` row, copy and adapt the substantive upstream workflow from \`SKILL.md.tmpl\` or \`SKILL.md\`, then port any required \`src\`, \`bin\`, \`references\`, and tests into product-stacks while preserving:

- external \`product-*\` names,
- source in \`.apm/\`,
- runtime state in \`.product-build-stacks/\`,
- generated installed skill folders under host folders,
- explicit degraded behavior only where the architecture requires it.
`;
}
function rankFidelityStatus(status) {
    return { missing: 0, stub: 1, partial: 2, "intentionally-degraded": 3, adapted: 4, faithful: 5 }[status];
}
function formatByteCount(bytes) {
    if (bytes < 1000)
        return `${bytes} B`;
    return `${Math.round(bytes / 100) / 10} KB`;
}
function writeJsonFile(path, value) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
function readCliOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline)
        return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
