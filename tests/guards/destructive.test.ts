import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("destructive guard", () => {
  test("requires explicit approval", () => {
    const body = readFileSync(".apm/instructions/product-guard-destructive.instructions.md", "utf8");
    expect(body).toContain("explicit approval");
  });
});
