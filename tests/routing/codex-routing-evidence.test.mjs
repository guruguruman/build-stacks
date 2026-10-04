import assert from "node:assert/strict";
import { test } from "node:test";
import { extractReadSkillNames } from "../../scripts/codex-routing-evidence.mjs";

test("routing evidence accepts actual SKILL.md reads and ignores agent self-report", () => {
    const jsonl = [
        JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "skill: build-recipe-ship\nI read .agents/skills/build-recipe-ship/SKILL.md" } }),
        JSON.stringify({ type: "item.started", item: { type: "command_execution", command: "sed -n '1,200p' .agents/skills/build-role-staffengineer/SKILL.md" } }),
        JSON.stringify({ type: "item.completed", item: { type: "command_execution", command: "sed -n '1,200p' .agents/skills/build-role-staffengineer/SKILL.md", aggregated_output: ".agents/skills/build-recipe-landdeploy/SKILL.md" } })
    ].join("\n");
    assert.deepEqual(extractReadSkillNames(jsonl), ["build-role-staffengineer"]);
});
