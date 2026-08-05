#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = new Set(process.argv.slice(2));
const root = resolve(readOption("--root") ?? process.cwd());
const json = args.has("--json");
const check = args.has("--check");
const findings = [];
const legacyIdentifierPattern = new RegExp([
    "product-",
    "(?:browser|flow|guard|internal|recipe|role|runtime|source)-",
    "|\\.product-",
    "build-stacks"
].join(""));
const manifests = discoverManifests(root);
const skills = discoverSkills(root);
const packageGraph = buildPackageGraph(manifests);
const cycles = findCycles(packageGraph);
for (const cycle of cycles) {
    findings.push({ severity: "error", code: "package-cycle", message: cycle.join(" -> ") });
}

for (const [name, entries] of groupBy(skills, (skill) => skill.name)) {
    if (entries.length > 1) {
        findings.push({ severity: "error", code: "duplicate-skill", message: `${name}: ${entries.map((entry) => entry.path).join(", ")}` });
    }
}

for (const skill of skills) {
    if (skill.declaredName && skill.declaredName !== skill.name) {
        findings.push({ severity: "error", code: "skill-name-mismatch", message: `${skill.path}: ${skill.declaredName} != ${skill.name}` });
    }
    for (const path of skill.legacyFiles) findings.push({ severity: "error", code: "legacy-identifier", message: path });
}

const catalog = await loadCatalog(root);
const closures = {};
if (catalog) {
    const actualNames = new Set(skills.map((skill) => skill.name));
    const catalogNames = new Set(catalog.buildSkills.map((skill) => skill.name));
    for (const name of catalogNames) if (!actualNames.has(name)) findings.push({ severity: "error", code: "missing-skill", message: name });
    for (const name of actualNames) if (!catalogNames.has(name)) findings.push({ severity: "error", code: "unmapped-skill", message: name });
    for (const skill of catalog.buildSkills) {
        const actual = skills.find((entry) => entry.name === skill.name);
        if (actual && actual.package !== skill.package) {
            findings.push({ severity: "error", code: "package-drift", message: `${skill.name}: catalog=${skill.package} disk=${actual.package}` });
        }
        for (const dependency of skill.benefitsFrom) {
            if (!catalogNames.has(dependency)) findings.push({ severity: "error", code: "unknown-benefit", message: `${skill.name} -> ${dependency}` });
        }
    }
    for (const pkg of catalog.buildPackages) {
        const manifestPath = `${pkg.path}/apm.yml`;
        const manifest = manifests.find((entry) => entry.path === manifestPath);
        const expectedDependencies = pkg.dependencies.map((dependency) => `../${dependency}`);
        if (!manifest) {
            findings.push({ severity: "error", code: "missing-package-manifest", message: manifestPath });
            closures[pkg.id] = [];
            continue;
        }
        if (manifest.dependencies.join("\n") !== expectedDependencies.join("\n")) {
            findings.push({
                severity: "error",
                code: "package-dependency-drift",
                message: `${manifestPath}: catalog=${expectedDependencies.join(",") || "none"} manifest=${manifest.dependencies.join(",") || "none"}`
            });
        }
        closures[pkg.id] = packageClosureFromGraph(pkg.name, packageGraph, catalog.buildPackages, skills);
    }
    const rootManifest = manifests.find((manifest) => manifest.path === "apm.yml");
    const expectedRootDependencies = ["./packages/maintainer"];
    if (!rootManifest || rootManifest.dependencies.join("\n") !== expectedRootDependencies.join("\n")) {
        findings.push({ severity: "error", code: "root-umbrella-drift", message: `expected ${expectedRootDependencies.join(", ")}` });
    }
    if ((closures.maintainer?.length ?? 0) !== catalog.buildSkills.length) {
        findings.push({ severity: "error", code: "incomplete-root-closure", message: `maintainer=${closures.maintainer?.length ?? 0}, catalog=${catalog.buildSkills.length}` });
    }
}

const report = {
    root,
    manifests: manifests.map((manifest) => ({ path: manifest.path, name: manifest.name, version: manifest.version, dependencies: manifest.dependencies })),
    packageGraph: Object.fromEntries([...packageGraph].map(([name, deps]) => [name, [...deps].sort()])),
    closures,
    skillCount: skills.length,
    skills: skills.map(({ name, package: packageId, path }) => ({ name, package: packageId, path })),
    findings,
    residualRisk: catalog ? [] : ["No scripts/build-skill-catalog.mjs was found; ownership and optional skill relationships were not verified."],
    nextHandoff: findings.some((finding) => finding.severity === "error") ? "Resolve errors before moving or releasing skills." : "Review warnings and request implementation separately if moves are desired."
};

if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
    console.log(`build stack: ${root}`);
    console.log(`packages: ${manifests.length - (manifests.some((manifest) => manifest.path === "apm.yml") ? 1 : 0)} + root`);
    console.log(`skills: ${skills.length}`);
    for (const finding of findings) console.log(`[${finding.severity}] ${finding.code}: ${finding.message}`);
    if (findings.length === 0) console.log("findings: none");
    for (const [packageId, names] of Object.entries(closures)) console.log(`closure ${packageId}: ${names.length}`);
}

if (check && findings.some((finding) => finding.severity === "error")) process.exitCode = 1;

