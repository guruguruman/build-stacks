---
name: build-flow-questionnaire
description: "Create a focused discovery questionnaire for an external domain expert. Use when the user asks to create a focused discovery questionnaire for an external domain expert. Common requests include \"make a questionnaire\", \"ask a domain expert\", \"discovery questions\"."
---

# build-flow-questionnaire

Create a questionnaire for the person who holds information the current user cannot supply. Interview the user about the send, not about facts they do not know.

## Workflow

1. Establish the recipient's role, relationship, expertise, and available time.
2. Establish exactly what the user must be able to decide or do after receiving the answers.
3. List known context and unresolved gaps. Remove questions already answerable from repository evidence.
4. Draft the questionnaire from [questionnaire-template.md](assets/questionnaire-template.md):
   - lead with the highest-value questions;
   - ask one idea per question;
   - explain why a question matters only when ambiguity is likely;
   - make partial answers and uncertainty explicitly acceptable;
   - end with a catch-all.
5. Preview the draft. On approval, write it to the requested durable docs location or `.build-stacks/questionnaires/<slug>.md` for runtime use.
6. Verify every requested decision or fact is covered by at least one question.

## Output Contract

- recipient and purpose
- required decisions or facts
- questionnaire path
- coverage check
- assumptions and privacy review
- residual gaps
- next handoff
