---
name: memory-update
description: Update project memory bank system to keep track of recent changes, current status, and known issues.
---

# Instructions

Ensure that the project memory bank system is up to date with the latest information about the project. This includes updating files that track recent changes, current status, and known issues.

Before updating the memory bank, complete any outstanding tasks if possible. This includes finishing any ongoing implementations, planning, or documentation work to make sure that the memory bank will always be up to date.

When updating the memory bank, follow these steps:

1. **Initialisation**: Begin by reading all memory bank files to have a complete understanding of the current project state.
2. **Gather Information**: Collect all relevant information about recent changes, decisions, and known issues. This may include reviewing recent commits, pull requests, and discussions.
3. **Update Memory Bank Files**: Make necessary updates to the core memory bank files:
   - `active-context.md`: Reflect the latest state of the project, including recent tasks, goals, blockers, and upcoming work. Only keep the most recent 2-3 weeks worth of context.
   - `system-patterns.md`: Add any new architectural patterns, design principles, or technical decisions that have been made.
   - `tech-context.md`: Include any new technologies, frameworks, or libraries used in the project.
   - `architecture-overview.md`: Update the architectural overview to reflect any changes in the system's structure or data flow.
4. **Review**: After updating, review all memory bank files to ensure accuracy and completeness.

If any information that is unclear, ambiguous, or contradicted by the current codebase, stop and ask the user before proceeding rather than guessing.

Once the memory bank update is complete, display a summary of the changes made to each memory bank file for the user's reference. A memory update is considered complete when the user confirms that all necessary information has been captured successfully.

# General Guidelines

- Treat the memory bank as the source of truth for the project's state — do not add unverified information or omit important details.
- Cross-reference information between different memory bank files to ensure consistency.
- Ensure that all updates are clear, concise, and well-organised.
- Prioritise accuracy and completeness to facilitate smooth collaboration in future sessions.
