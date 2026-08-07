#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root ?? ".");
const tracker = args.tracker ?? "local";
const context = args.context ?? "single";
const write = args.write === true;
const triage = args.triage === true;
const marker = "<!-- Managed by build-flow-projectsetup -->";

if (!new Set(["github", "local"]).has(tracker)) fail(`unsupported tracker: ${tracker}`);
if (!new Set(["single", "multi"]).has(context)) fail(`unsupported context layout: ${context}`);
if (!existsSync(root)) fail(`root does not exist: ${root}`);

const desired = new Map([
    ["docs/agents/issue-tracker.md", issueTrackerDoc(tracker)],
    ["docs/agents/domain.md", domainDoc(context)],
    [".apm/instructions/build-project-context.instructions.md", instructionDoc(context, triage)]
]);
if (triage) desired.set("docs/agents/triage-labels.md", triageDoc());
desired.set(context === "single" ? "CONTEXT.md" : "CONTEXT-MAP.md", context === "single" ? contextDoc() : contextMapDoc());

const changes = [];
const collisions = [];
const writes = [];
for (const [relativePath, body] of desired) {
    const path = join(root, relativePath);
    if (!existsSync(path)) {
        changes.push({ path: relativePath, action: "create" });
        writes.push(() => writeManaged(path, body));
        continue;
    }
    const current = readFileSync(path, "utf8");
    if (current === body) {
        changes.push({ path: relativePath, action: "unchanged" });
        continue;
    }
    if (current.includes(marker) && body.includes(marker)) {
        changes.push({ path: relativePath, action: "update" });
        writes.push(() => writeManaged(path, body));
        continue;
    }
    changes.push({ path: relativePath, action: "preserve" });
    collisions.push(relativePath);
}

const adrPath = join(root, "docs", "adr");
if (!existsSync(adrPath)) {
    changes.push({ path: "docs/adr/", action: "create-directory" });
    writes.push(() => mkdirSync(adrPath, { recursive: true }));
}
if (tracker === "local") {
    const issuesPath = join(root, ".build-stacks", "issues");
    if (!existsSync(issuesPath)) {
        changes.push({ path: ".build-stacks/issues/", action: "create-directory" });
        writes.push(() => mkdirSync(issuesPath, { recursive: true }));
    }
}

// Refuse the complete write set when any user-owned file would be overwritten.
// This keeps setup collision-safe even when the collision is discovered late.
if (write && collisions.length === 0) {
    for (const applyWrite of writes) applyWrite();
}

const report = { root, tracker, context, triage, mode: write ? "write" : "preview", changes, collisions };
console.log(JSON.stringify(report, null, 2));
if (collisions.length > 0) process.exitCode = 2;

function writeManaged(path, body) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
}

function issueTrackerDoc(kind) {
    if (kind === "github") return `${marker}\n# Issue tracker\n\nProvider: GitHub\n\nUse the repository resolved from the current git remote. Read operations require a working \`gh auth status\`. Creating or changing issues, labels, comments, assignments, relationships, or state requires explicit approval immediately before the write.\n`;
    return `${marker}\n# Issue tracker\n\nProvider: local Markdown\n\nStore one ticket per file under \`.build-stacks/issues/<feature>/\`. Use dependency-order numeric prefixes and record blockers by ticket title. No remote writes are supported by this adapter.\n`;
}

function domainDoc(layout) {
    const location = layout === "single" ? "the root CONTEXT.md" : "CONTEXT-MAP.md and the context files it points to";
    return `${marker}\n# Domain documentation\n\nLayout: ${layout}\n\nRead ${location} before naming domain behavior. Glossaries contain domain terms and relationships, not implementation notes. Record only hard-to-reverse, surprising trade-off decisions under \`docs/adr/\`.\n`;
}

function triageDoc() {
    return `${marker}\n# Triage labels\n\n- needs-triage: unclassified\n- needs-info: waiting for specific reporter information\n- ready-for-agent: verified and decision-complete\n- ready-for-human: bounded but requires human judgment or access\n- wontfix: intentionally rejected or invalid\n`;
}

function instructionDoc(layout, includeTriage) {
    const contextPointer = layout === "single" ? "Read CONTEXT.md when domain terminology affects the task." : "Read CONTEXT-MAP.md and then the relevant bounded-context glossary when domain terminology affects the task.";
    const triagePointer = includeTriage ? " Read docs/agents/triage-labels.md before changing triage state." : "";
    return `${marker}\n# project-agent-context\n\n${contextPointer} Read docs/agents/domain.md before changing domain docs. Read docs/agents/issue-tracker.md before issue or ticket operations.${triagePointer}\n`;
}

function contextDoc() {
    return `# Domain context\n\n## Terms\n\nAdd canonical domain terms only after they are resolved.\n\n## Relationships\n\nAdd relationships that clarify how canonical terms interact.\n`;
}

function contextMapDoc() {
    return `# Context map\n\n| Context | Glossary | Owns | Translates with |\n|---|---|---|---|\n| Example | path/to/CONTEXT.md | Replace with owned concepts | Replace with context translations |\n`;
}

function parseArgs(values) {
    const parsed = {};
    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (value === "--write") parsed.write = true;
        else if (value === "--triage") parsed.triage = true;
        else if (["--root", "--tracker", "--context"].includes(value)) parsed[value.slice(2)] = values[++index];
        else fail(`unknown argument: ${value}`);
    }
    return parsed;
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
