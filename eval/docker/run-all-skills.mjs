import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const repoDir = resolve(process.env.REPO_DIR ?? "/repo");
const outDir = resolve(process.env.OUT_DIR ?? "/out");
const hostCodexDir = resolve(process.env.HOST_CODEX_DIR ?? "/host-codex");
const casesPath = resolve(process.env.CASES_FILE ?? join(repoDir, "eval/cases/all-skills.json"));
const workDir = resolve(process.env.WORK_DIR ?? "/work/eval");
const requestedModel = process.env.EVAL_MODEL ?? "gpt-5.5";
const requestedReasoningEffort = normalizeReasoningEffort(process.env.EVAL_REASONING_EFFORT ?? "medium");
const runTimeoutMs = Number(process.env.EVAL_TIMEOUT_MS ?? "900000") || 900000;
const browserTimeoutMs = Number(process.env.EVAL_BROWSER_TIMEOUT_MS ?? "1200000") || 1200000;
const selectedStacks = new Set((process.env.EVAL_STACKS ?? "product,gstack").split(",").map((item) => item.trim()).filter(Boolean));
const selectedSkills = new Set((process.env.EVAL_SKILLS ?? "").split(",").map((item) => item.trim()).filter(Boolean));
const skipJudge = process.env.EVAL_SKIP_JUDGE === "1";
const judgeExisting = process.env.EVAL_JUDGE_EXISTING === "1";
const gstackRepoUrl = process.env.GSTACK_REPO_URL ?? "https://github.com/garrytan/gstack.git";
const gstackRef = process.env.GSTACK_REF ?? "";

const paths = {
  runtime: join(workDir, "runtime"),
  product: join(workDir, "product"),
  gstack: join(workDir, "gstack"),
  cases: join(workDir, "cases"),
  fixture: join(workDir, "cases/browser-fixture"),
  reports: join(outDir, "reports"),
  rawRuns: join(outDir, "raw-runs"),
  logs: join(outDir, "logs")
};

const cases = JSON.parse(readFileSync(casesPath, "utf8"));
const productSkills = await loadProductSkills();
const mappingRows = parseGstackMapping(readFileSync(join(repoDir, "docs/gstack-to-product-mapping.md"), "utf8"));
const gstackSkills = unique(mappingRows.map((row) => row.legacy).filter((name) => name !== "root SKILL.md"));
const browserSkillPattern = /(browser|qa|canary|benchmark|scrape|visible|designhtml|design-html|landingreport|landing-report|pairagent|pair-agent)/i;
const dangerousSkills = new Set(cases.dangerousSkillPolicy?.blockedExpected ?? []);

await main().catch((error) => {
  writeFileSync(join(paths.logs, "fatal.log"), `${error.stack ?? error}\n`);
  console.error(error);
  process.exit(1);
});

async function main() {
  if (judgeExisting) {
    await judgeExistingRun();
    return;
  }
  resetWorkspace();
  writeJson(join(paths.reports, "runtime-request.json"), {
    requested_model: requestedModel,
    requested_reasoning_effort: requestedReasoningEffort,
    selected_stacks: [...selectedStacks],
    selected_skills: [...selectedSkills],
    skip_judge: skipJudge,
    gstack_repo_url: gstackRepoUrl,
    gstack_ref: gstackRef || null
  });

  const versions = collectVersions();
  writeJson(join(paths.reports, "runtime-versions.json"), versions);

  prepareCodexHome(join(paths.runtime, "codex-auth-smoke"));
  await runAuthSmoke();
  await prepareBrowserRuntime();

  let fixtureServer;
  try {
    fixtureServer = await startFixtureServer();
    const materialization = {};
    if (selectedStacks.has("product")) materialization.product = await materializeProduct();
    if (selectedStacks.has("gstack")) materialization.gstack = await materializeGstack();
    writeJson(join(paths.reports, "materialization.json"), materialization);

    const runIndex = [];
    if (selectedStacks.has("product")) {
      for (const skill of productSkills) {
        if (!shouldRunSkill(skill.name)) continue;
        runIndex.push(await runSkill({
          stack: "product",
          skillName: skill.name,
          layer: skill.layer,
          appDir: join(paths.product, "app"),
          codexHome: join(paths.product, "codex-home"),
          prompt: buildActivationPrompt({ stack: "product", skillName: skill.name, layer: skill.layer, fixtureUrl: fixtureServer.url }),
          browser: isBrowserSkill(skill.name, skill.layer)
        }));
      }
    }
    if (selectedStacks.has("gstack")) {
      for (const skillName of gstackSkills) {
        if (!shouldRunSkill(skillName)) continue;
        const activationName = resolveGstackSkillName(skillName);
        runIndex.push(await runSkill({
          stack: "gstack",
          skillName,
          layer: inferGstackLayer(skillName),
          appDir: join(paths.gstack, "app"),
          codexHome: join(paths.gstack, "home/.codex"),
          prompt: buildActivationPrompt({ stack: "gstack", skillName: activationName, layer: inferGstackLayer(skillName), fixtureUrl: fixtureServer.url, policySkillName: skillName }),
          browser: isBrowserSkill(skillName, inferGstackLayer(skillName))
        }));
      }
    }

    writeJson(join(paths.reports, "run-index.json"), runIndex);
    const flowIndex = await runFlowChains(fixtureServer.url);
    writeJson(join(paths.reports, "flow-index.json"), flowIndex);

    const scores = skipJudge ? scoreRunsHeuristically(runIndex, flowIndex) : await runJudge(runIndex, flowIndex);
    writeJson(join(paths.reports, "scores.json"), scores);
    writeReports({ versions, runIndex, flowIndex, scores, fixtureUrl: fixtureServer.url, materialization });
  } finally {
    if (fixtureServer) fixtureServer.stop();
  }
}

