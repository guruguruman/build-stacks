import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { buildSkills } from "./build-skill-catalog.mjs";
import { routingCorpus } from "./routing-corpus.mjs";
import { extractReadSkillNames } from "./codex-routing-evidence.mjs";
const repoRoot = process.cwd();
const codexSmokeRoot = join(repoRoot, ".build-stacks", "tmp-codex-skill-smoke");
const preparedPackageRoot = join(codexSmokeRoot, "package");
const consumerAppRoot = join(codexSmokeRoot, "app");
const smokeResultsRoot = join(codexSmokeRoot, "results");
const codexRuntimeRoot = join(tmpdir(), `build-stacks-codex-smoke-${createHash("sha256").update(repoRoot).digest("hex").slice(0, 12)}-${process.pid}`);
const fakeCodexHome = join(codexRuntimeRoot, "codex-home");
const fakeHome = join(codexRuntimeRoot, "home");
const realCodexHome = resolve(process.env.BUILD_CODEX_REAL_HOME ?? process.env.CODEX_HOME ?? join(process.env.HOME ?? tmpdir(), ".codex"));
const realCodexSkillsRoot = join(realCodexHome, "skills");
const realCodexSystemSkillsRoot = join(realCodexSkillsRoot, ".system");
const keepCodexSmokeWorkspace = process.env.BUILD_CODEX_SMOKE_KEEP === "1" || process.env.BUILD_CODEX_E2E_KEEP === "1";
const installOnlySmokeMode = process.argv.includes("--install-only");
const allSkillsSmokeMode = process.argv.includes("--all-skills");
const naturalJapaneseSmokeMode = process.argv.includes("--natural-ja");
const naturalEnglishSmokeMode = process.argv.includes("--natural-en");
const collisionSmokeMode = process.argv.includes("--collisions");
const smokeEvidenceLabel = process.env.BUILD_CODEX_SMOKE_EVIDENCE_LABEL;
const allSkillsSmokeTimeoutMs = Number(process.env.BUILD_CODEX_SMOKE_TIMEOUT_MS ?? process.env.BUILD_CODEX_E2E_TIMEOUT_MS ?? "600000") || 600000;
const requiredSkillSmokeFields = ["skill", "intent_fit", "findings", "decisions", "evidence", "residual risk", "next handoff", "activation_quality"];
const codexIsolationConfigArgs = [
    "-c",
    "skills.bundled.enabled=false",
    "-c",
    "features.plugins=false",
    "-c",
    "features.apps=false",
    "-c",
    "features.tool_search=false",
    "-c",
    "features.tool_suggest=false"
];
process.once("exit", cleanupFakeCodexRuntime);
let realCodexSkillsPreflightFingerprint;
runCodexSkillSmoke().catch((error) => {
    console.error(error);
    process.exit(1);
});
async function runCodexSkillSmoke() {
    resetCodexSmokeWorkspace();
    prepareFakeCodexRuntime();
    try {
        preparePackageForSkillSmoke();
        prepareConsumerAppForSkillSmoke();
        runLoggedCommandSync(["apm", "install", preparedPackageRoot, "--target", "codex", "--force"], consumerAppRoot, "install.log");
        runLoggedCommandSync(["apm", "compile", "--target", "codex"], consumerAppRoot, "compile.log");
        assertSmokeFileExists(join(consumerAppRoot, "AGENTS.md"));
        for (const skill of buildSkills) {
            assertSmokeFileExists(join(consumerAppRoot, ".agents", "skills", skill.name, "SKILL.md"));
        }
        if (installOnlySmokeMode) {
            console.log(`Codex activation install smoke ok: ${buildSkills.length} skills`);
            if (!keepCodexSmokeWorkspace) {
                rmSync(consumerAppRoot, { recursive: true, force: true });
                rmSync(preparedPackageRoot, { recursive: true, force: true });
            }
            return;
        }
        runLoggedCommandSync(["codex", "debug", "prompt-input", ...codexIsolationConfigArgs, "build-recipe-qa を使ってください"], consumerAppRoot, "prompt-input.json");
        const promptInputPath = join(smokeResultsRoot, "prompt-input.json");
        const promptInput = readFileSync(promptInputPath, "utf8");
        const promptInputHasSkillRoots = promptInput.includes("### Skill roots");
        if (promptInputHasSkillRoots) {
            for (const skill of buildSkills) {
                assertSmokeFileContains(promptInputPath, skill.name);
                assertSmokeFileContains(promptInputPath, `/${skill.name}/SKILL.md`);
            }
        }
        else {
            writeFileSync(join(smokeResultsRoot, "prompt-input-warning.md"), [
                "# Codex Prompt Input Warning",
                "",
                "`codex debug prompt-input` returned no skill-root listing on this Codex CLI build.",
                "The hard discovery gate is therefore verifying the installed `.agents/skills/<skill>/SKILL.md` file."
            ].join("\n"));
        }
        if (allSkillsSmokeMode) {
            await runAllSkillSmokes();
        }
        else {
            runSingleSkillSmoke(promptInputHasSkillRoots);
        }
        if (!keepCodexSmokeWorkspace) {
            rmSync(consumerAppRoot, { recursive: true, force: true });
            rmSync(preparedPackageRoot, { recursive: true, force: true });
        }
    }
    finally {
        assertRealCodexSkillsUnchanged();
        cleanupFakeCodexRuntime();
    }
}
function prepareFakeCodexRuntime() {
    rmSync(codexRuntimeRoot, { recursive: true, force: true });
    mkdirSync(fakeCodexHome, { recursive: true });
    mkdirSync(fakeHome, { recursive: true });
    const copiedFiles = [];
    const authFile = join(realCodexHome, "auth.json");
    if (existsSync(authFile)) {
        cpSync(authFile, join(fakeCodexHome, "auth.json"));
        copiedFiles.push("auth.json");
    }
    realCodexSkillsPreflightFingerprint = fingerprintRealCodexSkills();
    writeFileSync(join(smokeResultsRoot, "codex-runtime.json"), `${JSON.stringify({
        fakeCodexHome,
        fakeHome,
        realCodexHome,
        copiedFiles,
        realSkillsFingerprintRecorded: true,
        ignoreUserConfig: true,
        note: "Codex smoke commands use fake HOME/CODEX_HOME. Only auth.json is copied when present; user config, skills, history, logs, and state are not copied."
    }, null, 2)}\n`);
}
function cleanupFakeCodexRuntime() {
    rmSync(codexRuntimeRoot, { recursive: true, force: true });
}
function assertRealCodexSkillsUnchanged() {
    const current = fingerprintRealCodexSkills();
    if (current !== realCodexSkillsPreflightFingerprint) {
        throw new Error(`real Codex skills changed during isolated smoke; no restore was attempted: ${realCodexSystemSkillsRoot}`);
    }
}
function fingerprintRealCodexSkills() {
    const entries = [];
    fingerprintPath(realCodexSkillsRoot, realCodexSkillsRoot, entries);
    return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}
