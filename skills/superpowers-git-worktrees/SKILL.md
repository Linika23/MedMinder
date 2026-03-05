---
name: superpowers-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees
---

# Using Git Worktrees

## Overview
Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

## Directory Selection Process
Follow this priority order:

### 1. Check Existing Directories
```bash
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```
If both exist, `.worktrees` wins.

### 2. Check project docs for preferences

### 3. Ask User
If no directory exists and no preference found:
```
1. .worktrees/ (project-local, hidden)
2. Global location
```

## Safety Verification
For project-local directories, MUST verify directory is ignored:
```bash
git check-ignore -q .worktrees 2>/dev/null
```
If NOT ignored: Add to .gitignore, commit, then proceed.

## Creation Steps

1. **Detect Project Name:** `basename "$(git rev-parse --show-toplevel)"`
2. **Create Worktree:** `git worktree add "$path" -b "$BRANCH_NAME"`
3. **Run Project Setup:** Auto-detect (package.json → npm install, etc.)
4. **Verify Clean Baseline:** Run tests to ensure worktree starts clean
5. **Report Location**

## Quick Reference
| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Neither exists | Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |

## Red Flags
**Never:**
- Create worktree without verifying it's ignored
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