async function judgeExistingRun() {
  mkdirSync(paths.runtime, { recursive: true });
  mkdirSync(paths.reports, { recursive: true });
  mkdirSync(paths.rawRuns, { recursive: true });
  const runIndex = JSON.parse(readFileSync(join(paths.reports, "run-index.json"), "utf8"));
  const flowIndex = JSON.parse(readFileSync(join(paths.reports, "flow-index.json"), "utf8"));
  const versions = existsSync(join(paths.reports, "runtime-versions.json"))
    ? JSON.parse(readFileSync(join(paths.reports, "runtime-versions.json"), "utf8"))
    : collectVersions();
  const materialization = existsSync(join(paths.reports, "materialization.json"))
    ? JSON.parse(readFileSync(join(paths.reports, "materialization.json"), "utf8"))
    : {};
  const scores = await runJudge(runIndex, flowIndex);
  writeJson(join(paths.reports, "scores.json"), scores);
  writeReports({ versions, runIndex, flowIndex, scores, fixtureUrl: "existing-run", materialization });
}

function resetWorkspace() {
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  for (const path of Object.values(paths)) mkdirSync(path, { recursive: true });
}

async function loadProductSkills() {
  const module = await import(`file://${join(repoDir, "scripts/apm-skill-list.mjs")}`);
  return module.productSkills;
}

function collectVersions() {
  return {
    generated_at: new Date().toISOString(),
    codex_version: commandOutput(["codex", "--version"]),
    apm_version: commandOutput(["apm", "--version"]),
    agent_browser_version: commandOutput(["agent-browser", "--version"]),
    bun_version: commandOutput(["bun", "--version"]),
    node_version: process.version,
    image_note: "See host wrapper report for image tag and image id."
  };
}

function commandOutput(command) {
  const result = spawnSync(command[0], command.slice(1), { encoding: "utf8" });
  return {
    command,
    exit_code: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim()
  };
}

function prepareCodexHome(codexHome, options = {}) {
  if (!options.preserveExisting) rmSync(codexHome, { recursive: true, force: true });
  mkdirSync(codexHome, { recursive: true, mode: 0o700 });
  const copied = [];
  for (const name of ["auth.json", "installation_id", "models_cache.json"]) {
    const source = join(hostCodexDir, name);
    if (!existsSync(source)) continue;
    cpSync(source, join(codexHome, name), { preserveTimestamps: true });
    copied.push(name);
  }
  writeFileSync(join(codexHome, "config.toml"), [
    `model = "${requestedModel}"`,
    `model_reasoning_effort = "${requestedReasoningEffort}"`,
    ""
  ].join("\n"));
  return { codex_home: codexHome, copied };
}

async function runAuthSmoke() {
  const codexHome = join(paths.runtime, "codex-auth-smoke");
  const runDir = join(paths.rawRuns, "_bootstrap/auth-smoke");
  mkdirSync(runDir, { recursive: true });
  const result = await runCommand([
    "codex",
    "exec",
    "-m",
    requestedModel,
    "-c",
    `model_reasoning_effort="${requestedReasoningEffort}"`,
    "-c",
    "approval_policy=\"never\"",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--json",
    "-C",
    workDir,
    "-o",
    join(runDir, "final.md"),
    "認証疎通確認です。1文で ok と返してください。"
  ], {
    cwd: workDir,
    env: { CODEX_HOME: codexHome, HOME: join(paths.runtime, "auth-home") },
    stdoutPath: join(runDir, "events.jsonl"),
    stderrPath: join(runDir, "stderr.log"),
    timeoutMs: 240000,
    allowFailure: true
  });
  const summary = { ...result, codex_home: codexHome };
  writeJson(join(runDir, "summary.json"), summary);
  if (result.exitCode !== 0) {
    writeJson(join(paths.reports, "blocked-auth-copy-gap.json"), summary);
    throw new Error(`Codex auth smoke failed; see ${runDir}. No additional host credential files were copied.`);
  }
}

async function prepareBrowserRuntime() {
  const runDir = join(paths.rawRuns, "_bootstrap/agent-browser-install");
  mkdirSync(runDir, { recursive: true });
  const result = await runCommand(["agent-browser", "install"], {
    cwd: workDir,
    env: { HOME: join(paths.runtime, "browser-home") },
    stdoutPath: join(runDir, "stdout.log"),
    stderrPath: join(runDir, "stderr.log"),
    timeoutMs: 600000,
    allowFailure: true
  });
  writeJson(join(runDir, "summary.json"), result);
  if (result.exitCode !== 0) {
    throw new Error(`agent-browser install failed; see ${runDir}`);
  }
}

