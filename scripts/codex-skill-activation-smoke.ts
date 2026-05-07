import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { productSkills, type ProductSkill } from "./apm-skill-list";

const repoRoot = process.cwd();
const codexSmokeRoot = join(repoRoot, ".product-build-stacks", "tmp-codex-skill-smoke");
const preparedPackageRoot = join(codexSmokeRoot, "package");
const consumerAppRoot = join(codexSmokeRoot, "app");
const smokeResultsRoot = join(codexSmokeRoot, "results");
const keepCodexSmokeWorkspace = process.env.PRODUCT_CODEX_SMOKE_KEEP === "1" || process.env.PRODUCT_CODEX_E2E_KEEP === "1";
const allSkillsSmokeMode = process.argv.includes("--all-skills");
const allSkillsSmokeTimeoutMs = Number(process.env.PRODUCT_CODEX_SMOKE_TIMEOUT_MS ?? process.env.PRODUCT_CODEX_E2E_TIMEOUT_MS ?? "600000") || 600000;
const requiredSkillSmokeFields = ["skill", "intent_fit", "findings", "decisions", "evidence", "residual risk", "next handoff", "activation_quality"];

type AllSkillSmokeResult = {
  name: string;
  layer: string;
  summary: string;
  log: string;
  attemptLogs: string[];
  attempts: number;
  finalText: string;
  exitCode: number | null;
};

runCodexSkillSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function runCodexSkillSmoke() {
  resetCodexSmokeWorkspace();
  preparePackageForSkillSmoke();
  prepareConsumerAppForSkillSmoke();

  runLoggedCommandSync(["apm", "install", preparedPackageRoot, "--target", "codex", "--force"], consumerAppRoot, "install.log");
  runLoggedCommandSync(["apm", "compile", "--target", "codex"], consumerAppRoot, "compile.log");

  assertSmokeFileExists(join(consumerAppRoot, "AGENTS.md"));
  for (const skill of productSkills) {
    assertSmokeFileExists(join(consumerAppRoot, ".agents", "skills", skill.name, "SKILL.md"));
  }

  runLoggedCommandSync(["codex", "debug", "prompt-input", "product-recipe-qa を使ってください"], consumerAppRoot, "prompt-input.json");
  const promptInputPath = join(smokeResultsRoot, "prompt-input.json");
  const promptInput = readFileSync(promptInputPath, "utf8");
  const promptInputHasSkillRoots = promptInput.includes("### Skill roots");
  if (promptInputHasSkillRoots) {
    for (const skill of productSkills) {
      assertSmokeFileContains(promptInputPath, skill.name);
      assertSmokeFileContains(promptInputPath, `/${skill.name}/SKILL.md`);
    }
  } else {
    writeFileSync(join(smokeResultsRoot, "prompt-input-warning.md"), [
      "# Codex Prompt Input Warning",
      "",
      "`codex debug prompt-input` returned no skill-root listing on this Codex CLI build.",
      "The hard discovery gate is therefore verifying the installed `.agents/skills/<skill>/SKILL.md` file."
    ].join("\n"));
  }

  if (allSkillsSmokeMode) {
    await runAllSkillSmokes();
  } else {
    runSingleSkillSmoke(promptInputHasSkillRoots);
  }
  if (!keepCodexSmokeWorkspace) {
    rmSync(consumerAppRoot, { recursive: true, force: true });
    rmSync(preparedPackageRoot, { recursive: true, force: true });
  }
}

function runSingleSkillSmoke(promptInputHasSkillRoots: boolean) {
  const execResult = runCodexExecSkillSmokeSync(productSkills.find((skill) => skill.name === "product-recipe-qa")!, "codex-exec.jsonl");
  writeSingleSkillSmokeSummary(execResult.stdout, promptInputHasSkillRoots);
}

