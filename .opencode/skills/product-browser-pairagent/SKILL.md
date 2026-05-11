---
name: product-browser-pairagent
preamble-tier: 2
version: 1.0.0
description: |
  Browser QA handoff packets for pair-agent collaboration. This browser evidence workflow
  keeps product-* public interfaces, .apm source guidance, and .product-build-stacks
  runtime evidence boundaries aligned.
  Produces browser_activation status, commands run, screenshots or snapshots when
  available, findings, residual risk, and next handoff.
  Use when asked to "browser pairagent", "pair agent handoff", "browser QA packet", or
  when the requested work matches product-browser-pairagent.
  Proactively suggest when this workflow would reduce ambiguity, preserve evidence
  discipline, or create a cleaner handoff.
  Voice triggers: "pair agent handoff", "browser QA packet", "handoff packet".
benefits-from: [product-browser-runner, product-flow-qareport]
triggers:
  - product-browser-pairagent
  - browser pairagent
  - pair agent handoff
  - browser QA packet
  - handoff packet
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
  - AskUserQuestion
---

# product-browser-pairagent

Use this skill when a browser investigation needs to be handed to another agent, reviewer, or human operator with enough context to continue the same workflow.

## Behavior

- If the user provides a URL, local fixture, screenshot, or reproduction path, collect the smallest browser evidence packet that lets another worker continue: current URL, reproduction steps, observed state, expected state, screenshots or snapshots, console/network highlights when relevant, and commands used.
- If an actual browser surface is available, use official `agent-browser` through product-browser-runner policy and store artifacts under `.product-build-stacks/`.
- If no browser surface is available, produce a report-only handoff packet with missing evidence called out explicitly.
- If the user asks for live shared control, remote tunnel exposure, cookie import, or authenticated takeover, stop at a blocked state unless they explicitly approve that separate setup.
- Redact secrets, cookies, authorization headers, and credential-bearing screenshots from the handoff packet.

## Handoff Packet

- summary: the issue or workflow being handed off.
- surface: URL, local fixture, route, commit, branch, or artifact under review.
- reproduction_steps: ordered steps another worker can repeat.
- evidence: screenshots, snapshots, console/network excerpts, command logs, and relevant file paths.
- expected_vs_actual: the specific mismatch or decision point.
- constraints: auth, runtime, approval, data, or environment limits.
- next_action: the smallest useful continuation step.

## Output Contract

- findings: what was reproduced, observed, or still missing.
- decisions: what evidence was captured and what was intentionally left out.
- evidence: files, commands, browser artifacts, or docs used.
- residual risk: missing runtime, auth, data, or browser evidence.
- next handoff: the next practical command or manual step.
- pairing_status: handoff_ready, executed, blocked, or report_only.
- browser_activation: executed, blocked, report_only, or not_applicable.
