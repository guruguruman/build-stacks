#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const action = args.action ?? "preflight";
const supported = new Set(["preflight", "create", "comment", "label", "close"]);
if (!supported.has(action)) fail(`unsupported action: ${action}`);

preflightGitHub();
if (action === "preflight") process.exit(0);
if (args.approved !== true) fail("external write denied: pass --approved only after explicit user approval", 3);

const command = buildCommand(action, args);
const result = spawnSync("gh", command, { encoding: "utf8", env: process.env });
if (result.status !== 0) fail(result.stderr.trim() || result.stdout.trim() || `gh ${action} failed`, result.status ?? 1);
if (result.stdout) process.stdout.write(result.stdout);

function preflightGitHub() {
    runReadOnly(["auth", "status"]);
    runReadOnly(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]);
}

function runReadOnly(command) {
    const result = spawnSync("gh", command, { encoding: "utf8", env: process.env });
    if (result.status !== 0) fail(result.stderr.trim() || result.stdout.trim() || `gh ${command[0]} failed`, result.status ?? 1);
    if (result.stdout) process.stdout.write(result.stdout);
}

function buildCommand(actionName, values) {
    if (actionName === "create") {
        required(values, ["title", "bodyFile"]);
        return ["issue", "create", "--title", values.title, "--body-file", values.bodyFile];
    }
    required(values, ["issue"]);
    if (!/^\d+$/.test(values.issue)) fail("issue must be a positive numeric identifier");
    if (actionName === "comment") {
        required(values, ["bodyFile"]);
        return ["issue", "comment", values.issue, "--body-file", values.bodyFile];
    }
    if (actionName === "label") {
        required(values, ["label"]);
        return ["issue", "edit", values.issue, "--add-label", values.label];
    }
    return ["issue", "close", values.issue];
}

function required(values, names) {
    for (const name of names) if (!values[name]) fail(`missing --${toKebab(name)}`);
}

function parseArgs(values) {
    const parsed = {};
    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (value === "--approved") parsed.approved = true;
        else if (["--action", "--title", "--body-file", "--issue", "--label"].includes(value)) {
            parsed[toCamel(value.slice(2))] = values[++index];
        }
        else fail(`unknown argument: ${value}`);
    }
    return parsed;
}

function toCamel(value) {
    return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toKebab(value) {
    return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function fail(message, status = 1) {
    console.error(message);
    process.exit(status);
}
