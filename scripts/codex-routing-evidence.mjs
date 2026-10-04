export function extractReadSkillNames(stdout) {
    const names = new Set();
    for (const line of stdout.split("\n")) {
        if (!line.startsWith("{")) continue;
        try {
            const event = JSON.parse(line);
            if (!event.item || !["command_execution", "tool_call", "mcp_tool_call"].includes(event.item.type)) continue;
            const serialized = event.item.type === "command_execution"
                ? String(event.item.command ?? "")
                : JSON.stringify({ input: event.item.input, arguments: event.item.arguments });
            const pattern = /(?:\.agents|\.claude|\.kiro)[/\\]skills[/\\](build-[a-z][a-z0-9-]*)[/\\]SKILL\.md/g;
            for (const match of serialized.matchAll(pattern)) names.add(match[1]);
        }
        catch {
            // Ignore non-event lines.
        }
    }
    return [...names].sort();
}
