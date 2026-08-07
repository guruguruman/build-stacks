---
name: build-recipe-wayfinding
description: "Map and resolve decision work that exceeds one implementation session. Use when the user asks to map and resolve decision work that exceeds one implementation session. Common requests include \"wayfinding\", \"map a huge effort\", \"decision map\"."
---

# build-recipe-wayfinding

Use decision tickets to push back uncertainty until a buildable route is visible. Produce decisions, not implementation deliverables.

## Chart Mode

1. Define the destination: the artifact or decision that marks the map complete.
2. Explore breadth-first. Separate sharp questions from fog that cannot yet be phrased precisely.
3. Create one map from [map-template.md](assets/map-template.md) and decision tickets sized to one session.
4. Classify each ticket as research, prototype, decision interview, or prerequisite task. Add genuine blocking edges and identify the unblocked frontier.
5. Store local maps under `.build-stacks/issues/<effort>/`. For GitHub, request explicit approval and use the installed `build-flow-projectsetup` GitHub helper before creating or changing remote issues.
6. Stop after charting. Do not resolve more than research tickets during the charting session.

## Resolve Mode

1. Load the map and select one unblocked, unclaimed ticket. Respect an explicitly named ticket.
2. Claim remote work only after approval; use a runtime status field for local work.
3. Resolve the question using repository evidence, primary-source research, a prototype, or a decision interview as appropriate.
4. Record the answer once, close the ticket, and add a one-line pointer under Decisions so far.
5. Graduate newly sharp fog into tickets, update blockers, and move beyond-destination work to Out of scope.
6. When no open tickets or fog remain, hand the result to `build-flow-specwork`. Do not implement directly from a dense decision map.

## Invariants

- Refer to tickets by linked title, not bare identifiers.
- One decision owns each answer; the map is an index, not a duplicate store.
- A human decision ticket remains human-in-the-loop.
- Never resolve more than one non-research ticket per session.

## Output Contract

- destination and mode
- map and ticket paths/URLs
- decisions, frontier, blockers, and fog
- claim/publication status
- evidence
- residual risk
- next handoff