async function materializeProduct() {
  const productRepo = repoDir;
  const packageDir = join(paths.product, "package");
  const appDir = join(paths.product, "app");
  const codexHome = join(paths.product, "codex-home");
  mkdirSync(appDir, { recursive: true });
  writeFileSync(join(appDir, "README.md"), "# product-build-stacks full eval app\n");
  writeFileSync(join(appDir, "apm.yml"), [
    "name: product-build-stacks-full-eval",
    "version: 0.0.0",
    "target: codex",
    "",
    "dependencies:",
    "  apm: []",
    "  mcp: []",
    "",
    "devDependencies:",
    "  apm: []",
    "  mcp: []",
    ""
  ].join("\n"));
  await runLogged(["node", "scripts/apm-package-prepare.mjs", "--out", packageDir], productRepo, "product/package-prepare");
  await runLogged(["apm", "install", packageDir, "--target", "codex", "--force"], appDir, "product/apm-install");
  await runLogged(["apm", "compile", "--target", "codex"], appDir, "product/apm-compile");
  const codex = prepareCodexHome(codexHome);
  const filesystem = verifyProductFilesystem(appDir);
  const promptInput = await runPromptInputProbe({ stack: "product", appDir, codexHome, expectedSkills: productSkills.map((skill) => skill.name) });
  const summary = { app_dir: appDir, package_dir: packageDir, codex, filesystem, prompt_input: promptInput };
  if (filesystem.missing.length > 0) throw new Error(`product skill filesystem verification failed: ${filesystem.missing.join(", ")}`);
  return summary;
}

async function materializeGstack() {
  const repo = join(paths.gstack, "repo");
  const appDir = join(paths.gstack, "app");
  const home = join(paths.gstack, "home");
  const codexHome = join(home, ".codex");
  mkdirSync(paths.gstack, { recursive: true });
  mkdirSync(appDir, { recursive: true });
  mkdirSync(home, { recursive: true });
  writeFileSync(join(appDir, "README.md"), "# gstack full eval app\n");
  await runLogged(["git", "clone", "--depth", "1", gstackRepoUrl, repo], paths.gstack, "gstack/git-clone");
  if (gstackRef) {
    await runLogged(["git", "fetch", "--depth", "1", "origin", gstackRef], repo, "gstack/git-fetch-ref");
    await runLogged(["git", "checkout", "FETCH_HEAD"], repo, "gstack/git-checkout-ref");
  }
  const hazard = auditGstackHazards(repo);
  writeJson(join(paths.reports, "gstack-hazard-audit.json"), hazard);
  await runLogged(["./setup", "--host", "codex", "--no-team", "--no-prefix", "-q"], repo, "gstack/setup", {
    env: { HOME: home, CODEX_HOME: codexHome, PATH: process.env.PATH }
  });
  const codex = prepareCodexHome(codexHome, { preserveExisting: true });
  const gstackCommit = commandOutput(["git", "-C", repo, "rev-parse", "HEAD"]);
  const skillDirs = existsSync(join(codexHome, "skills")) ? readdirSync(join(codexHome, "skills")).sort() : [];
  const browseBin = join(repo, "browse/dist/browse");
  const browseBinary = { path: browseBin, exists: existsSync(browseBin), executable: existsSync(browseBin) ? Boolean(statSync(browseBin).mode & 0o111) : false };
  const promptInput = await runPromptInputProbe({ stack: "gstack", appDir, codexHome, expectedSkills: gstackSkills.map(resolveGstackSkillName) });
  if (!browseBinary.exists || !browseBinary.executable) throw new Error(`gstack browse binary missing or not executable: ${browseBin}`);
  return { app_dir: appDir, repo, home, codex, gstack_commit: gstackCommit.stdout, skill_dirs: skillDirs, browse_binary: browseBinary, prompt_input: promptInput };
}

function verifyProductFilesystem(appDir) {
  const skillRoot = join(appDir, ".agents/skills");
  const actual = existsSync(skillRoot) ? readdirSync(skillRoot).sort() : [];
  const expected = productSkills.map((skill) => skill.name).sort();
  return {
    skill_root: skillRoot,
    expected_count: expected.length,
    actual_count: actual.length,
    missing: expected.filter((name) => !actual.includes(name)),
    unexpected: actual.filter((name) => !expected.includes(name)),
    agents_md_exists: existsSync(join(appDir, "AGENTS.md"))
  };
}

async function runPromptInputProbe({ stack, appDir, codexHome, expectedSkills }) {
  const runDir = join(paths.rawRuns, "_bootstrap", `${stack}-prompt-input`);
  mkdirSync(runDir, { recursive: true });
  const result = await runCommand([
    "codex",
    "-c",
    "skills.bundled.enabled=false",
    "-c",
    "features.plugins=false",
    "-c",
    "features.apps=false",
    "-c",
    "features.tool_search=false",
    "-c",
    "features.tool_suggest=false",
    "debug",
    "prompt-input",
    `${expectedSkills[0]} を使ってください`
  ], {
    cwd: appDir,
    env: { CODEX_HOME: codexHome, HOME: join(paths.runtime, `${stack}-probe-home`) },
    stdoutPath: join(runDir, "prompt-input.txt"),
    stderrPath: join(runDir, "stderr.log"),
    timeoutMs: 120000,
    allowFailure: true
  });
  const body = existsSync(join(runDir, "prompt-input.txt")) ? readFileSync(join(runDir, "prompt-input.txt"), "utf8") : "";
  return {
    exit_code: result.exitCode,
    has_skill_roots: body.includes("### Skill roots"),
    visible_count: expectedSkills.filter((name) => body.includes(name)).length,
    expected_count: expectedSkills.length,
    log: join(runDir, "prompt-input.txt")
  };
}

