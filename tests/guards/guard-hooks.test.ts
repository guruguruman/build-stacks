import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ported guard hooks", () => {
  test("careful hook allows known build artifact cleanup but warns on source deletion", () => {
    const safe = runHook(".apm/skills/product-guard-destructive/bin/check-careful.sh", {
      tool_input: { command: "rm -rf node_modules" }
    });
    expect(JSON.parse(safe)).toEqual({});

    const risky = JSON.parse(runHook(".apm/skills/product-guard-destructive/bin/check-careful.sh", {
      tool_input: { command: "rm -rf src" }
    })) as { permissionDecision?: string; message?: string };
    expect(risky.permissionDecision).toBe("ask");
    expect(risky.message).toContain("product-guard-destructive");
  });

  test("freeze hook denies edits outside the repo-local freeze boundary", () => {
    const root = mkdtempSync(join(tmpdir(), "product-guard-freeze-"));
    tempRoots.push(root);
    const state = join(root, "state");
    const allowed = join(root, "allowed");
    const other = join(root, "other");
    mkdirSync(state, { recursive: true });
    mkdirSync(allowed, { recursive: true });
    mkdirSync(other, { recursive: true });
    writeFileSync(join(state, "freeze-dir.txt"), `${allowed}\n`);

    const inside = runHook(".apm/skills/product-guard-scope/bin/check-freeze.sh", {
      tool_input: { file_path: join(allowed, "ok.ts") }
    }, { PRODUCT_STATE_ROOT: state });
    expect(JSON.parse(inside)).toEqual({});

    const outside = JSON.parse(runHook(".apm/skills/product-guard-scope/bin/check-freeze.sh", {
      tool_input: { file_path: join(other, "no.ts") }
    }, { PRODUCT_STATE_ROOT: state })) as { permissionDecision?: string; message?: string };
    expect(outside.permissionDecision).toBe("deny");
    expect(outside.message).toContain("product-guard-scope");
  });
});

function runHook(path: string, input: unknown, env: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), "product-guard-hook-"));
  tempRoots.push(root);
  const inputPath = join(root, "input.json");
  writeFileSync(inputPath, JSON.stringify(input));
  const proc = Bun.spawnSync(["bash", "-lc", 'cat "$1" | "$2"', "hook-runner", inputPath, path], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe"
  });
  if (proc.exitCode !== 0) {
    throw new Error(`hook failed (${proc.exitCode})\nstdout:\n${proc.stdout.toString()}\nstderr:\n${proc.stderr.toString()}`);
  }
  return proc.stdout.toString().trim();
}
