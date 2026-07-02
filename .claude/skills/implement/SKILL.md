---
name: implement
description: Implement a task, feature, or bug fix for the project from an existing plan.
---

# Instructions

Help the user implement a task, feature, or bug fix by carrying out an existing plan end-to-end.

1. **Initialisation**: Read the memory bank files (`.github/memory-bank/`), starting with `active-context.md`, to understand the current state of the project.
2. **Locate the plan**: Find the relevant plan file in `claude-plans/` (created by the `plan` skill). If no plan exists for the requested work, tell the user to run `/plan` first instead of improvising one.
3. **Implementation**: Work through the plan's steps in order, following the coding standards in `CLAUDE.md` (TypeScript standards, process-specific rules, IPC/filesystem/database conventions). Run `npm run typecheck` and `npm run lint` as you go, not just at the end.
4. **Review**: Before wrapping up, check the implementation against the plan's requirements and confirm the quality gates pass.
5. **Clean up the plan file**: Once implementation is complete and reviewed, delete the plan file from `claude-plans/` to avoid stale plans accumulating.
6. **Update active context**: Add an entry to `## Recent Changes` in `.github/memory-bank/active-context.md` following the existing template (date, type, summary, key changes, impact, status). Update `## Current Status` / `## Known Issues` if the change affects them.

If anything in the plan is unclear, ambiguous, or contradicted by the current codebase, stop and ask the user before proceeding rather than guessing.

## General guidelines

- Treat the plan as the source of truth for scope — don't add unplanned work, and don't silently drop steps.
- For large plans, break work into logical commits/checkpoints and report progress after each one rather than going silent until the end.
- If implementing in parts across multiple sessions, leave a note in the plan file of what's done and what remains, and reflect that in `active-context.md` before ending the session.
- Never skip pre-commit hooks (`--no-verify`) to work around a failing typecheck or lint — fix the underlying issue.
- Summarise what changed and reference the updated `active-context.md` entry when done.
