import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = process.cwd();
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
const runRoot = resolve(readOption("--out") ?? join(repoRoot, ".product-build-stacks", "eval-runs", timestamp));
const dockerfile = join(repoRoot, "eval/docker/Dockerfile");
const casesFile = join(repoRoot, "eval/cases/all-skills.json");
const dockerContext = join(repoRoot, "eval/docker");
const outputRoot = join(runRoot, "container-output");
const hostReportsRoot = join(runRoot, "host-reports");
const emptyCodexRoot = join(runRoot, "empty-host-codex");
const realCodexHome = resolve(process.env.PRODUCT_EVAL_REAL_CODEX_HOME ?? process.env.CODEX_HOME ?? join(process.env.HOME ?? "", ".codex"));
const imageTag = readOption("--image") ?? `product-build-stacks-skill-eval:${timestamp}`;
const skipBuild = hasFlag("--skip-build");
const buildOnly = hasFlag("--build-only");
const skipRun = hasFlag("--no-run");
const skipJudge = hasFlag("--skip-judge") || process.env.EVAL_SKIP_JUDGE === "1";
const judgeExisting = hasFlag("--judge-existing") || process.env.EVAL_JUDGE_EXISTING === "1";
const codexVersion = readOption("--codex-version") ?? "0.128.0-alpha.1";
const apmVersion = readOption("--apm-version") ?? "0.9.1";
const agentBrowserVersion = readOption("--agent-browser-version") ?? "0.25.3";
const bunVersion = readOption("--bun-version") ?? "1.3.10";
const dockerPlatform = readOption("--platform") ?? process.env.EVAL_DOCKER_PLATFORM ?? "linux/amd64";
const gstackRef = readOption("--gstack-ref") ?? "";
const gstackRepoUrl = readOption("--gstack-repo-url") ?? "https://github.com/garrytan/gstack.git";
const selectedStacks = readOption("--stacks") ?? process.env.EVAL_STACKS ?? "";
const selectedSkills = readOption("--skills") ?? process.env.EVAL_SKILLS ?? "";
const evalModel = readOption("--model") ?? process.env.EVAL_MODEL ?? "gpt-5.5";
const evalReasoningEffort = normalizeReasoningEffort(readOption("--reasoning-effort") ?? process.env.EVAL_REASONING_EFFORT ?? "medium");

const protectedPaths = [
  join(process.env.HOME ?? "", ".claude"),
  join(process.env.HOME ?? "", ".gstack"),
  realCodexHome,
  join(realCodexHome, "auth.json"),
  join(realCodexHome, "config.toml"),
  join(realCodexHome, "skills"),
  join(realCodexHome, "skills/.system"),
  join(repoRoot, ".claude"),
  join(repoRoot, "CLAUDE.md"),
  join(repoRoot, "AGENTS.md")
];
const protectedTreePaths = [
  join(process.env.HOME ?? "", ".claude"),
  join(process.env.HOME ?? "", ".gstack"),
  join(realCodexHome, "skills"),
  join(realCodexHome, "skills/.system"),
  join(repoRoot, ".claude")
];

runDockerAllSkillsEval().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function runDockerAllSkillsEval() {
  assertRequiredFiles();
  resetRunRoot();
  const preflight = captureHostState("preflight");
  writeJson(join(hostReportsRoot, "preflight.json"), preflight);
  let containerExitCode = null;
  let imageId = null;
  try {
    if (!skipBuild) buildImage();
    imageId = inspectImageId(imageTag);
    writeJson(join(hostReportsRoot, "image.json"), {
      image_tag: imageTag,
      image_id: imageId,
      codex_version: codexVersion,
      apm_version: apmVersion,
      agent_browser_version: agentBrowserVersion,
      bun_version: bunVersion,
      docker_platform: dockerPlatform,
      eval_model: evalModel,
      eval_reasoning_effort: evalReasoningEffort
    });
    if (!buildOnly && !skipRun) {
      containerExitCode = runContainer(imageId ?? imageTag);
    }
  } finally {
    const postflight = captureHostState("postflight");
    const diff = diffHostState(preflight, postflight);
    writeJson(join(hostReportsRoot, "postflight.json"), postflight);
    writeJson(join(hostReportsRoot, "host-hygiene-diff.json"), diff);
    writeHostHygieneReport({ diff, imageId, containerExitCode });
    console.log(`eval run root: ${runRoot}`);
  }
  if (containerExitCode !== null && containerExitCode !== 0) process.exit(containerExitCode);
}

