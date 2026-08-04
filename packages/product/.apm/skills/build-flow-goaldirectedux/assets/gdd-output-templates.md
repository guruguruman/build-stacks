# GDD Output Templates

このファイルは、Goal-Directed UX Design Skillで使う出力テンプレート集である。必要なものをコピーして使う。

---

## 1. Discovery Brief

```markdown
# Discovery Brief

## Problem Statement
現状、[persona] は [context] において [goal] を十分に達成できず、主因は [cause] である。その結果、[business/user impact] が発生している。

## Vision Statement
新しい [product/feature/experience] は、[persona] が [goal] を [success measure] で達成できるようにし、[business outcome] をもたらす。

## Execution Mode
[Full / Assisted / Provisional]

## Initial Persona Hypothesis
- Persona: [name/role]
- Evidence level: [V/P/H]
- Reason: [reason]

## Goals
- Experience goal: [how the user should feel]
- End goal: [what the user should accomplish]
- Life goal, if relevant: [long-term self-image/value]

## Scope
In scope:
- [item]

Out of scope / Non-goals:
- [item]

## Missing Information
- [information]

## Immediate Next Steps
1. [step]
2. [step]
3. [step]
```

---

## 2. Evidence Log

```yaml
evidence_log:
  - id: E001
    level: V | P | H
    source_type: user_observation | contextual_interview | stakeholder | sme | analytics | support_log | competitive_audit | assumption
    source_name: ""
    date: "YYYY-MM-DD"
    observed_behavior: ""
    context: ""
    user_goal_signal: ""
    pain_or_workaround: ""
    quote_or_artifact: ""
    design_implication: ""
    confidence: high | medium | low
```

---

## 3. Behavior Variable Matrix

```markdown
| User/Source | Behavior Variable 1 | Behavior Variable 2 | Behavior Variable 3 | Notes |
|---|---:|---:|---:|---|
| U1 | 1 | 5 | 3 | [note] |
| U2 | 5 | 2 | 4 | [note] |
```

---

## 4. Persona Pack

```yaml
personas:
  - id: P1
    status: validated | provisional
    type: primary
    name: ""
    one_line_summary: ""
    role_and_responsibility: ""
    usage_context: ""
    experience_goals:
      - ""
    end_goals:
      - ""
    life_goals:
      - ""
    behaviors:
      - ""
    mental_models:
      - ""
    tools_and_artifacts:
      - ""
    environment:
      - ""
    constraints:
      - ""
    key_pains:
      - ""
    success_definition:
      - ""
    evidence:
      - source_id: E001
        level: V | P | H
        summary: ""

persona_priority_rationale:
  primary_persona: P1
  rationale:
    - ""
  secondary_personas:
    - P2
  negative_personas:
    - P9
```

---

## 5. Scenario Pack

```yaml
scenarios:
  - id: S1
    type: context
    status: validated | provisional
    persona_id: P1
    trigger: ""
    preconditions:
      - ""
    desired_outcome: ""
    experience_goal_supported: ""
    narrative: >
      [発端、文脈、制約、ユーザーの判断、期待する支援、成功状態を自然文で書く]
    required_information:
      - ""
    required_system_support:
      - ""
    success_criteria:
      - ""
    evidence:
      - source_id: E001
        level: V | P | H

  - id: S2
    type: key_path
    persona_id: P1
    narrative: >
      [主要ゴールを自然に達成する標準フロー]

  - id: S3
    type: validation
    persona_id: P1
    alternate_condition: ""
    expected_system_behavior: ""
    recovery_path: ""
```

---

## 6. Requirements Pack

```yaml
requirements:
  - id: R1
    status: validated | provisional
    statement: "[persona] が [context] で [goal] を達成するために、[needed capability] できること。"
    category: functional | data | content | interaction | constraint | measurement
    source_persona: P1
    source_goal: ""
    goal_type: experience | end | life
    source_scenarios:
      - S1
    evidence:
      - source_id: E001
        level: V | P | H
    business_rationale: ""
    technical_constraints:
      - ""
    priority: must | should | could | wont
    acceptance_criteria:
      - ""
    non_goals:
      - ""
```

---

## 7. Traceability Matrix

```markdown
| Evidence | Persona | Goal | Scenario | Requirement | Design Element | Implementation Task |
|---|---|---|---|---|---|---|
| E001 | P1 | G1 | S1 | R1 | D1 | T1 |
```

---

## 8. UX Framework

```yaml
ux_framework:
  conceptual_model:
    primary_objects:
      - id: O1
        name: ""
        user_term: ""
        description: ""
    relationships:
      - ""
  information_architecture:
    sections:
      - id: IA1
        name: ""
        purpose: ""
        priority: 1
  navigation_model:
    entry_points:
      - ""
    primary_path:
      - ""
    secondary_paths:
      - ""
    recovery_paths:
      - ""
  flows:
    - id: F1
      supports_scenario: S2
      steps:
        - step: 1
          user_intent: ""
          system_response: ""
          requirements:
            - R1
```

---

## 9. Detailed UX Spec

```yaml
design_spec:
  screens:
    - id: D1
      name: ""
      supported_persona: P1
      supported_scenarios:
        - S1
      supported_requirements:
        - R1
      primary_user_question: ""
      information_priority:
        - priority: 1
          item: ""
          reason: ""
      main_actions:
        - action: ""
          requirement_id: R1
      states:
        default: ""
        empty: ""
        loading: ""
        success: ""
        error: ""
        partial_success: ""
        permission_denied: ""
      content_rules:
        - ""
      accessibility:
        - ""
      telemetry:
        - event: ""
          properties:
            - ""
```

---

## 10. Build Handoff

```yaml
build_handoff:
  implementation_tasks:
    - id: T1
      title: ""
      requirement_ids:
        - R1
      design_element_ids:
        - D1
      frontend:
        - ""
      backend:
        - ""
      data:
        - ""
      api:
        - ""
      states:
        - ""
      accessibility:
        - ""
      telemetry:
        - ""
      tests:
        - ""
      acceptance_criteria:
        - ""

  api_requirements:
    - id: API1
      supports_requirement: R1
      endpoint_or_capability: ""
      request_fields:
        - ""
      response_fields:
        - ""
      error_cases:
        - code: ""
          user_message: ""
          recovery: ""
      permissions:
        - ""
      audit_log:
        required: true
        fields:
          - ""
```

---

## 11. Validation Plan

```yaml
validation_plan:
  key_path_walkthrough:
    scenario_id: S2
    checks:
      - ""
  validation_scenarios:
    - scenario_id: S3
      expected_result: ""
  user_test_tasks:
    - task: ""
      success_criteria:
        - ""
  metrics:
    - goal: ""
      metric: ""
      baseline: ""
      target: ""
  residual_risks:
    - risk: ""
      impact: high | medium | low
      mitigation: ""
```

---

## 12. Design Decision Log

```yaml
design_decisions:
  - id: DD1
    date: "YYYY-MM-DD"
    decision: ""
    reason: ""
    affected_personas:
      - P1
    affected_requirements:
      - R1
    alternatives_considered:
      - ""
    tradeoffs:
      - ""
    evidence:
      - E001
    status: proposed | accepted | rejected | superseded
```
