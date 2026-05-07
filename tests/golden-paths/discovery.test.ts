import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("discovery guide", () => {
  test("is available as a product recipe", () => {
    const body = readFileSync(".apm/skills/product-recipe-discovery/SKILL.md", "utf8");
    expect(body).toContain("product-recipe-discovery");
    expect(body).toContain("HARD GATE");
    expect(body).toContain("The Six Forcing Questions");
    expect(body).toContain(".product-build-stacks/design-docs");
  });
});
