import { spawnSync } from "node:child_process";

export const expectedApmVersion = "0.26.0";

export const canonicalApmTargets = [
    "copilot",
    "claude",
    "cursor",
    "opencode",
    "codex",
    "gemini",
    "windsurf",
    "kiro"
];

export const installedSkillRoots = [
    ".agents/skills",
    ".claude/skills",
    ".kiro/skills"
];

export const retiredLegacySkillRoots = [
    ".cursor/skills",
    ".github/skills",
    ".opencode/skills"
];

export const targetSkillRoots = {
    agents: [".agents/skills"],
    "agent-skills": [".agents/skills"],
    codex: [".agents/skills"],
    cursor: [".agents/skills"],
    copilot: [".agents/skills"],
    vscode: [".agents/skills"],
    opencode: [".agents/skills"],
    gemini: [".agents/skills"],
    windsurf: [".agents/skills"],
    claude: [".claude/skills"],
    kiro: [".kiro/skills"],
    all: [".agents/skills", ".claude/skills", ".kiro/skills"]
};

export function verifyApmCliVersion(cwd = ".") {
    const result = spawnSync("apm", ["--version"], {
        cwd,
        encoding: "utf8"
    });
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    if (result.status !== 0) {
        throw new Error(`apm --version failed (${result.status}): ${output || "no output"}`);
    }
    if (!output.includes(`version ${expectedApmVersion}`)) {
        throw new Error(`APM ${expectedApmVersion} is required; found: ${output || "unknown"}`);
    }
    return output;
}
