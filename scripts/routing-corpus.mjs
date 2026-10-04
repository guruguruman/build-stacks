import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const corpusPath = fileURLToPath(new URL("../tests/fixtures/routing-corpus.json", import.meta.url));
export const routingCorpus = JSON.parse(readFileSync(corpusPath, "utf8"));
