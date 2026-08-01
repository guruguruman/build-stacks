import { spawnSync } from "node:child_process";

const failures = [];

runRequiredGitCheck(["diff", "--check"]);
runRequiredGitCheck(["diff", "--cached", "--check"]);

const untrackedResult = spawnSync(
    "git",
    ["ls-files", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" }
);
if (untrackedResult.status !== 0) {
    failures.push(commandFailure("git ls-files --others --exclude-standard -z", untrackedResult));
}
else {
    for (const path of untrackedResult.stdout.split("\0").filter(Boolean)) {
        const result = spawnSync(
            "git",
            ["diff", "--no-index", "--check", "--", "/dev/null", path],
            { encoding: "utf8" }
        );
        // --no-index returns 1 for an ordinary clean-file difference and >1 for
        // whitespace errors or execution failures.
        if (result.status === null || result.status > 1) {
            failures.push(commandFailure(`git diff --no-index --check -- /dev/null ${path}`, result));
        }
    }
}

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log("repository whitespace verify ok");

function runRequiredGitCheck(args) {
    const result = spawnSync("git", args, { encoding: "utf8" });
    if (result.status !== 0)
        failures.push(commandFailure(`git ${args.join(" ")}`, result));
}

function commandFailure(command, result) {
    return [
        `$ ${command}`,
        result.stdout?.trim(),
        result.stderr?.trim(),
        result.error?.message
    ].filter(Boolean).join("\n");
}
