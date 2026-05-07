import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const p0Skills = [
  "product-recipe-discovery",
  "product-recipe-autoplan",
  "product-flow-ceoreview",
  "product-flow-designreview",
  "product-flow-engreview",
  "product-flow-devexreview",
  "product-flow-plantune",
  "product-flow-codereview",
  "product-recipe-qa",
  "product-flow-qareport",
  "product-recipe-ship"
];

describe("gstack fidelity ports", () => {
  test("P0 skills keep upstream-derived workflow substance", () => {
    for (const skill of p0Skills) {
      const path = `.apm/skills/${skill}/SKILL.md`;
      const template = `.apm/skills/${skill}/SKILL.md.tmpl`;
      const metadata = `.apm/skills/${skill}/references/gstack-adaptation.json`;
      expect(existsSync(path), path).toBe(true);
      expect(existsSync(template), template).toBe(true);
      expect(existsSync(metadata), metadata).toBe(true);
      const body = readFileSync(path, "utf8");
      expect(body).toContain("Ported from garrytan/gstack");
      expect(body).toContain(".product-build-stacks");
      expect(body).not.toContain("{{");
      expect(body).not.toContain("~/.gstack");
      expect(body).not.toContain("~/.claude/skills/product-stacks");
      expect(body).not.toContain("consumer-installed product-build-stacks skill directory/bin");
    }
  });

  test("discovery preserves the hard office-hours gates", () => {
    const body = readFileSync(".apm/skills/product-recipe-discovery/SKILL.md", "utf8");
    expect(body).toContain("The Six Forcing Questions");
    expect(body).toContain("HARD GATE");
    expect(body).toContain("Do NOT invoke any implementation skill");
    expect(body).toContain("STOP");
    expect(body).toContain(".product-build-stacks/design-docs");
    expect(body).toContain("product-flow-ceoreview");
    expect(body).toContain("product-flow-engreview");
  });

  test("review and qa support files are present", () => {
    expect(existsSync(".apm/skills/product-flow-codereview/checklist.md")).toBe(true);
    expect(existsSync(".apm/skills/product-flow-codereview/specialists/security.md")).toBe(true);
    expect(existsSync(".apm/skills/product-recipe-qa/references/issue-taxonomy.md")).toBe(true);
    expect(existsSync(".apm/skills/product-recipe-qa/templates/qa-report-template.md")).toBe(true);
  });
});
