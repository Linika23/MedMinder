---
name: superpowers-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents

## Overview
When you have multiple unrelated failures (different test files, different subsystems, different bugs), investigating them sequentially wastes time. Each investigation is independent and can happen in parallel.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently.

## When to Use
**Use when:**
- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem can be understood without context from others
- No shared state between investigations

**Don't use when:**
- Failures are related (fix one might fix others)
- Need to understand full system state
- Agents would interfere with each other

## The Pattern

### 1. Identify Independent Domains
Group failures by what's broken. Each domain is independent.

### 2. Create Focused Agent Tasks
Each agent gets:
- **Specific scope:** One test file or subsystem
- **Clear goal:** Make these tests pass
- **Constraints:** Don't change other code
- **Expected output:** Summary of what you found and fixed

### 3. Dispatch in Parallel
All agents run concurrently on their separate domains.

### 4. Review and Integrate
When agents return:
- Read each summary
- Verify fixes don't conflict
- Run full test suite
- Integrate all changes

## Agent Prompt Structure
Good agent prompts are:
1. **Focused** - One clear problem domain
2. **Self-contained** - All context needed to understand the problem
3. **Specific about output** - What should the agent return?

## Common Mistakes
- **❌ Too broad:** "Fix all the tests" → agent gets lost
- **✅ Specific:** "Fix agent-tool-abort.test.ts" → focused scope
- **❌ No context:** Paste the error messages and test names
- **❌ No constraints:** Agent might refactor everything
- **❌ Vague output:** "Fix it" → you don't know what changed

## When NOT to Use
- Related failures (investigate together first)
- Need full context to understand
- Exploratory debugging
- Shared state (agents editing same files)

## Key Benefits
1. **Parallelization** - Multiple investigations happen simultaneously
2. **Focus** - Each agent has narrow scope
3. **Independence** - Agents don't interfere
4. **Speed** - N problems solved in time of 1
