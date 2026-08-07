# Decision artifacts

## Multi-session decision map

Keep one map under `.build-stacks/issues/<effort>/decision-map.md` with:

- the destination that makes the route buildable;
- settled decisions as links with one-line answers;
- an unblocked frontier of precise research, prototype, interview, or decision tasks;
- fog that is still too vague to become a task;
- out-of-scope work with reasons.

Resolve one material decision per session. Keep the answer in its owning task and use the map only as an index. Use `build-runtime-session` for continuation state and hand the settled result to `build-flow-specwork`.

## External questionnaire

Use questionnaire mode only for a domain expert or another person who holds facts the current user cannot supply.

1. Establish the recipient, relationship, expertise, available time, and the decision the answers must unlock.
2. Remove questions already answerable from repository evidence.
3. Draft from [questionnaire-template.md](../assets/questionnaire-template.md). Lead with the highest-value questions, ask one idea at a time, accept partial answers, and end with a catch-all.
4. Match the user's language and tone. Preview before writing.
5. On approval, save to the requested durable docs path or `.build-stacks/questionnaires/<slug>.md`.
6. Verify that every required decision or fact is covered without asking the recipient to solve the user's product strategy.
