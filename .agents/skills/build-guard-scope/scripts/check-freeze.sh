#!/usr/bin/env bash
# check-freeze.sh — PreToolUse hook for build-guard-scope skill
# Reads JSON from stdin, checks if file_path is within the freeze boundary.
# Returns {"permissionDecision":"deny","message":"..."} to block, or {} to allow.
set -euo pipefail

# Read stdin
INPUT=$(cat)

# Locate the freeze directory state file
STATE_DIR="${BUILD_STATE_ROOT:-.build-stacks}"
FREEZE_FILE="$STATE_DIR/freeze-dir.txt"

# If no freeze file exists, allow everything (not yet configured)
if [ ! -f "$FREEZE_FILE" ]; then
  echo '{}'
  exit 0
fi

FREEZE_DIR=""
IFS= read -r FREEZE_DIR < "$FREEZE_FILE" || true

# If freeze dir is empty, allow
if [ -z "$FREEZE_DIR" ]; then
  echo '{}'
  exit 0
fi

# Parse and decide in Node. The segment-by-segment resolver follows symlinks
# before applying later `..` components and keeps resolving after nonexistent
# components are popped. It does not depend on GNU `realpath -m`, so it works on
# macOS as well as Linux.
set +e
RESULT=$(printf '%s' "$INPUT" | node -e '
const fs = require("node:fs");
const path = require("node:path");

const freezeInput = process.argv[1];
const cwd = process.argv[2];
let data = "";

function segments(value, root) {
  return value.slice(root.length).split(path.sep).filter(Boolean);
}

function canonicalize(raw) {
  if (typeof raw !== "string" || raw.includes("\0")) throw new Error("invalid path");
  const absolute = path.isAbsolute(raw) ? raw : `${cwd.replace(/\/+$/, "")}/${raw}`;
  let root = path.parse(absolute).root;
  let resolved = root;
  const pending = segments(absolute, root);
  let symlinkHops = 0;

  while (pending.length > 0) {
    const segment = pending.shift();
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      resolved = path.dirname(resolved);
      continue;
    }

    const candidate = path.join(resolved, segment);
    try {
      const stat = fs.lstatSync(candidate);
      if (!stat.isSymbolicLink()) {
        resolved = candidate;
        continue;
      }

      symlinkHops += 1;
      if (symlinkHops > 40) throw new Error("too many symbolic links");
      const target = fs.readlinkSync(candidate);
      if (path.isAbsolute(target)) {
        root = path.parse(target).root;
        resolved = root;
        pending.unshift(...segments(target, root));
      } else {
        pending.unshift(...target.split(path.sep));
      }
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
        resolved = candidate;
        continue;
      }
      throw error;
    }
  }

  return resolved.length > root.length ? resolved.replace(/\/+$/, "") : resolved;
}

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => data += chunk);
process.stdin.on("end", () => {
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    process.stdout.write(JSON.stringify({ permissionDecision: "deny", message: "[build-guard-scope] Input JSON parse failure; edit denied." }));
    process.exitCode = 20;
    return;
  }

  const filePath = parsed?.tool_input?.file_path;
  if (filePath == null || filePath === "") {
    process.stdout.write("{}");
    return;
  }
  if (typeof filePath !== "string" || filePath.includes("\0")) {
    process.stdout.write(JSON.stringify({ permissionDecision: "deny", message: "[build-guard-scope] Input JSON parse failure; edit denied." }));
    process.exitCode = 20;
    return;
  }

  let canonicalFile;
  let canonicalFreeze;
  try {
    canonicalFile = canonicalize(filePath);
    canonicalFreeze = canonicalize(freezeInput);
  } catch {
    process.stdout.write(JSON.stringify({ permissionDecision: "deny", message: "[build-guard-scope] Path resolution failure; edit denied." }));
    process.exitCode = 22;
    return;
  }

  const freezePrefix = canonicalFreeze.endsWith(path.sep) ? canonicalFreeze : `${canonicalFreeze}${path.sep}`;
  const inside = canonicalFile === canonicalFreeze || canonicalFile.startsWith(freezePrefix);
  if (inside) {
    process.stdout.write("{}");
    return;
  }

  process.stdout.write(JSON.stringify({
    permissionDecision: "deny",
    message: `[build-guard-scope] Blocked: ${canonicalFile} is outside the freeze boundary (${canonicalFreeze}). Only edits within the frozen directory are allowed.`
  }));
  process.exitCode = 21;
});
' "$FREEZE_DIR" "$(pwd)" 2>/dev/null)
STATUS=$?
set -e

case "$STATUS" in
  0)
    printf '%s\n' "$RESULT"
    ;;
  20)
    PATTERN="json_parse_failure"
    ;;
  21)
    PATTERN="boundary_deny"
    ;;
  22)
    PATTERN="path_resolution_failure"
    ;;
  *)
    PATTERN="hook_failure"
    RESULT='{"permissionDecision":"deny","message":"[build-guard-scope] Hook failure; edit denied."}'
    ;;
esac

if [ "$STATUS" -ne 0 ]; then
  mkdir -p .build-stacks/analytics 2>/dev/null || true
  echo '{"event":"hook_fire","skill":"build-guard-scope","pattern":"'"$PATTERN"'","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}' >> .build-stacks/analytics/skill-usage.jsonl 2>/dev/null || true
  printf '%s\n' "$RESULT"
fi