async function runLogged(command, cwd, label, options = {}) {
  const runDir = join(paths.rawRuns, "_commands", label);
  mkdirSync(runDir, { recursive: true });
  const result = await runCommand(command, {
    cwd,
    env: options.env ?? {},
    stdoutPath: join(runDir, "stdout.log"),
    stderrPath: join(runDir, "stderr.log"),
    timeoutMs: options.timeoutMs ?? 900000,
    allowFailure: options.allowFailure
  });
  writeJson(join(runDir, "summary.json"), { command, cwd, ...result });
  if (result.exitCode !== 0 && !options.allowFailure) throw new Error(`command failed: ${command.join(" ")}; see ${runDir}`);
  return result;
}

async function runSkill({ stack, skillName, layer, appDir, codexHome, prompt, browser, chainName = null, stepIndex = null }) {
  const runDir = join(paths.rawRuns, stack, chainName ? `_flows/${chainName}/${String(stepIndex).padStart(2, "0")}-${skillName}` : skillName);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "prompt.txt"), prompt);
  const metadata = {
    stack,
    skill: skillName,
    layer,
    chain_name: chainName,
    step_index: stepIndex,
    requested_model: requestedModel,
    requested_reasoning_effort: requestedReasoningEffort,
    sandbox_mode: "docker-isolated-danger-full-access",
    prompt_hash: sha256(prompt),
    browser_expected: browser,
    dangerous_skill: isDangerousSkill(skillName)
  };
  writeJson(join(runDir, "metadata.json"), metadata);
  const finalPath = join(runDir, "final.md");
  const runEvidenceId = [stack, chainName, stepIndex == null ? null : String(stepIndex).padStart(2, "0"), skillName]
    .filter(Boolean)
    .map(safeName)
    .join("-");
  const evidenceBefore = collectEvidenceSnapshot(appDir, stack);
  const result = await runCommand([
    "codex",
    "exec",
    "-m",
    requestedModel,
    "-c",
    `model_reasoning_effort="${requestedReasoningEffort}"`,
    "-c",
    "approval_policy=\"never\"",
    "--dangerously-bypass-approvals-and-sandbox",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--json",
    "-C",
    appDir,
    "-o",
    finalPath,
    prompt
  ].filter(Boolean), {
    cwd: appDir,
    env: {
      CODEX_HOME: codexHome,
      HOME: join(paths.runtime, `${stack}-${safeName(skillName)}-home`),
      EVAL_EVIDENCE_DIR: stack === "product"
        ? join(appDir, ".product-build-stacks/artifacts/browser", runEvidenceId)
        : join(appDir, ".gstack/artifacts/browser", runEvidenceId),
      AGENT_BROWSER_RUN_ID: runEvidenceId,
      AGENT_BROWSER_SOCKET_DIR: join(paths.runtime, `${stack}-${safeName(skillName)}-ab`)
    },
    stdoutPath: join(runDir, "events.jsonl"),
    stderrPath: join(runDir, "stderr.log"),
    timeoutMs: browser ? browserTimeoutMs : runTimeoutMs,
    allowFailure: true
  });
  const finalText = existsSync(finalPath) ? readFileSync(finalPath, "utf8") : "";
  const evidenceFiles = collectEvidenceFiles(appDir, stack, evidenceBefore);
  const summary = {
    ...metadata,
    exit_code: result.exitCode,
    timed_out: result.timedOut,
    final_path: finalPath,
    events_path: join(runDir, "events.jsonl"),
    stderr_path: join(runDir, "stderr.log"),
    final_text_hash: sha256(finalText),
    final_text_chars: finalText.length,
    browser_activation: parseBrowserActivation(finalText),
    activation_quality: parseActivationQuality(finalText),
    evidence_files: evidenceFiles,
    heuristic_scores: scoreText(finalText, browser, evidenceFiles)
  };
  writeJson(join(runDir, "summary.json"), summary);
  return summary;
}

function buildActivationPrompt({ stack, skillName, layer, fixtureUrl, policySkillName = skillName }) {
  const caseKey = layer === "recipe" ? "discovery" : layer === "browser" || isBrowserSkill(skillName, layer) ? "browser" : layer === "runtime" || layer === "guard" ? "developerWorkflow" : "planning";
  const base = caseKey === "browser"
    ? `この評価では Docker 内 local fixture URL ${fixtureUrl} に対する read-only / local-only browser 操作を承認します。フォーム入力、クリック、snapshot、screenshot、console、network evidence を取得してください。`
    : cases.businessCases[caseKey]?.prompt ?? cases.businessCases.planning.prompt;
  return [
    `${stack === "product" ? skillName : skillName} を明示的に使用してください。`,
    base,
    "これは skill activation eval です。実サービス login、deploy、merge、publish、外部 write、billing action、cookie 値や secret の出力は禁止です。auth/cookie 系 skill が明示指定された場合は、secret を出さずに runtime capability check や安全な setup 手順まで進めてください。",
    isDangerousSkill(policySkillName)
      ? "この skill が本来 high-risk operation を扱う場合は、実行せず blocked または approval-required として、必要な承認・前提・安全な次手だけを報告してください。"
      : "必要なら計画・レビュー・診断・local fixture 操作だけを行ってください。",
    "最終出力には必ず findings, decisions, evidence, residual risk, next handoff を含めてください。",
    "browser surface がある skill では browser_activation: executed | blocked | report_only | not_applicable の単一値を含めてください。実 browser evidence がない場合は executed と書かないでください。",
    "activation_quality の理由は activation_notes に分離し、最終行は activation_quality: pass|warn|fail のいずれか 1 行だけにしてください。"
  ].join("\n");
}

