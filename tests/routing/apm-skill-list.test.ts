import { describe, expect, test } from "bun:test";
import { productSkills, isValidProductSkillName } from "../../scripts/apm-skill-list";

describe("APM skill list", () => {
  test("contains only product names", () => {
    expect(productSkills.length).toBeGreaterThanOrEqual(52);
    expect(productSkills.every((skill) => isValidProductSkillName(skill.name))).toBe(true);
  });
});
