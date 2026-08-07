---
name: build-flow-teach
description: "Run a stateful teaching workspace grounded in a learner mission. Use when the user asks to run a stateful teaching workspace grounded in a learner mission. Common requests include \"teach me\", \"create a lesson\", \"learning workspace\"."
---

# build-flow-teach

Teach one useful capability at a time. Ground the sequence in the learner's mission and evidence from primary learning resources.

## Workspace Contract

Use the current directory only when the user intends it to be a teaching workspace. Keep:

- `MISSION.md`: why the learner wants the capability and what success enables.
- `RESOURCES.md`: trusted primary sources with short relevance notes.
- `learning-records/NNNN-<slug>.md`: durable lessons and corrected misconceptions.
- `lessons/NNNN-<slug>.html`: short interactive lessons.
- `reference/`: compact material meant for repeated lookup.
- `assets/`: reusable lesson styles and widgets.
- `NOTES.md`: explicit teaching preferences only.

Preview the scaffold and obtain approval before creating it. Do not add teaching files to an unrelated product repository merely because it is the current directory.

## Lesson Loop

1. Read the mission, preferences, prior records, and reusable assets.
2. Identify the learner's next reachable capability. If the mission is missing or materially changed, resolve it before authoring a lesson.
3. Research the minimum required knowledge from primary sources. Cite claims in the lesson.
4. Create one short lesson with explanation, retrieval practice, immediate feedback, and one concrete win.
5. Reuse existing assets. Add a reusable component only when a second lesson will benefit.
6. Ask the learner to attempt the task. Record demonstrated learning, confusion, and corrected errors after observing evidence.
7. Recommend the next lesson without generating it unless requested.

## Output Contract

- mission and target capability
- lesson and reference paths
- practice and feedback loop
- evidence of learning
- updated learning records
- residual gaps
- next lesson recommendation