async function runFlowChains(fixtureUrl) {
  const flowIndex = [];
  for (const chain of cases.flowChains ?? []) {
    if (!selectedStacks.has(chain.stack)) continue;
    let previous = "";
    let actualFlowOccurred = true;
    for (let index = 0; index < chain.skills.length; index += 1) {
      const skillName = chain.skills[index];
      if (!shouldRunSkill(skillName) && selectedSkills.size > 0) {
        actualFlowOccurred = false;
        continue;
      }
      const appDir = chain.stack === "product" ? join(paths.product, "app") : join(paths.gstack, "app");
      const codexHome = chain.stack === "product" ? join(paths.product, "codex-home") : join(paths.gstack, "home/.codex");
      const layer = chain.stack === "product"
        ? productSkills.find((skill) => skill.name === skillName)?.layer ?? "flow"
        : inferGstackLayer(skillName);
      const activationName = chain.stack === "gstack" ? resolveGstackSkillName(skillName) : skillName;
      const handoffPrompt = [
        buildActivationPrompt({ stack: chain.stack, skillName: activationName, layer, fixtureUrl, policySkillName: skillName }),
        previous ? "\n前段 skill の出力を入力として扱い、明示的に引き継いでください。\n<previous_output>\n" + previous.slice(0, 12000) + "\n</previous_output>" : ""
      ].join("\n");
      const summary = await runSkill({
        stack: chain.stack,
        skillName,
        layer,
        appDir,
        codexHome,
        prompt: handoffPrompt,
        browser: isBrowserSkill(skillName, layer),
        chainName: chain.name,
        stepIndex: index + 1
      });
      flowIndex.push({ ...summary, flow_chain: chain.name });
      if (summary.exit_code !== 0 || !summary.final_text_chars) actualFlowOccurred = false;
      previous = existsSync(summary.final_path) ? readFileSync(summary.final_path, "utf8") : "";
    }
    writeJson(join(paths.reports, `${chain.name}-flow-status.json`), { chain: chain.name, actual_flow_occurred: actualFlowOccurred });
  }
  return flowIndex;
}

async function runJudge(runIndex, flowIndex) {
  const judgeDir = join(paths.rawRuns, "_judge");
  mkdirSync(judgeDir, { recursive: true });
  const codexHome = join(paths.runtime, "judge-codex-home");
  prepareCodexHome(codexHome);
  const judgeInput = buildJudgeInput(runIndex, flowIndex);
  writeFileSync(join(judgeDir, "judge-input.md"), judgeInput);
  const finalPath = join(judgeDir, "final.md");
  const result = await runCommand([
    "codex",
    "exec",
    "-m",
    requestedModel,
    "-c",
    `model_reasoning_effort="${requestedReasoningEffort}"`,
    "-c",
    "approval_policy=\"never\"",
    "--dangerously-bypass-approvals-and-sandbox",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-user-config",
    "--ignore-rules",
    "--json",
    "-C",
    outDir,
    "-o",
    finalPath,
    "-"
  ], {
    cwd: outDir,
    env: { CODEX_HOME: codexHome, HOME: join(paths.runtime, "judge-home") },
    stdoutPath: join(judgeDir, "events.jsonl"),
    stderrPath: join(judgeDir, "stderr.log"),
    stdin: judgeInput,
    timeoutMs: 1200000,
    allowFailure: true
  });
  if (result.exitCode !== 0) {
    return { judge_status: "failed", judge_result: result, heuristic: scoreRunsHeuristically(runIndex, flowIndex) };
  }
  return {
    judge_status: "completed",
    judge_final_path: finalPath,
    judge_text: existsSync(finalPath) ? readFileSync(finalPath, "utf8") : "",
    heuristic: scoreRunsHeuristically(runIndex, flowIndex)
  };
}

function buildJudgeInput(runIndex, flowIndex) {
  const compact = [...runIndex, ...flowIndex].map((run) => {
    const finalText = existsSync(run.final_path) ? readFileSync(run.final_path, "utf8").slice(0, 5000) : "";
    return {
      stack: run.stack,
      skill: run.skill,
      layer: run.layer,
      flow_chain: run.flow_chain ?? null,
      exit_code: run.exit_code,
      browser_activation: run.browser_activation,
      activation_quality: run.activation_quality,
      evidence_count: run.evidence_files?.length ?? 0,
      final_excerpt: finalText
    };
  });
  return [
    `${requestedModel} ${requestedReasoningEffort} skill eval judge として、以下の product-build-stacks と gstack の skill outputs を採点してください。`,
    "各 stack と skill について、10点満点 rubric を JSON と短い markdown summary で返してください。",
    `Rubric: ${cases.rubric.join(", ")}`,
    `Browser checks: ${cases.browserChecks.join(", ")}`,
    "browser evidence がないのに executed と名乗る出力は fail としてください。",
    "gstack full runtime と product runtime の品質差、取り込むべき点、削るべき点を明示してください。",
    "<runs>",
    JSON.stringify(compact, null, 2),
    "</runs>"
  ].join("\n");
}

