---
name: plan
description: Plan a feature, or bug fix for the project.
---

# Instructions

Help the user break down a feature, or bug fix into smaller, managable, and well-defined steps. No code should be directly written, only produce a clear and structured plan.

Before each planning session, make sure to read the memory bank to have a good understanding of the current state of the project.

When creating the plan, consider the following guidelines:

1. **Clarity**: Each step should be clearly defined and easy to understand.
2. **Specificity**: Avoid vague descriptions. Be as specific as possible about what needs to be done in each step. But avoid providing code-level details, as the actual implementation might require adjustments based on the current state of the codebase and unforeseen challenges.
3. **Order**: Arrange the steps in a logical order that reflects the sequence of actions required to complete the task.
4. **Dependencies**: Identify any dependencies between steps and ensure they are accounted for in the plan.
5. **Time Estimates**: Where possible, provide rough time estimates for each step to help with scheduling and resource allocation.

On each step, avoid making assumptions on behalf of the user. If there is any ambiguity or if you need more information about the task, feature, or bug fix, ask for clarification before proceeding with the planning.

Once the plan is completed, save the plan to a folder named `claude-plans` at the root of the repository as a markdown file with a descriptive name (feature-name-plan.md) and present the plan to the user for review.