function fingerprintPath(root, path, entries) {
    if (!existsSync(path)) {
        entries.push({ rel: path === root ? "." : path.slice(root.length + 1), exists: false });
        return;
    }
    const stat = lstatSync(path, { bigint: true });
    const entry = {
        rel: path === root ? "." : path.slice(root.length + 1),
        mode: stat.mode.toString(),
        ino: stat.ino.toString(),
        size: stat.size.toString(),
        mtimeNs: stat.mtimeNs.toString(),
        type: stat.isDirectory() ? "directory" : stat.isSymbolicLink() ? "symlink" : stat.isFile() ? "file" : "other"
    };
    if (stat.isFile()) entry.sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (stat.isSymbolicLink()) entry.target = readlinkSync(path);
    entries.push(entry);
    if (stat.isDirectory()) {
        for (const name of readdirSync(path).sort()) fingerprintPath(root, join(path, name), entries);
    }
}
function runSingleSkillSmoke(promptInputHasSkillRoots) {
    const execResult = runCodexExecSkillSmokeSync(buildSkills.find((skill) => skill.name === "build-recipe-qa"), "codex-exec.jsonl");
    writeSingleSkillSmokeSummary(execResult.stdout, promptInputHasSkillRoots);
}
async function runAllSkillSmokes() {
    const allDir = join(smokeResultsRoot, "all-skills");
    mkdirSync(allDir, { recursive: true });
    const skills = selectSkillsForSmoke();
    const index = new Array(skills.length);
    const concurrency = Math.max(1, Number(process.env.BUILD_CODEX_SMOKE_CONCURRENCY ?? process.env.BUILD_CODEX_E2E_CONCURRENCY ?? "3") || 3);
    let nextIndex = 0;
    async function runSkillSmokeWorker() {
        while (nextIndex < skills.length) {
            const indexNumber = nextIndex++;
            const skill = skills[indexNumber];
            const smokeId = skill.smokeId ?? skill.name;
            console.log(`[${indexNumber + 1}/${skills.length}] ${smokeId} -> ${skill.name}`);
            let logName = join("all-skills", `${smokeId}.jsonl`);
            let result = await runCodexExecSkillSmokeAsync(skill, logName, { allowFailure: true, timeoutMs: allSkillsSmokeTimeoutMs });
            let finalText = extractFinalCodexAgentMessage(result.stdout);
            const attemptLogs = [logName];
            if (shouldRetrySkillSmokeResult(result, finalText)) {
                console.log(`[retry 1/1] ${skill.name}`);
                logName = join("all-skills", `${smokeId}.retry-1.jsonl`);
                result = await runCodexExecSkillSmokeAsync(skill, logName, { allowFailure: true, timeoutMs: allSkillsSmokeTimeoutMs });
                finalText = extractFinalCodexAgentMessage(result.stdout);
                attemptLogs.push(logName);
            }
            index[indexNumber] = {
                name: skill.name,
                smokeId,
                layer: skill.layer,
                summary: skill.summary,
                log: logName,
                attemptLogs,
                attempts: attemptLogs.length,
                finalText,
                readSkills: extractReadSkillNames(result.stdout),
                routingCase: skill.routingCase,
                exitCode: result.exitCode
            };
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, skills.length) }, () => runSkillSmokeWorker()));
    const completed = index.map((item, indexNumber) => {
        if (item)
            return item;
        const skill = skills[indexNumber];
        return {
            name: skill.name,
            smokeId: skill.smokeId ?? skill.name,
            layer: skill.layer,
            summary: skill.summary,
            log: join("all-skills", `${skill.smokeId ?? skill.name}.jsonl`),
            attemptLogs: [],
            attempts: 0,
            finalText: "",
            readSkills: [],
            routingCase: skill.routingCase,
            exitCode: null
        };
    });
    writeFileSync(join(allDir, "index.json"), `${JSON.stringify(completed, null, 2)}\n`);
    const qualityFailures = collectSkillSmokeQualityFailures(completed);
    writeAllSkillSmokeSummary(completed, qualityFailures);
    archiveSmokeResults();
    if (qualityFailures.length > 0) {
        throw new Error(`codex all-skills quality gate failed (${qualityFailures.length}); see ${join(allDir, "summary.md")}`);
    }
}
function archiveSmokeResults() {
    if (!smokeEvidenceLabel) return;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(smokeEvidenceLabel)) {
        throw new Error(`invalid BUILD_CODEX_SMOKE_EVIDENCE_LABEL: ${smokeEvidenceLabel}`);
    }
    const archiveRoot = join(repoRoot, ".build-stacks", "evidence", "codex-routing", smokeEvidenceLabel);
    rmSync(archiveRoot, { recursive: true, force: true });
    mkdirSync(dirname(archiveRoot), { recursive: true });
    cpSync(smokeResultsRoot, archiveRoot, { recursive: true, preserveTimestamps: true });
}
function selectSkillsForSmoke() {
    if (collisionSmokeMode) {
        const selected = routingCorpus.collisions
            .filter((entry) => naturalJapaneseSmokeMode ? entry.language === "ja" : naturalEnglishSmokeMode ? entry.language === "en" : true)
            .map((entry) => attachRoutingCase(entry.expectedPrimary, {
                prompt: entry.prompt,
                expectedPrimary: entry.expectedPrimary,
                forbiddenCoordinators: entry.forbiddenCoordinators,
                allowedRoles: entry.allowedRoles
            }, `collision-${entry.id}`));
        if (selected.length === 0) throw new Error("collision smoke selected no routing cases");
        return selected;
    }
    const names = (process.env.BUILD_CODEX_SMOKE_SKILLS ?? process.env.BUILD_CODEX_E2E_SKILLS)?.split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    if (!names?.length)
        return buildSkills.map((skill) => attachNaturalRoutingCase(skill));
    return names.map((name) => {
        const skill = buildSkills.find((candidate) => candidate.name === name);
        if (!skill)
            throw new Error(`unknown skill in BUILD_CODEX_SMOKE_SKILLS: ${name}`);
        return attachNaturalRoutingCase(skill);
    });
}
function attachNaturalRoutingCase(skill) {
    const corpusCase = routingCorpus.cases.find((entry) => entry.expectedPrimary === skill.name);
    if (!corpusCase) throw new Error(`routing corpus missing skill: ${skill.name}`);
    return attachRoutingCase(skill.name, {
        prompt: naturalJapaneseSmokeMode ? corpusCase.promptJa : corpusCase.promptEn,
        expectedPrimary: corpusCase.expectedPrimary,
        forbiddenCoordinators: corpusCase.forbiddenCoordinators,
        allowedRoles: corpusCase.allowedRoles
    }, skill.name);
}
function attachRoutingCase(skillName, routingCase, smokeId) {
    const skill = buildSkills.find((candidate) => candidate.name === skillName);
    if (!skill) throw new Error(`routing corpus references unknown skill: ${skillName}`);
    return { ...skill, routingCase, smokeId };
}
function runCodexExecSkillSmokeSync(skill, logName) {
    return runLoggedCommandSync(buildCodexSkillSmokeCommand(skill), consumerAppRoot, logName, { timeoutMs: 180000 });
}
async function runCodexExecSkillSmokeAsync(skill, logName, options = {}) {
    return runLoggedCommandAsync(buildCodexSkillSmokeCommand(skill), consumerAppRoot, logName, options);
}
function buildCodexSkillSmokeCommand(skill) {
    const naturalMode = naturalJapaneseSmokeMode || naturalEnglishSmokeMode;
    const naturalRequest = skill.routingCase?.prompt ?? (naturalJapaneseSmokeMode
        ? skill.naturalActivationExamples.ja
        : skill.naturalActivationExamples.en);
    const prompt = [
        naturalMode ? naturalRequest : `${skill.name} を使ってください。`,
        naturalMode
            ? "skill名を指定されていない自然文として扱い、この依頼に最も適合する公開skillを一つ選んでください。明示された複数roleまたは選んだcoordinatorが宣言するrole orchestrationだけは併読できます。"
            : `この skill の意図: ${skill.summary}`,
        naturalMode
            ? "routing検証です。選択した一次skillのSKILL.mdを実際に読んだら、workflow本体、repo調査、テスト、ファイル変更は実行せず、選択理由だけを返してください。"
            : "この tmp プロジェクトを対象に、選んだskillの意図に沿った実用的な計画・レビュー・判定を返してください。",
        "外部 write、deploy、merge、認証操作、cookie import は行わないでください。",
        "最終応答に `skill: <選択した公開skill名>` を独立した1行で書き、intent_fit, findings, decisions, evidence, residual risk, next handoff, activation_quality を含めてください。",
        "activation_quality の理由は activation_notes に分離してください。",
        "最終行は必ず `activation_quality: pass`、`activation_quality: warn`、`activation_quality: fail` のいずれか 1 行だけにしてください。"
    ].join("\n");
    return [
        "codex",
        "exec",
        "-c",
        "approval_policy=\"never\"",
        "--skip-git-repo-check",
        "--ephemeral",
        "--ignore-user-config",
        ...codexIsolationConfigArgs,
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
    runLoggedCommandSync(
        ["node", join(repoRoot, "scripts", "apm-package-prepare.mjs"), "--out", preparedPackageRoot],
        repoRoot,
        "package-prepare.log"
    );
}
function prepareConsumerAppForSkillSmoke() {
    writeFileSync(join(consumerAppRoot, "README.md"), "# tmp-codex-skill-smoke\n");
    writeFileSync(join(consumerAppRoot, "apm.yml"), `name: tmp-codex-skill-smoke
version: 0.0.0
targets:
  - codex

dependencies:
  apm: []
  mcp: []

devDependencies:
  apm: []
  mcp: []
`);
}
function runLoggedCommandSync(command, cwd, logName, options = {}) {
    const proc = spawnSync(command[0], command.slice(1), {
        cwd,
        encoding: "utf8",
        timeout: options.timeoutMs ?? 60000,
        env: buildCommandEnv(command)
    });
    const stdout = proc.stdout ?? "";
    const stderr = proc.stderr ?? "";
    mkdirSync(dirname(join(smokeResultsRoot, logName)), { recursive: true });
    writeFileSync(join(smokeResultsRoot, logName), [
        `$ ${command.map(shellQuoteArg).join(" ")}`,
        "",
        "## stdout",
        stdout,
        "## stderr",
        stderr,
        `## exitCode\n${proc.status}`
    ].join("\n"));
    if (!options.allowFailure && proc.status !== 0) {
        throw new Error(`${command[0]} failed (${proc.status}); see ${join(smokeResultsRoot, logName)}`);
    }
    return { exitCode: proc.status, stdout, stderr };
}
async function runLoggedCommandAsync(command, cwd, logName, options = {}) {
    const proc = spawn(command[0], command.slice(1), {
        cwd,
        env: buildCommandEnv(command),
        stdio: ["ignore", "pipe", "pipe"]
    });
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
    }, options.timeoutMs ?? 60000);
    const [stdout, stderr, exitCode] = await Promise.all([
        collectStream(proc.stdout),
        collectStream(proc.stderr),
        new Promise((resolve) => proc.on("close", (code) => resolve(code ?? 1)))
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
function buildCommandEnv(command) {
    if (command[0] !== "codex")
        return process.env;
    return {
        ...process.env,
        CODEX_HOME: fakeCodexHome,
        HOME: fakeHome
    };
}
function collectStream(stream) {
    return new Promise((resolve, reject) => {
        let body = "";
        stream.setEncoding("utf8");
        stream.on("data", (chunk) => {
            body += chunk;
        });
        stream.on("error", reject);
        stream.on("end", () => resolve(body));
    });
}
function shouldRetrySkillSmokeResult(result, finalText) {
    return result.exitCode !== 0 || !finalText.trim();
}
function assertSmokeFileExists(path) {
    if (!existsSync(path))
        throw new Error(`missing expected file: ${path}`);
}
function assertSmokeFileContains(path, needle) {
    const body = readFileSync(path, "utf8");
    if (!body.includes(needle))
        throw new Error(`expected ${path} to contain ${needle}`);
}
function writeSingleSkillSmokeSummary(execStdout, promptInputHasSkillRoots) {
    const execPassed = execStdout.includes("build-recipe-qa")
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
function writeAllSkillSmokeSummary(index, qualityFailures) {
    const rows = index.map((item) => `| ${item.smokeId ?? item.name} | ${item.name} | ${item.layer} | ${item.exitCode ?? "null"} | ${item.attempts} | ${scoreUsefulnessRubric(item.finalText).total}/10 | ${item.readSkills.join(", ")} | ${item.log} |`);
    const rubricRows = index.map((item) => {
        const rubric = scoreUsefulnessRubric(item.finalText);
        return `| ${item.name} | ${rubric.total}/10 | ${rubric.checks.map((check) => `${check.name}:${check.score}`).join(", ")} |`;
    });
    const failedSkillCount = new Set(qualityFailures.map((failure) => failure.split(":")[0])).size;
    writeFileSync(join(smokeResultsRoot, "all-skills", "summary.md"), `# Codex All Skills E2E Summary

- skills attempted: ${index.length}
- skills passed quality gate: ${index.length - failedSkillCount}
- skills failed quality gate: ${failedSkillCount}
- quality failures: ${qualityFailures.length}
- logs: all-skills/
- reviewer: manual LLM review still required after this mechanical gate
- usefulness rubric: advisory only; it is not a release gate

${qualityFailures.length > 0 ? `## Quality Failures\n\n${qualityFailures.map((failure) => `- ${failure}`).join("\n")}\n` : "## Quality Failures\n\nNone.\n"}

| Case | Expected skill | Layer | Exit | Attempts | Usefulness | Actual skill reads | Log |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Advisory Usefulness Rubric

| Skill | Score | Checks |
| --- | --- | --- |
${rubricRows.join("\n")}
`);
}
function collectSkillSmokeQualityFailures(index) {
    const skillSmokeFailures = [];
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
            skillSmokeFailures.push(`${item.name}: activation_quality must be the final line and pass, warn, or fail`);
        }
        if (item.routingCase) {
            if (!item.readSkills.includes(item.routingCase.expectedPrimary)) {
                skillSmokeFailures.push(`${item.smokeId}: expected SKILL.md read was not observed: ${item.routingCase.expectedPrimary}`);
            }
            const forbiddenReads = item.readSkills.filter((name) => item.routingCase.forbiddenCoordinators.includes(name));
            if (forbiddenReads.length > 0) {
                skillSmokeFailures.push(`${item.smokeId}: forbidden coordinator read(s): ${forbiddenReads.join(", ")}`);
            }
            const unexpectedRoles = item.readSkills.filter((name) => isRoleSkill(name) && !item.routingCase.allowedRoles.includes(name));
            if (unexpectedRoles.length > 0) {
                skillSmokeFailures.push(`${item.smokeId}: unexpected role read(s): ${unexpectedRoles.join(", ")}`);
            }
        }
        if ((naturalJapaneseSmokeMode || naturalEnglishSmokeMode) && !new RegExp(`(?:^|\\n)(?:[-*]\\s*)?skill:\\s*${escapeRegExp(item.name)}\\s*$`, "im").test(item.finalText)) {
            skillSmokeFailures.push(`${item.name}: natural-language request selected a different skill`);
        }
    }
    return skillSmokeFailures;
}
function isRoleSkill(name) {
    return buildSkills.find((skill) => skill.name === name)?.routingKind === "role";
}
function buildActivationQualityPattern() {
    return /(?:^|\n)activation_quality: (pass|warn|fail)\s*$/i;
}
function scoreUsefulnessRubric(finalText) {
    const text = finalText.toLowerCase();
    const checks = [
        {
            name: "persona",
            score: scoreText(text, [/\b(user|customer|persona|operator|manager|founder)\b/, /ユーザー|顧客|利用者|ペルソナ|担当者|責任者|管理者/])
        },
        {
            name: "status_quo",
            score: scoreText(text, [/\b(status quo|existing workflow|adoption friction|manual workaround|current process)\b/, /現状|既存|導入|摩擦|手作業|運用|代替/])
        },
        {
            name: "mvp_workflow",
            score: scoreText(text, [/\b(mvp|workflow|wedge|screen|flow|first version)\b/, /MVP|最小|主要画面|画面|フロー|ワークフロー|導線/])
        },
        {
            name: "evidence",
            score: scoreText(text, [/\b(evidence|artifact|command|file|unverified|assumption)\b/, /根拠|証拠|未検証|仮定|ファイル|コマンド/])
        },
        {
            name: "handoff",
            score: scoreText(text, [/\b(next handoff|next step|follow-up|verify|test)\b/, /次|検証|テスト|引き継ぎ|ハンドオフ/])
        }
    ];
    return {
        total: checks.reduce((sum, check) => sum + check.score, 0),
        checks
    };
}
function scoreText(text, patterns) {
    const matches = patterns.filter((pattern) => pattern.test(text)).length;
    return Math.min(2, matches);
}
function extractFinalCodexAgentMessage(stdout) {
    let last = "";
    for (const line of stdout.split("\n")) {
        if (!line.startsWith("{"))
            continue;
        try {
            const event = JSON.parse(line);
            if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
                last = event.item.text;
            }
        }
        catch {
            // Ignore non-event lines.
        }
    }
    return last;
}
function shellQuoteArg(value) {
    if (/^[A-Za-z0-9_./:=@-]+$/.test(value))
        return value;
    return `'${value.replaceAll("'", "'\\''")}'`;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