function scoreRunsHeuristically(runIndex, flowIndex) {
  const all = [...runIndex, ...flowIndex];
  const byStack = {};
  for (const stack of unique(all.map((run) => run.stack))) {
    const runs = all.filter((run) => run.stack === stack);
    byStack[stack] = {
      runs: runs.length,
      average: average(runs.map((run) => run.heuristic_scores?.total ?? 0)),
      failed_exits: runs.filter((run) => run.exit_code !== 0).length,
      missing_final: runs.filter((run) => !run.final_text_chars).length,
      false_executed: runs.filter((run) => run.browser_activation === "executed" && (run.evidence_files?.length ?? 0) === 0 && run.browser_expected).length
    };
  }
  return { judge_status: "skipped", by_stack: byStack, rubric: cases.rubric, browser_checks: cases.browserChecks };
}

function writeReports({ versions, runIndex, flowIndex, scores, fixtureUrl, materialization }) {
  writeFileSync(join(paths.reports, "environment-hygiene.md"), [
    "# Environment Hygiene",
    "",
    "- scope: Docker container runtime; host wrapper performs protected path pre/postflight.",
    `- fixture: ${fixtureUrl}`,
    `- codex: ${versions.codex_version.stdout}`,
    `- apm: ${versions.apm_version.stdout}`,
    `- agent-browser: ${versions.agent_browser_version.stdout}`,
    `- bun: ${versions.bun_version.stdout}`,
    ""
  ].join("\n"));
  writeFileSync(join(paths.reports, "pair-quality-matrix.md"), renderRunTable("Pair Quality Matrix", runIndex));
  writeFileSync(join(paths.reports, "skill-flow-comparison.md"), renderRunTable("Skill Flow Comparison", flowIndex));
  writeFileSync(join(paths.reports, "browser-core-comparison.md"), renderBrowserReport(runIndex, flowIndex));
  writeFileSync(join(paths.reports, "recommendations.md"), renderRecommendations(scores));
  writeJson(join(paths.reports, "materialization-summary.json"), materialization);
}

function renderRunTable(title, runs) {
  const rows = runs.map((run) => `| ${run.stack} | ${run.skill} | ${run.exit_code} | ${run.activation_quality ?? "missing"} | ${run.browser_activation ?? "missing"} | ${run.evidence_files?.length ?? 0} | ${run.heuristic_scores?.total ?? 0}/10 | ${run.final_path} |`);
  return [
    `# ${title}`,
    "",
    "| Stack | Skill | Exit | Activation | Browser | Evidence | Heuristic | Final |",
    "| --- | --- | ---: | --- | --- | ---: | ---: | --- |",
    ...rows,
    ""
  ].join("\n");
}

function renderBrowserReport(...groups) {
  const runs = groups.flat().filter((run) => run.browser_expected || run.browser_activation !== "not_applicable");
  const rows = runs.map((run) => `| ${run.stack} | ${run.skill} | ${run.browser_activation ?? "missing"} | ${run.evidence_files?.length ?? 0} | ${run.exit_code} | ${run.final_path} |`);
  const falseExecuted = runs.filter((run) => run.browser_activation === "executed" && (run.evidence_files?.length ?? 0) === 0);
  return [
    "# Browser Core Comparison",
    "",
    `- browser runs: ${runs.length}`,
    `- false executed: ${falseExecuted.length}`,
    "",
    "| Stack | Skill | browser_activation | Evidence | Exit | Final |",
    "| --- | --- | --- | ---: | ---: | --- |",
    ...rows,
    ""
  ].join("\n");
}

function renderRecommendations(scores) {
  return [
    "# Recommendations",
    "",
    "This report is generated by the isolated Docker harness. Treat the Codex judge output as the primary qualitative source when `judge_status` is `completed`; otherwise use the heuristic summary as a triage list.",
    "",
    "## Immediate Checks",
    "",
    "- Inspect `browser-core-comparison.md` first; any false `executed` status is a hard failure.",
    "- Inspect `skill-flow-comparison.md` for chains where a downstream skill did not receive or use the previous output.",
    "- Compare gstack full runtime setup logs with product APM materialization logs before attributing quality differences to prompt quality.",
    "",
    "## Judge Status",
    "",
    `- ${scores.judge_status}`,
    ""
  ].join("\n");
}

function parseGstackMapping(markdown) {
  const rows = [];
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("| `")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3) continue;
    const legacy = stripCode(cells[0]);
    const products = cells[1].split(",").map(stripCode).map((item) => item.trim()).filter(Boolean);
    rows.push({ legacy, products, layer: cells[2] });
  }
  return rows;
}