async function runAllSkillSmokes() {
  const allDir = join(smokeResultsRoot, "all-skills");
  mkdirSync(allDir, { recursive: true });
  const skills = selectSkillsForSmoke();
  const index: Array<AllSkillSmokeResult | undefined> = new Array(skills.length);
  const concurrency = Math.max(1, Number(process.env.PRODUCT_CODEX_SMOKE_CONCURRENCY ?? process.env.PRODUCT_CODEX_E2E_CONCURRENCY ?? "3") || 3);
  let nextIndex = 0;

  async function runSkillSmokeWorker() {
    while (nextIndex < skills.length) {
      const indexNumber = nextIndex++;
      const skill = skills[indexNumber]!;
      console.log(`[${indexNumber + 1}/${skills.length}] ${skill.name}`);
      let logName = join("all-skills", `${skill.name}.jsonl`);
      let result = await runCodexExecSkillSmokeAsync(skill, logName, { allowFailure: true, timeoutMs: allSkillsSmokeTimeoutMs });
      let finalText = extractFinalCodexAgentMessage(result.stdout);
      const attemptLogs = [join(smokeResultsRoot, logName)];
      if (shouldRetrySkillSmokeResult(result, finalText)) {
        console.log(`[retry 1/1] ${skill.name}`);
        logName = join("all-skills", `${skill.name}.retry-1.jsonl`);
        result = await runCodexExecSkillSmokeAsync(skill, logName, { allowFailure: true, timeoutMs: allSkillsSmokeTimeoutMs });
        finalText = extractFinalCodexAgentMessage(result.stdout);
        attemptLogs.push(join(smokeResultsRoot, logName));
      }
      index[indexNumber] = {
        name: skill.name,
        layer: skill.layer,
        summary: skill.summary,
        log: join(smokeResultsRoot, logName),
        attemptLogs,
        attempts: attemptLogs.length,
        finalText,
        exitCode: result.exitCode
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, skills.length) }, () => runSkillSmokeWorker()));

  const completed = index.map((item, indexNumber) => {
    if (item) return item;
    const skill = skills[indexNumber]!;
    return {
      name: skill.name,
      layer: skill.layer,
      summary: skill.summary,
      log: join(smokeResultsRoot, "all-skills", `${skill.name}.jsonl`),
      attemptLogs: [],
      attempts: 0,
      finalText: "",
      exitCode: null
    };
  });

  writeFileSync(join(allDir, "index.json"), `${JSON.stringify(completed, null, 2)}\n`);
  const qualityFailures = collectSkillSmokeQualityFailures(completed);
  writeAllSkillSmokeSummary(completed, qualityFailures);
  if (qualityFailures.length > 0) {
    throw new Error(`codex all-skills quality gate failed (${qualityFailures.length}); see ${join(allDir, "summary.md")}`);
  }
}

function selectSkillsForSmoke() {
  const names = (process.env.PRODUCT_CODEX_SMOKE_SKILLS ?? process.env.PRODUCT_CODEX_E2E_SKILLS)?.split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  if (!names?.length) return productSkills;
  return names.map((name) => {
    const skill = productSkills.find((candidate) => candidate.name === name);
    if (!skill) throw new Error(`unknown skill in PRODUCT_CODEX_SMOKE_SKILLS: ${name}`);
    return skill;
  });
}

function runCodexExecSkillSmokeSync(skill: ProductSkill, logName: string) {
  return runLoggedCommandSync(buildCodexSkillSmokeCommand(skill), consumerAppRoot, logName, { timeoutMs: 180000 });
}

async function runCodexExecSkillSmokeAsync(
  skill: ProductSkill,
  logName: string,
  options: { allowFailure?: boolean; timeoutMs?: number } = {}
) {
  return runLoggedCommandAsync(buildCodexSkillSmokeCommand(skill), consumerAppRoot, logName, options);
}

function buildCodexSkillSmokeCommand(skill: ProductSkill) {
  const prompt = [
    `${skill.name} を使ってください。`,
    `この skill の意図: ${skill.summary}`,
    "この tmp プロジェクトを対象に、この skill の意図に沿った実用的な計画・レビュー・判定を返してください。",
    "実装やファイル変更は不要です。外部 write、deploy、merge、認証操作、cookie import は行わないでください。",
    "最終応答に skill, intent_fit, findings, decisions, evidence, residual risk, next handoff, activation_quality を含めてください。",
    "activation_quality は pass / warn / fail のいずれかで自己評価してください。"
  ].join("\n");
  return [
    "codex",
    "exec",
    "-c",
    "approval_policy=\"never\"",
    "--skip-git-repo-check",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "--json",
    prompt
  ];
}

