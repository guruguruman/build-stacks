import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageOut = resolve(repoRoot, readCliOption("--out") ?? "tmp/build-stacks-package");
const ownerMarker = `${packageOut}.build-stacks-package-owner.json`;
const packageSourcePaths = [
    ".apmignore",
    "apm.yml",
    "packages",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "CHANGELOG.md",
    "docs",
    "package.json",
    "package-lock.json",
    "scripts"
];
const requiredPackagePaths = ["apm.yml", "packages", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "CHANGELOG.md", "package.json", "scripts"];
const forbiddenPackagePaths = [
    "SKILL.md", "SKILL.md.tmpl", "tests", "node_modules", "apm_modules", "tmp", ".product", ".build-stacks",
    ".agents", ".claude", ".kiro", ".cursor", ".github", ".opencode"
];

assertSafePackageOut(packageOut);
assertOwnedOrEmptyPackageOut(packageOut);
rmSync(packageOut, { recursive: true, force: true });
mkdirSync(packageOut, { recursive: true });
writeFileSync(ownerMarker, `${JSON.stringify({ owner: "build-stacks/apm-package-prepare", output: packageOut })}\n`);
for (const path of packageSourcePaths) {
    const source = join(repoRoot, path);
    if (!existsSync(source)) continue;
    const target = join(packageOut, path);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true });
}

for (const path of requiredPackagePaths) {
    if (!existsSync(join(packageOut, path))) throw new Error(`prepared package missing required path: ${path}`);
}
for (const path of forbiddenPackagePaths) {
    if (existsSync(join(packageOut, path))) throw new Error(`prepared package includes forbidden path: ${path}`);
}

console.log(`prepared build-stacks package at ${packageOut}`);

function readCliOption(name) {
    const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertSafePackageOut(output) {
    const resolvedOutput = resolvePhysicalPath(output);
    const resolvedOutputLocation = resolve(resolvePhysicalPath(dirname(output)), basename(output));
    const resolvedRepoRoot = realpathSync(repoRoot);
    if (isSameOrWithin(output, repoRoot) || isSameOrWithin(resolvedOutput, resolvedRepoRoot) || isSameOrWithin(resolvedOutputLocation, resolvedRepoRoot)) {
        throw new Error(`refusing unsafe package output: ${output} is the repository root or one of its ancestors`);
    }

    for (const path of packageSourcePaths) {
        const source = join(repoRoot, path);
        if (!existsSync(source)) continue;
        const resolvedSource = realpathSync(source);
        const lexicalOverlap = isSameOrWithin(output, source) || isSameOrWithin(source, output);
        const physicalOverlap = isSameOrWithin(resolvedOutput, resolvedSource) || isSameOrWithin(resolvedSource, resolvedOutput);
        const locationOverlap = isSameOrWithin(resolvedOutputLocation, resolvedSource) || isSameOrWithin(resolvedSource, resolvedOutputLocation);
        if (lexicalOverlap || physicalOverlap || locationOverlap) {
            throw new Error(`refusing unsafe package output: ${output} overlaps package source ${source}`);
        }
    }

    if (!isAllowedPackageOutput(output, resolvedOutput, resolvedOutputLocation)) {
        throw new Error(`refusing unsafe package output: ${output} is outside a dedicated build-stacks temporary path`);
    }
}

function assertOwnedOrEmptyPackageOut(output) {
    if (!existsSync(output)) return;
    if (statSync(output).isDirectory() && readdirSync(output).length === 0) return;
    if (!existsSync(ownerMarker)) {
        throw new Error(`refusing to replace existing package output without owner marker: ${output}`);
    }
    let marker;
    try {
        marker = JSON.parse(readFileSync(ownerMarker, "utf8"));
    }
    catch {
        throw new Error(`refusing to replace existing package output with invalid owner marker: ${output}`);
    }
    if (marker.owner !== "build-stacks/apm-package-prepare" || marker.output !== output) {
        throw new Error(`refusing to replace existing package output with invalid owner marker: ${output}`);
    }
}

function isAllowedPackageOutput(output, resolvedOutput, resolvedOutputLocation) {
    const resolvedRepoRoot = realpathSync(repoRoot);
    const repoTemporaryRoots = [
        join(repoRoot, "tmp"),
        join(repoRoot, ".build-stacks", "tmp")
    ];
    const inRepoTemporaryRoot = repoTemporaryRoots.some((root) => isStrictlyWithin(root, output) || isStrictlyWithin(realpathOrResolved(root), resolvedOutputLocation));
    if (inRepoTemporaryRoot && isStrictlyWithin(resolvedRepoRoot, resolvedOutput) && isStrictlyWithin(resolvedRepoRoot, resolvedOutputLocation)) return true;

    const legacySmokePackage = join(repoRoot, ".build-stacks", "tmp-codex-skill-smoke", "package");
    if (output === legacySmokePackage && isStrictlyWithin(resolvedRepoRoot, resolvedOutput)) return true;

    const osTemporaryRoot = realpathSync(tmpdir());
    if (!isStrictlyWithin(osTemporaryRoot, resolvedOutput)) return false;
    const firstSegment = relative(osTemporaryRoot, resolvedOutput).split(sep)[0];
    return firstSegment.startsWith("build-stacks-") || firstSegment.startsWith("build-browser-core-smoke-");
}

function realpathOrResolved(path) {
    return existsSync(path) ? realpathSync(path) : resolvePhysicalPath(path);
}

function resolvePhysicalPath(path) {
    let existingAncestor = path;
    const missingSegments = [];
    while (!existsSync(existingAncestor)) {
        const parent = dirname(existingAncestor);
        if (parent === existingAncestor) break;
        missingSegments.unshift(basename(existingAncestor));
        existingAncestor = parent;
    }
    return resolve(realpathSync(existingAncestor), ...missingSegments);
}

function isSameOrWithin(parent, candidate) {
    const pathFromParent = relative(parent, candidate);
    return pathFromParent === "" || (pathFromParent !== ".." && !pathFromParent.startsWith(`..${sep}`) && !isAbsolute(pathFromParent));
}

function isStrictlyWithin(parent, candidate) {
    return parent !== candidate && isSameOrWithin(parent, candidate);
}
