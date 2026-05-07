import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { productSkills } from "./apm-skill-list.mjs";
const failures = [];
requireText("LICENSE", ["MIT License", "Permission is hereby granted"]);
requireText("CHANGELOG.md", ["## 1.0.0", "1.0.0-release"]);
requireText("docs/release-acceptance-skill-matrix.md", productSkills.map((skill) => `| \`${skill.name}\` |`));
for (const skill of productSkills) {
    const metadataPath = join(".apm/skills", skill.name, "references/gstack-adaptation.json");
    if (!existsSync(metadataPath)) {
        failures.push(`missing adaptation metadata: ${metadataPath}`);
        continue;
    }
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    if (metadata.product !== skill.name)
        failures.push(`${metadataPath} product must be ${skill.name}`);
    if (metadata.license !== "MIT")
        failures.push(`${metadataPath} license must be MIT`);
    if (metadata.sourceKind === "original") {
        if (metadata.status !== "authored")
            failures.push(`${metadataPath} original metadata status must be authored`);
        if (!metadata.strategy)
            failures.push(`${metadataPath} missing strategy`);
    }
    else {
        for (const key of ["upstreamRepo", "upstreamCommit", "sourcePath", "status", "strategy"]) {
            if (!metadata[key])
                failures.push(`${metadataPath} missing ${key}`);
        }
        if (metadata.upstreamRepo !== "garrytan/gstack")
            failures.push(`${metadataPath} upstreamRepo must be garrytan/gstack`);
    }
}
if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}
console.log(`release license verify ok: ${productSkills.length} skills`);
function requireText(path, needles) {
    if (!existsSync(path)) {
        failures.push(`missing required release file: ${path}`);
        return;
    }
    const body = readFileSync(path, "utf8");
    for (const needle of needles) {
        if (!body.includes(needle))
            failures.push(`${path} missing required text: ${needle}`);
    }
}
