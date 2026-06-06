---
name: Renderer Process Instructions
description: Instruction for Renderer process implementation
applyTo: src/renderer/**/*.tsx
---

# Renderer Process Instructions

This file provides detailed instructions for implementing code in the Renderer Process of the project. The Renderer process in this context refers to the part of the Electron application that handles the user interface and interacts with the user. As the project is using React for the frontend, it is crucial to follow these guidelines to ensure consistency, maintainability, and reliability of the code.

All code for the renderer process is located in the `src/renderer` directory. When implementing features, tasks, or bug fixes in this area, please adhere to the following instructions:

- Always refer to the memory bank files for context and ensure that your implementation aligns with the overall project goals and architecture.
- Unless the interface, type, or functions are only self-used within a component, they should be defined in separate files under an easy-to-find directory (e.g., `src/renderer/interfaces`, `src/renderer/types`, `src/renderer/utils`) to promote better organization and reusability of code.
- Create separate components for different UI components for a view if the view is complex. This promotes better organization and maintainability of the code. However, for simple views, it is acceptable to have a single component as long as it does not become too large or difficult to manage.
- Log important events, warnings, and errors using `rendererLog` to facilitate debugging and monitoring of the application. Use a consistent logging format to ensure that logs are easy to read and analyze.
- All dangerous actions (for instance, file, or in-app item deletion, resetting settings, etc.) MUST be confirmed by using the native dialog of Electron, which can be accessed through IPC channels. This blocks the app, giving full focus to the message, and ensures that the user is fully aware of the consequences of their actions, thus preventing accidental data loss or other unintended consequences.
