---
name: Preload Instructions
description: Preload scripts instructions
applyTo: src/preload/**/*.ts
---

# Preload Instructions

This file provides detailed instructions for implementing code in the Preload script of the project. The Preload in this context refers to scripts that help exposing certain APIs from main process to the renderer process in a secure way. As the project is using Electron, it is crucial to follow these guidelines to ensure consistency, maintainability, and reliability of the code.

All code for the preload script is located in the `src/preload` directory. When implementing features, tasks, or bug fixes in this area, please adhere to the following instructions:

- Always refer to the memory bank files for context and ensure that your implementation aligns with the overall project goals and architecture.
- All IPC channels should returns a wrapped IpcResponse defined in `src/preload/ipc.types.ts` to ensure consistent response formatting across all IPC channels.
- ALL IPC channels exposed on main process located in `src/preload/ipc/handlers` directory must be properly exposed through the `contextBridge` API of Electron in `src/preload/index.ts` file, and the exposed API should be properly typed to ensure type safety and better developer experience when using the exposed APIs in the renderer process.
- All IPC channels exposed on main process must also be present on `src/preload/index.d.ts` file to ensure that the type definitions are properly generated and available for use in the renderer process, and the type definitions should be properly maintained and updated as the IPC channels evolve to ensure that they accurately reflect the current state of the IPC channels and provide accurate type information for developers using the exposed APIs in the renderer process.
