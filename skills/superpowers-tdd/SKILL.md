---
name: superpowers-tdd
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview
Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## When to Use
**Always:** New features, bug fixes, refactoring, behavior changes.

**Exceptions (ask user):** Throwaway prototypes, generated code, configuration files.

## Red-Green-Refactor

### RED - Write Failing Test
Write one minimal test showing what should happen.
- One behavior per test
- Clear name describing behavior
- Real code (no mocks unless unavoidable)

### Verify RED - Watch It Fail
**MANDATORY. Never skip.**
```bash
npm test path/to/test.test.ts
```
Confirm: Test fails (not errors), failure message is expected, fails because feature missing.

### GREEN - Minimal Code
Write simplest code to pass the test. Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN - Watch It Pass
**MANDATORY.**
Confirm: Test passes, other tests still pass, output pristine.

### REFACTOR - Clean Up
After green only: Remove duplication, improve names, extract helpers. Keep tests green.

### Repeat
Next failing test for next feature.

## Good Tests
| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear** | Name describes behavior | `test('test1')` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |

## Common Rationalizations
| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds |
| "I'll test after" | Tests passing immediately prove nothing |
| "Need to explore first" | Fine. Throw away exploration, start with TDD |
| "TDD will slow me down" | TDD faster than debugging |

## Red Flags - STOP and Start Over
- Code before test
- Test passes immediately
- Can't explain why test failed
- Rationalizing "just this once"

**All of these mean: Delete code. Start over with TDD.**

## Example: Bug Fix
**Bug:** Empty email accepted

**RED:** `test('rejects empty email', ...)` → FAIL
**GREEN:** Add `if (!data.email?.trim())` → PASS
**REFACTOR:** Extract validation if needed

## Final Rule
```
Production code → test exists and failed first
Otherwise → not TDD
```