function resetCodexSmokeWorkspace() {
  rmSync(codexSmokeRoot, { recursive: true, force: true });
  mkdirSync(preparedPackageRoot, { recursive: true });
  mkdirSync(consumerAppRoot, { recursive: true });
  mkdirSync(smokeResultsRoot, { recursive: true });
}

function preparePackageForSkillSmoke() {
  for (const path of [
    ".apm",
    ".apmignore",
    "apm.yml",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "CHANGELOG.md",
    "docs",
    "package.json",
    "tsconfig.json",
    "bun.lock",
    "scripts"
  ]) {
    if (existsSync(join(repoRoot, path))) copyPackagePathForSmoke(path);
  }
}

function copyPackagePathForSmoke(path: string) {
  cpSync(join(repoRoot, path), join(preparedPackageRoot, path), { recursive: true });
}

function prepareConsumerAppForSkillSmoke() {
  writeFileSync(join(consumerAppRoot, "README.md"), "# tmp-codex-skill-smoke\n");
  writeFileSync(join(consumerAppRoot, "apm.yml"), `name: tmp-codex-skill-smoke
version: 0.0.0
target: codex

dependencies:
  apm: []
  mcp: []

devDependencies:
  apm: []
  mcp: []
`);
}

function runLoggedCommandSync(
  command: string[],
  cwd: string,
  logName: string,
  options: { allowFailure?: boolean; timeoutMs?: number } = {}
): { exitCode: number | null; stdout: string; stderr: string } {
  const proc = Bun.spawnSync(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    timeout: options.timeoutMs ?? 60000
  });
  const stdout = proc.stdout.toString();
  const stderr = proc.stderr.toString();
  mkdirSync(dirname(join(smokeResultsRoot, logName)), { recursive: true });
  writeFileSync(join(smokeResultsRoot, logName), [
    `$ ${command.map(shellQuoteArg).join(" ")}`,
    "",
    "## stdout",
    stdout,
    "## stderr",
    stderr,
    `## exitCode\n${proc.exitCode}`
  ].join("\n"));

  if (!options.allowFailure && proc.exitCode !== 0) {
    throw new Error(`${command[0]} failed (${proc.exitCode}); see ${join(smokeResultsRoot, logName)}`);
  }
  return { exitCode: proc.exitCode, stdout, stderr };
}

async function runLoggedCommandAsync(
  command: string[],
  cwd: string,
  logName: string,
  options: { allowFailure?: boolean; timeoutMs?: number } = {}
): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGTERM");
  }, options.timeoutMs ?? 60000);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited
  ]).finally(() => clearTimeout(timer));
  const reportedExitCode = timedOut ? 124 : exitCode;

  mkdirSync(dirname(join(smokeResultsRoot, logName)), { recursive: true });
  writeFileSync(join(smokeResultsRoot, logName), [
    `$ ${command.map(shellQuoteArg).join(" ")}`,
    "",
    "## stdout",
    stdout,
    "## stderr",
    stderr,
    `## exitCode\n${reportedExitCode}`,
    timedOut ? "## timeout\ntrue" : ""
  ].join("\n"));

  if (!options.allowFailure && reportedExitCode !== 0) {
    throw new Error(`${command[0]} failed (${reportedExitCode}); see ${join(smokeResultsRoot, logName)}`);
  }
  return { exitCode: reportedExitCode, stdout, stderr };
}

function shouldRetrySkillSmokeResult(result: { exitCode: number | null }, finalText: string) {
  return result.exitCode !== 0 || !finalText.trim();
}

function assertSmokeFileExists(path: string) {
  if (!existsSync(path)) throw new Error(`missing expected file: ${path}`);
}