function discoverManifests(repoRoot) {
    const paths = ["apm.yml"];
    const packagesRoot = join(repoRoot, "packages");
    if (existsSync(packagesRoot)) {
        for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
            if (entry.isDirectory() && existsSync(join(packagesRoot, entry.name, "apm.yml"))) paths.push(join("packages", entry.name, "apm.yml"));
        }
    }
    return paths.filter((path) => existsSync(join(repoRoot, path))).map((path) => parseManifest(repoRoot, path));
}

function parseManifest(repoRoot, path) {
    const body = readFileSync(join(repoRoot, path), "utf8");
    const dependencies = [];
    let inApmDependencies = false;
    for (const line of body.split("\n")) {
        if (/^dependencies:/.test(line)) inApmDependencies = false;
        if (/^  apm:/.test(line)) inApmDependencies = true;
        else if (/^  [a-zA-Z]/.test(line) && !/^  apm:/.test(line)) inApmDependencies = false;
        const match = inApmDependencies ? line.match(/^    - path:\s*(.+)$/) : null;
        if (match) dependencies.push(match[1].trim());
    }
    return {
        path,
        directory: dirname(path),
        name: body.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? path,
        version: body.match(/^version:\s*(.+)$/m)?.[1]?.trim() ?? "unknown",
        dependencies
    };
}

function buildPackageGraph(items) {
    const graph = new Map(items.map((manifest) => [manifest.name, new Set()]));
    const byDirectory = new Map(items.map((manifest) => [normalizePath(manifest.directory), manifest.name]));
    for (const manifest of items) {
        for (const dependency of manifest.dependencies) {
            const resolved = normalizePath(relative(root, resolve(root, manifest.directory, dependency)) || ".");
            const target = byDirectory.get(resolved);
            if (target) graph.get(manifest.name).add(target);
            else findings.push({ severity: "error", code: "unknown-package-path", message: `${manifest.path}: ${dependency}` });
        }
    }
    return graph;
}

function discoverSkills(repoRoot) {
    const result = [];
    walk(repoRoot, repoRoot, result);
    return result;
}

function walk(repoRoot, current, result) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
        if ([".git", "node_modules", "apm_modules", "tmp", ".build-stacks", ".agents", ".claude", ".kiro"].includes(entry.name)) continue;
        const path = join(current, entry.name);
        if (entry.isDirectory()) {
            if (existsSync(join(path, "SKILL.md")) && path.includes(`${join(".apm", "skills")}`)) {
                const body = readFileSync(join(path, "SKILL.md"), "utf8");
                const rel = normalizePath(relative(repoRoot, join(path, "SKILL.md")));
                const packageId = rel.match(/^packages\/([^/]+)\//)?.[1] ?? "root";
                result.push({
                    name: entry.name,
                    declaredName: body.match(/^name:\s*([^\n]+)$/m)?.[1]?.replace(/^['"]|['"]$/g, ""),
                    package: packageId,
                    path: rel,
                    body,
                    legacyFiles: discoverLegacyFiles(repoRoot, path)
                });
                continue;
            }
            walk(repoRoot, path, result);
        }
    }
}

function discoverLegacyFiles(repoRoot, skillRoot) {
    const matches = [];
    walkSkillFiles(skillRoot, (path) => {
        if (!/\.(?:md|mjs|js|py|sh|ya?ml|json|toml)$/.test(path)) return;
        const body = readFileSync(path, "utf8");
        if (legacyIdentifierPattern.test(body)) {
            matches.push(normalizePath(relative(repoRoot, path)));
        }
    });
    return matches;
}

function walkSkillFiles(current, visit) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) walkSkillFiles(path, visit);
        else if (entry.isFile()) visit(path);
    }
}

function packageClosureFromGraph(startName, graph, packages, discoveredSkills) {
    const visited = new Set();
    const visit = (name) => {
        if (visited.has(name)) return;
        visited.add(name);
        for (const dependency of graph.get(name) ?? []) visit(dependency);
    };
    visit(startName);
    const packageIds = new Set(packages.filter((pkg) => visited.has(pkg.name)).map((pkg) => pkg.id));
    return discoveredSkills.filter((skill) => packageIds.has(skill.package)).map((skill) => skill.name).sort();
}

function findCycles(graph) {
    const cycles = [];
    const visiting = new Set();
    const visited = new Set();
    const visit = (node, trail) => {
        if (visiting.has(node)) {
            const start = trail.indexOf(node);
            cycles.push([...trail.slice(start), node]);
            return;
        }
        if (visited.has(node)) return;
        visiting.add(node);
        for (const dependency of graph.get(node) ?? []) visit(dependency, [...trail, node]);
        visiting.delete(node);
        visited.add(node);
    };
    for (const node of graph.keys()) visit(node, []);
    return cycles;
}

async function loadCatalog(repoRoot) {
    const path = join(repoRoot, "scripts", "build-skill-catalog.mjs");
    return existsSync(path) ? import(`${pathToFileURL(path).href}?t=${Date.now()}`) : null;
}

function groupBy(values, key) {
    const groups = new Map();
    for (const value of values) {
        const groupKey = key(value);
        groups.set(groupKey, [...(groups.get(groupKey) ?? []), value]);
    }
    return groups;
}

function normalizePath(path) {
    return path.replaceAll("\\", "/").replace(/^\.\//, "") || ".";
}

function readOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
