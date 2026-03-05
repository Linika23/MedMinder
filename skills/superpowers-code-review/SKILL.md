---
name: superpowers-code-review
description: Use when receiving code review feedback, before implementing suggestions, or when completing tasks and wanting to verify work meets requirements
---

# Code Review (Requesting & Receiving)

## Receiving Code Review

### Overview
Code review requires technical evaluation, not emotional performance.

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

### The Response Pattern
```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

### Forbidden Responses
**NEVER:**
- "You're absolutely right!"
- "Great point!" / "Excellent feedback!"
- "Let me implement that now" (before verification)

**INSTEAD:**
- Restate the technical requirement
- Ask clarifying questions
- Push back with technical reasoning if wrong
- Just start working (actions > words)

### Handling Unclear Feedback
If ANY item is unclear: STOP, do not implement anything yet. ASK for clarification on unclear items.

### When To Push Back
Push back when:
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for this stack

**How:** Use technical reasoning, not defensiveness. Reference working tests/code.

### YAGNI Check
If reviewer suggests "implementing properly": grep codebase for actual usage. If unused, suggest removing (YAGNI).

### Implementation Order
For multi-item feedback:
1. Clarify anything unclear FIRST
2. Blocking issues → Simple fixes → Complex fixes
3. Test each fix individually
4. Verify no regressions

## Requesting Code Review

### When to Request
**Mandatory:** After completing major feature, before merge to main.
**Optional:** When stuck, before refactoring, after fixing complex bug.

### How to Request
1. Get git SHAs for base and head
2. Describe what was implemented
3. Reference plan or requirements
4. Act on feedback: Fix Critical immediately, Fix Important before proceeding, Note Minor for later

## The Bottom Line
**External feedback = suggestions to evaluate, not orders to follow.**
Verify. Question. Then implement. No performative agreement. Technical rigor always.
