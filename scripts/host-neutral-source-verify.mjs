import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const roots = ["packages"];
const extensions = new Set([".md", ".sh"]);
const forbidden = [
    ["AskUserQuestion", /\bAskUserQuestion\b/g],
    ["WebSearch", /\bWebSearch\b/g],
    ["ToolSearch", /\bToolSearch\b/g],
    ["ExitPlanMode", /\bExitPlanMode\b/g],
    ["CLAUDE_SKILL_DIR", /\bCLAUDE_SKILL_DIR\b/g],
    ["host file tool", /\b(?:Read|Grep|Write|Edit) tool\b/gi],
    ["host agent tool", /\bAgent tool\b/gi],
    ["host file operation", /\b(?:Use|using|via)\s+(?:the\s+)?`?(?:Read|Grep|Glob|Write|Edit)`?(?:\s+tool)?\b/gi],
    ["host tool event", /\btool_use\b|call the tool directly/gi],
    ["mandatory isolated agent", /\bAgent isolated reviewers?\b|\bisolated reviewer_type\b/gi],
    ["legacy slash invocation", /\/(?:cso|design-shotgun|design-html|design-consultation|design-review|devex-review|document-release)\b/g],
    ["slash skill invocation", /(?<![.\w-])\/(?:build-[a-z][a-z0-9-]*|autoplan)\b/g]
];

const findings = [];
for (const root of roots) walk(root);
if (findings.length > 0) {
    console.error(findings.join("\n"));
    process.exit(1);
}
console.log("host-neutral source verify ok");

function walk(path) {
    const stat = statSync(path);
    if (stat.isDirectory()) {
        if (path.includes("/.apm/skills/") || path.endsWith("/.apm/skills") || path === "packages") {
            for (const entry of readdirSync(path).sort()) walk(join(path, entry));
            return;
        }
        for (const entry of readdirSync(path).sort()) walk(join(path, entry));
        return;
    }
    if (!path.includes("/.apm/skills/") || !extensions.has(extname(path))) return;
    const lines = readFileSync(path, "utf8").split("\n");
    lines.forEach((line, index) => {
        for (const [label, pattern] of forbidden) {
            pattern.lastIndex = 0;
            if (pattern.test(line)) findings.push(`${relative(".", path)}:${index + 1}: ${label}`);
        }
    });
}
