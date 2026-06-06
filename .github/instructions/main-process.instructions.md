---
name: 'Main Process Instructions'
description: Detailed instructions for Main Process code
applyTo: src/main/**/*.ts
---

# Main Process Instructions

This file provide detailed instructions for implementing code in the Main Process of the project. Main process in this context referring to the actual business logic of the Electron application, so it is crucial to follow these guidelines to ensure consistency, maintainability, and reliability of the code.

All code for the main process is located in the `src/main` directory. When implementing features, tasks, or bug fixes in this area, please adhere to the following instructions:

- Always refer to the memory bank files for context and ensure that your implementation aligns with the overall project goals and architecture.
- When creating new files in the `src/main` directory, follow the existing file structure and naming conventions to maintain consistency across the codebase.
- Always add logging statements at the appropriate levels (info, warning, error) using `mainLog` to facilitate debugging and monitoring of the application. Use a consistent logging format to ensure that logs are easy to read and analyze.
- When creating a new IPC channel, follow the naming convention of `channel-name:action` (for instance, `user:create`) to clearly indicate the purpose of the channel and the action it performs.
- All newly created IPC channels, if applicable, must be defined in its appropriate handler file under `src/main/ipc` directory, the handler file must be named in the format of `<channel-name>.handler.ts`, and said handler must be registered in `src/main/ipc/registry.ts` to promote better organization and maintainability of the code.
- All newly created IPC channels must use the wrapper method defined in `src/main/ipc/wrap-handler.ts` to ensure consistent error handling and response formatting across all IPC channels.
