import { existsSync, readFileSync } from "node:fs";
import { productSkills } from "./apm-skill-list";

const mappingMarkdown = readFileSync("docs/gstack-to-product-mapping.md", "utf8");
const mappingVerifyFailures: string[] = [];
const mappingVerifyMode = readMappingVerifyMode();

const gstackBaselineCommit = "bf65487162ce5e4330efc43632ca945b640ebc16";

console.log(`gstack baseline: ${gstackBaselineCommit}`);
console.log(`gstack mapping verify mode: ${mappingVerifyMode}`);

for (const skill of productSkills) {
  if (!mappingMarkdown.includes(skill.name)) {
    mappingVerifyFailures.push(`mapping does not mention ${skill.name}`);
  }
}

const gstackMappingRows = mappingMarkdown
  .split("\n")
  .filter((line) => (line.startsWith("| `") || line.startsWith("| root `")) && !line.includes("Legacy element"));

if (gstackMappingRows.length < 45) {
  mappingVerifyFailures.push(`expected at least 45 legacy mapping rows, found ${gstackMappingRows.length}`);
}

const gstackLegacyNames = gstackMappingRows.map((row) => row.split("|")[1]?.trim()).filter(Boolean);
const duplicateGstackLegacyNames = gstackLegacyNames.filter((name, index) => gstackLegacyNames.indexOf(name) !== index);
if (duplicateGstackLegacyNames.length > 0) {
  mappingVerifyFailures.push(`duplicate legacy mappings: ${[...new Set(duplicateGstackLegacyNames)].join(", ")}`);
}

if (mappingVerifyMode === "usability" || mappingVerifyMode === "all") {
  verifyMappingUsability();
}

if (mappingVerifyFailures.length > 0) {
  console.error(mappingVerifyFailures.join("\n"));
  process.exit(1);
}

console.log(`gstack mapping verify ok: ${gstackMappingRows.length} legacy mappings, ${productSkills.length} product skills`);

function readMappingVerifyMode(): "surface" | "usability" | "all" {
  const modeFlagIndex = process.argv.indexOf("--mode");
  const explicit = process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1]
    ?? (modeFlagIndex >= 0 ? process.argv[modeFlagIndex + 1] : undefined);
  if (!explicit || explicit === "surface") return "surface";
  if (explicit === "usability" || explicit === "all") return explicit;
  mappingVerifyFailures.push(`unknown gstack mapping verify mode: ${explicit}`);
  return "surface";
}

function verifyMappingUsability() {
  const requiredDocs = [
    "README.md",
    "docs/release-acceptance-scenarios.md",
    "docs/release-acceptance-skill-matrix.md"
  ];
  for (const file of requiredDocs) {
    if (!existsSync(file)) mappingVerifyFailures.push(`missing usability doc: ${file}`);
  }

  const readme = existsSync("README.md") ? readFileSync("README.md", "utf8") : "";
  for (const phrase of ["Install", "Browser Runtime", "Troubleshooting", "official `agent-browser`", "product-browser-runner", "screenshot"]) {
    if (!readme.includes(phrase)) mappingVerifyFailures.push(`README missing usability phrase: ${phrase}`);
  }

  const skeletonSkills = productSkills
    .filter((skill) => readFileSync(`.apm/skills/${skill.name}/SKILL.md`, "utf8").includes("Status: skeleton"))
    .map((skill) => skill.name);
  if (skeletonSkills.length > 0) {
    mappingVerifyFailures.push(`skeleton skills remain (${skeletonSkills.length}): ${skeletonSkills.slice(0, 10).join(", ")}${skeletonSkills.length > 10 ? ", ..." : ""}`);
  }
}
