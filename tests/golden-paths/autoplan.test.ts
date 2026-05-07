import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("autoplan guide", () => {
  test("is available as a product recipe", () => {
    const body = readFileSync(".apm/skills/product-recipe-autoplan/SKILL.md", "utf8");
    expect(body).toContain("product-recipe-autoplan");
    expect(body).toContain("decisions");
  });
});