function assertRequiredFiles() {
  for (const path of [dockerfile, casesFile, join(dockerContext, "run-all-skills.mjs")]) {
    if (!existsSync(path)) throw new Error(`missing required eval file: ${path}`);
  }
}

function resetRunRoot() {
  if (existsSync(runRoot) && !hasFlag("--reuse-out") && !judgeExisting) rmSync(runRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });
  mkdirSync(hostReportsRoot, { recursive: true });
  mkdirSync(emptyCodexRoot, { recursive: true });
}

function buildImage() {
  const command = [
    "docker",
    "build",
    "-f",
    dockerfile,
    "-t",
    imageTag,
    "--build-arg",
    `CODEX_VERSION=${codexVersion}`,
    "--build-arg",
    `APM_VERSION=${apmVersion}`,
    "--build-arg",
    `AGENT_BROWSER_VERSION=${agentBrowserVersion}`,
    "--build-arg",
    `BUN_VERSION=${bunVersion}`,
    "--platform",
    dockerPlatform,
    dockerContext
  ];
  runLogged(command, repoRoot, join(hostReportsRoot, "docker-build.log"));
}

function inspectImageId(tag) {
  const result = spawnSync("docker", ["image", "inspect", tag, "--format", "{{.Id}}"], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function runContainer(image) {
  const codexMount = existsSync(realCodexHome) ? realCodexHome : emptyCodexRoot;
  const command = [
    "docker",
    "run",
    "--rm",
    "--platform",
    dockerPlatform,
    "--network",
    "bridge",
    "--mount",
    `type=bind,src=${repoRoot},dst=/repo,readonly`,
    "--mount",
    `type=bind,src=${codexMount},dst=/host-codex,readonly`,
    "--mount",
    `type=bind,src=${outputRoot},dst=/out`,
    "-e",
    "REPO_DIR=/repo",
    "-e",
    "OUT_DIR=/out",
    "-e",
    "HOST_CODEX_DIR=/host-codex",
    "-e",
    "CASES_FILE=/repo/eval/cases/all-skills.json",
    "-e",
    `EVAL_MODEL=${evalModel}`,
    "-e",
    `EVAL_REASONING_EFFORT=${evalReasoningEffort}`,
    "-e",
    `GSTACK_REPO_URL=${gstackRepoUrl}`,
    ...(gstackRef ? ["-e", `GSTACK_REF=${gstackRef}`] : []),
    ...(selectedStacks ? ["-e", `EVAL_STACKS=${selectedStacks}`] : []),
    ...(selectedSkills ? ["-e", `EVAL_SKILLS=${selectedSkills}`] : []),
    ...(skipJudge ? ["-e", "EVAL_SKIP_JUDGE=1"] : []),
    ...(judgeExisting ? ["-e", "EVAL_JUDGE_EXISTING=1"] : []),
    image
  ];
  const result = runLogged(command, repoRoot, join(hostReportsRoot, "docker-run.log"), { allowFailure: true });
  return result.status ?? 1;
}

function runLogged(command, cwd, logPath, options = {}) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64
  });
  writeFileSync(logPath, [
    `$ ${command.map(shellQuote).join(" ")}`,
    "",
    "## stdout",
    result.stdout ?? "",
    "## stderr",
    result.stderr ?? "",
    `## exitCode\n${result.status ?? 1}`
  ].join("\n"));
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`${command[0]} failed (${result.status}); see ${logPath}`);
  }
  return result;
}

function captureHostState(label) {
  return {
    label,
    generated_at: new Date().toISOString(),
    repo_status_short: gitStatusShort(),
    protected_paths: protectedPaths.map(readPathState),
    protected_trees: protectedTreePaths.map((path) => readTreeState(path))
  };
}