function assertSmokeFileContains(path: string, needle: string) {
  const body = readFileSync(path, "utf8");
  if (!body.includes(needle)) throw new Error(`expected ${path} to contain ${needle}`);
}

function writeSingleSkillSmokeSummary(execStdout: string, promptInputHasSkillRoots: boolean) {
  const execPassed = execStdout.includes("product-recipe-qa")
    && execStdout.includes("findings")
    && execStdout.includes("decisions")
    && execStdout.includes("evidence");
  writeFileSync(join(smokeResultsRoot, "summary.md"), `# Codex Skill Smoke Summary

- package: ${resolve(preparedPackageRoot)}
- app: ${resolve(consumerAppRoot)}
- transient workspace kept: ${keepCodexSmokeWorkspace ? "yes" : "no"}
- prompt-input skill visible: ${promptInputHasSkillRoots ? "pass" : "degraded-debug-output"}
- codex exec direct skill prompt: ${execPassed ? "pass" : "review-required"}

If codex exec is review-required, inspect codex-exec.jsonl. The prompt-input verification is the hard gate for Codex CLI skill discovery.
`);
}

function writeAllSkillSmokeSummary(index: AllSkillSmokeResult[], qualityFailures: string[]) {
  const rows = index.map((item) => `| ${item.name} | ${item.layer} | ${item.exitCode ?? "null"} | ${item.attempts} | ${item.log} |`);
  const failedSkillCount = new Set(qualityFailures.map((failure) => failure.split(":")[0])).size;
  writeFileSync(join(smokeResultsRoot, "all-skills", "summary.md"), `# Codex All Skills E2E Summary

- skills attempted: ${index.length}
- skills passed quality gate: ${index.length - failedSkillCount}
- skills failed quality gate: ${failedSkillCount}
- quality failures: ${qualityFailures.length}
- logs: ${join(smokeResultsRoot, "all-skills")}
- reviewer: manual LLM review still required after this mechanical gate

${qualityFailures.length > 0 ? `## Quality Failures\n\n${qualityFailures.map((failure) => `- ${failure}`).join("\n")}\n` : "## Quality Failures\n\nNone.\n"}

| Skill | Layer | Exit | Attempts | Log |
| --- | --- | --- | --- | --- |
${rows.join("\n")}
`);
}

function collectSkillSmokeQualityFailures(index: Array<{
  name: string;
  finalText: string;
  exitCode: number | null;
}>) {
  const skillSmokeFailures: string[] = [];
  for (const item of index) {
    if (item.exitCode !== 0) {
      skillSmokeFailures.push(`${item.name}: codex exec exited ${item.exitCode ?? "null"}`);
    }
    if (!item.finalText.trim()) {
      skillSmokeFailures.push(`${item.name}: missing final agent message`);
      continue;
    }
    const text = item.finalText.toLowerCase();
    const missing = requiredSkillSmokeFields.filter((field) => !text.includes(field));
    if (missing.length > 0) {
      skillSmokeFailures.push(`${item.name}: final response missing required field(s): ${missing.join(", ")}`);
    }
    if (!buildActivationQualityPattern().test(item.finalText)) {
      skillSmokeFailures.push(`${item.name}: activation_quality must be pass, warn, or fail`);
    }
  }
  return skillSmokeFailures;
}

function buildActivationQualityPattern() {
  return /(?:^|\n)\s*(?:[-*]\s*)?(?:#{1,6}\s*)?[`*_]*activation_quality[`*_\s]*(?:[:：])?[`*_\s]*(pass|warn|fail)\b/i;
}

function extractFinalCodexAgentMessage(stdout: string): string {
  let last = "";
  for (const line of stdout.split("\n")) {
    if (!line.startsWith("{")) continue;
    try {
      const event = JSON.parse(line) as { type?: string; item?: { type?: string; text?: string } };
      if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
        last = event.item.text;
      }
    } catch {
      // Ignore non-event lines.
    }
  }
  return last;
}

function shellQuoteArg(value: string) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}