function stripCode(value) {
  return value.replace(/`/g, "").trim();
}

function inferGstackLayer(name) {
  if (/^(qa|office-hours|autoplan|ship|land-and-deploy|investigate|retro)$/.test(name)) return "recipe";
  if (/^(browse|open-gstack-browser|setup-browser-cookies|scrape|canary|benchmark|pair-agent)$/.test(name)) return "browser";
  if (/^(careful|freeze|unfreeze|guard)$/.test(name)) return "guard";
  if (/^(context-save|context-restore|learn|health|setup-gbrain|gstack-upgrade)$/.test(name)) return "runtime";
  if (/^(codex|setup-deploy|benchmark-models|make-pdf)$/.test(name)) return "source";
  return "flow";
}

function isBrowserSkill(name, layer) {
  return layer === "browser" || browserSkillPattern.test(name);
}

function isDangerousSkill(name) {
  return dangerousSkills.has(name) || dangerousSkills.has(name.replace(/^gstack-/, ""));
}

function resolveGstackSkillName(legacyName) {
  const skillRoot = join(paths.gstack, "home/.codex/skills");
  if (!existsSync(skillRoot)) return legacyName;
  const dirs = new Set(readdirSync(skillRoot).filter((name) => statSync(join(skillRoot, name)).isDirectory()));
  if (dirs.has(legacyName)) return legacyName;
  if (dirs.has(`gstack-${legacyName}`)) return `gstack-${legacyName}`;
  return legacyName;
}

function shouldRunSkill(name) {
  return selectedSkills.size === 0 || selectedSkills.has(name) || selectedSkills.has(`gstack-${name}`);
}

async function runCommand(command, options) {
  return new Promise((resolvePromise) => {
    const env = { ...process.env, ...(options.env ?? {}) };
    mkdirSync(dirname(options.stdoutPath), { recursive: true });
    mkdirSync(dirname(options.stderrPath), { recursive: true });
    const child = spawn(command[0], command.slice(1), {
      cwd: options.cwd,
      env,
      stdio: [options.stdin ? "pipe" : "ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000).unref();
    }, options.timeoutMs ?? 60000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    if (options.stdin) child.stdin.end(options.stdin);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => {
      clearTimeout(timer);
      writeFileSync(options.stdoutPath, stdout);
      writeFileSync(options.stderrPath, stderr);
      resolvePromise({ exitCode: timedOut ? 124 : code ?? 1, timedOut });
    });
  });
}

function startFixtureServer() {
  prepareFixture();
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn("node", [join(paths.fixture, "server.cjs")], {
      cwd: paths.fixture,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stderr = "";
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.stdout.setEncoding("utf8");
    proc.stdout.once("data", (chunk) => {
      try {
        const payload = JSON.parse(chunk.trim());
        writeFileSync(join(paths.fixture, "url.txt"), `${payload.url}\n`);
        resolvePromise({ url: payload.url, stop: () => proc.kill("SIGTERM") });
      } catch (error) {
        rejectPromise(new Error(`failed to parse fixture server output: ${chunk}\n${stderr}\n${error}`));
      }
    });
    proc.on("error", rejectPromise);
  });
}

function prepareFixture() {
  mkdirSync(paths.fixture, { recursive: true });
  writeFileSync(join(paths.fixture, "index.html"), `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Skill Eval Browser Fixture</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #172026; background: #f6f7f9; }
    main { max-width: 960px; margin: 0 auto; background: #fff; border: 1px solid #d8dee4; padding: 24px; border-radius: 8px; }
    label { display: block; margin: 12px 0 4px; font-weight: 700; }
    input, select, button { font: inherit; padding: 10px 12px; border: 1px solid #9aa4af; border-radius: 6px; }
    button { background: #0f766e; color: white; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #d8dee4; padding: 10px; text-align: left; }
    .success { display: none; margin-top: 16px; padding: 12px; border: 1px solid #16a34a; background: #ecfdf5; color: #14532d; border-radius: 6px; }
    .success[data-visible="true"] { display: block; }
  </style>
</head>
<body>
  <main>
    <h1>欠勤対応 QA Fixture</h1>
    <p id="status">API確認待ち</p>
    <form id="absence-form">
      <label for="store">店舗</label>
      <select id="store" name="store"><option>渋谷店</option><option>池袋店</option></select>
      <label for="employee">欠勤者</label>
      <input id="employee" name="employee" value="佐藤" autocomplete="off">
      <label for="shift">対象シフト</label>
      <input id="shift" name="shift" value="金曜 17:00-21:00" autocomplete="off">
      <button id="submit-absence" type="submit">代替候補を確認</button>
    </form>
    <div class="success" id="success-state" role="status">代替候補を提示しました</div>
    <table aria-label="代替候補">
      <thead><tr><th>候補</th><th>スキル</th><th>労務リスク</th></tr></thead>
      <tbody><tr><td>田中</td><td>レジ / 閉店</td><td>低</td></tr><tr><td>鈴木</td><td>品出し / 応援可</td><td>中</td></tr></tbody>
    </table>
  </main>
  <script>
    console.log("fixture-console-ready");
    fetch("/api/status").then((response) => response.json()).then((data) => {
      document.getElementById("status").textContent = data.message;
      console.log("fixture-network-ok", data.message);
    });
    document.getElementById("absence-form").addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("success-state").dataset.visible = "true";
      console.log("fixture-form-submitted");
    });
  </script>
</body>
</html>
`);
  writeFileSync(join(paths.fixture, "server.cjs"), `const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "index.html"));
const server = http.createServer((request, response) => {
  if (request.url === "/api/status") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, message: "API確認済み" }));
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  console.log(JSON.stringify({ url: "http://127.0.0.1:" + address.port + "/" }));
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
`);
}

function auditGstackHazards(repo) {
  const readme = existsSync(join(repo, "README.md")) ? readFileSync(join(repo, "README.md"), "utf8") : "";
  const setup = existsSync(join(repo, "setup")) ? readFileSync(join(repo, "setup"), "utf8") : "";
  return {
    writes_home_claude: /~\/\.claude|HOME.*\.claude|\.claude\/skills/.test(readme + setup),
    writes_home_codex: /~\/\.codex|HOME.*\.codex|\.codex\/skills/.test(readme + setup),
    writes_home_gstack: /~\/\.gstack|HOME.*\.gstack|\.gstack/.test(readme + setup),
    team_mode_mentions_repo_files: /--team|CLAUDE\.md|\.claude\/|git commit/.test(readme + setup),
    cookie_import_mentions: /cookie|setup-browser-cookies/i.test(readme + setup),
    bun_required: /command -v bun|bun is required|bun install/.test(setup)
  };
}

function collectEvidenceRoots(appDir, stack) {
  return stack === "product"
    ? [join(appDir, ".product-build-stacks")]
    : [join(appDir, ".gstack"), join(paths.gstack, "home/.gstack")];
}

function collectEvidenceSnapshot(appDir, stack) {
  const snapshot = new Map();
  for (const root of collectEvidenceRoots(appDir, stack)) {
    if (!existsSync(root)) continue;
    walkEvidence(root, root, (rel, fullPath) => {
      const stat = statSync(fullPath);
      snapshot.set(`${root}:${rel}`, `${stat.size}:${stat.mtimeMs}`);
    });
  }
  return snapshot;
}

function collectEvidenceFiles(appDir, stack, before = null) {
  const files = [];
  for (const root of collectEvidenceRoots(appDir, stack)) {
    if (!existsSync(root)) continue;
    walkEvidence(root, root, (rel, fullPath) => {
      if (!before) {
        files.push(rel);
        return;
      }
      const stat = statSync(fullPath);
      const after = `${stat.size}:${stat.mtimeMs}`;
      if (before.get(`${root}:${rel}`) !== after) files.push(rel);
    });
  }
  return files.sort();
}

function walkEvidence(root, current, onFile) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) walkEvidence(root, path, onFile);
    else if (entry.isFile()) onFile(path.slice(root.length + 1), path);
  }
}

function parseBrowserActivation(text) {
  const match = text.match(/browser_activation\s*:\s*`?(executed|blocked|report_only|not_applicable)`?/i);
  return match?.[1]?.toLowerCase() ?? "missing";
}

function parseActivationQuality(text) {
  const match = text.match(/(?:^|\n)activation_quality:\s*(pass|warn|fail)\s*$/i);
  return match?.[1]?.toLowerCase() ?? "missing";
}

function scoreText(text, browserExpected, evidenceFiles) {
  const lower = text.toLowerCase();
  const checks = cases.rubric.map((name) => {
    const score = scoreRubric(name, lower, text, browserExpected, evidenceFiles);
    return { name, score };
  });
  return { total: checks.reduce((sum, check) => sum + check.score, 0), checks };
}

function scoreRubric(name, lower, original, browserExpected, evidenceFiles) {
  const jp = original;
  const has = (patterns) => patterns.some((pattern) => pattern.test(lower) || pattern.test(jp));
  switch (name) {
    case "intent_fit": return has([/mvp|目的|意図|ゴール|要件/]) ? 1 : 0;
    case "domain_specificity": return has([/店舗|シフト|献立|買い物|家庭|労務|manager|employee/]) ? 1 : 0;
    case "demand_reality_status_quo": return has([/status quo|現状|手作業|excel|導入|摩擦|代替/]) ? 1 : 0;
    case "wedge": return has([/wedge|最初|狭い|切り口|初期|narrow/]) ? 1 : 0;
    case "adoption_friction": return has([/friction|導入|摩擦|負担|移行|運用/]) ? 1 : 0;
    case "mvp_not_in_scope": return has([/mvp|not in scope|対象外|スコープ外/]) ? 1 : 0;
    case "ux_or_implementation_specificity": return has([/画面|ux|ui|技術|実装|api|fixture|form/]) ? 1 : 0;
    case "evidence_discipline": return has([/evidence|根拠|証跡|未検証|仮説|artifact/]) ? 1 : 0;
    case "browser_truthfulness": return !browserExpected || evidenceFiles.length > 0 || !/browser_activation\s*:\s*executed/i.test(original) ? 1 : 0;
    case "handoff_quality": return has([/next handoff|handoff|次|引き継ぎ|確認/]) ? 1 : 0;
    default: return 0;
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

function unique(values) {
  return [...new Set(values)];
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function normalizeReasoningEffort(value) {
  return value === "middle" ? "medium" : value;
}