function gitStatusShort() {
  const result = spawnSync("git", ["status", "--short"], { cwd: repoRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout : `ERROR ${result.status}: ${result.stderr}`;
}

function readPathState(path) {
  try {
    const stat = statSync(path);
    return {
      path,
      exists: true,
      mtime_ms: stat.mtimeMs,
      size: stat.size,
      mode: stat.mode,
      is_directory: stat.isDirectory(),
      is_file: stat.isFile()
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { path, exists: false };
    return { path, exists: false, error: String(error) };
  }
}

function readTreeState(root) {
  const rootState = readPathState(root);
  if (!rootState.exists || !rootState.is_directory) return { root, exists: rootState.exists, entries: [] };
  const entries = [];
  walkTree(root, root, entries);
  entries.sort((left, right) => left.rel.localeCompare(right.rel));
  return { root, exists: true, entries };
}

function walkTree(root, current, entries) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const stat = lstatSync(path);
    const entry = {
      rel: path.slice(root.length + 1),
      mtime_ms: stat.mtimeMs,
      size: stat.size,
      mode: stat.mode,
      type: stat.isDirectory() ? "directory" : stat.isFile() ? "file" : stat.isSymbolicLink() ? "symlink" : "other"
    };
    if (stat.isFile()) entry.sha256 = sha256(readFileSync(path));
    entries.push(entry);
    if (stat.isDirectory()) walkTree(root, path, entries);
  }
}

function diffHostState(preflight, postflight) {
  const diffs = [];
  for (let index = 0; index < preflight.protected_paths.length; index += 1) {
    const before = preflight.protected_paths[index];
    const after = postflight.protected_paths[index];
    if (JSON.stringify(normalizePathState(before)) !== JSON.stringify(normalizePathState(after))) {
      diffs.push({ kind: "path", before, after });
    }
  }
  for (let index = 0; index < preflight.protected_trees.length; index += 1) {
    const before = preflight.protected_trees[index];
    const after = postflight.protected_trees[index];
    if (JSON.stringify(before.entries.map(normalizeTreeEntry)) !== JSON.stringify(after.entries.map(normalizeTreeEntry))) {
      diffs.push({ kind: "tree", root: before.root, before_count: before.entries.length, after_count: after.entries.length });
    }
  }
  if (preflight.repo_status_short !== postflight.repo_status_short) {
    diffs.push({ kind: "repo-status", before: preflight.repo_status_short, after: postflight.repo_status_short });
  }
  return {
    status: diffs.length === 0 ? "pass" : "fail",
    diffs
  };
}

function normalizePathState(state) {
  if (!state.exists) return { path: state.path, exists: false };
  return {
    path: state.path,
    exists: true,
    size: state.size,
    mode: state.mode,
    is_directory: state.is_directory,
    is_file: state.is_file
  };
}

function normalizeTreeEntry(entry) {
  return {
    rel: entry.rel,
    size: entry.size,
    mode: entry.mode,
    type: entry.type,
    sha256: entry.sha256 ?? null
  };
}

function writeHostHygieneReport({ diff, imageId, containerExitCode }) {
  writeFileSync(join(hostReportsRoot, "environment-hygiene.md"), [
    "# Host Environment Hygiene",
    "",
    `- status: ${diff.status}`,
    `- run root: ${runRoot}`,
    `- docker image: ${imageTag}`,
    `- docker image id: ${imageId ?? "unknown"}`,
    `- docker platform: ${dockerPlatform}`,
    `- eval model: ${evalModel}`,
    `- eval reasoning effort: ${evalReasoningEffort}`,
    `- container exit code: ${containerExitCode ?? "not-run"}`,
    "- host Codex system skills restore: not-attempted",
    `- protected path diffs: ${diff.diffs.length}`,
    "",
    diff.diffs.length ? "## Diffs\n" : "## Diffs\n\nNone.\n",
    ...diff.diffs.map((item) => `- ${item.kind}: ${item.root ?? item.before?.path ?? "repo-status"}`),
    ""
  ].join("\n"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readOption(name) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:=@,+-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function normalizeReasoningEffort(value) {
  return value === "middle" ? "medium" : value;
}
