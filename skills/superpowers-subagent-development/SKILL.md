---
name: superpowers-subagent-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use
- Have implementation plan with mostly independent tasks
- Want to stay in current session
- Tasks can be executed sequentially with fresh context per task

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Two-stage review after each task
- Faster iteration

## The Process

For each task:
1. **Dispatch implementer subagent** with full task text + context
2. **Answer questions** if subagent asks any before proceeding
3. **Subagent implements**, tests, commits, self-reviews
4. **Dispatch spec reviewer** - confirms code matches spec
5. If issues: **implementer fixes** → re-review spec
6. **Dispatch code quality reviewer**
7. If issues: **implementer fixes** → re-review quality
8. **Mark task complete**
9. Repeat for next task

After all tasks: dispatch final reviewer for entire implementation, then use finishing-branch skill.

## Red Flags
**Never:**
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Start code quality review before spec compliance is ✅
- Move to next task while either review has open issues

**If subagent asks questions:** Answer clearly and completely.
**If reviewer finds issues:** Implementer fixes them, reviewer re-reviews. Repeat until approved.

## Advantages
- No file reading overhead (controller provides full text)
- Self-review catches issues before handoff
- Two-stage review ensures spec compliance AND code quality
- Review loops ensure fixes actually work
