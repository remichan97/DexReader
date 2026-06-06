---
name: TypeScript Standards
description: General TypeScript Standards
applyTo: src/**/*.ts, src/**/*.tsx
---

# General TypeScript Standards

This file describes the currently adopted Typescript code style for the project. It is important to follow these standards to ensure consistency and maintainability of the codebase.
This project is currently adopting ESLint, and Prettier for code linting, and formatting, with the current configuration located in the `.eslintrc.js` and `.prettierrc.yaml` files in the root directory. Most of the code style applied from these tools are default rules, however, some additional standard are required to be followed when writing TypeScript code for this project, which are outlined below.

The following additional standards should be followed when writing TypeScript code for this project:

Do:

- All constants should be defined in uppercase with underscores (e.g., `MAX_VALUE`).
- Use camelCase for variable and function names (e.g., `myVariable`, `myFunction`).
- Use `interface` for defining object shapes and `type` for defining type aliases, union types, and intersection types.
- Always use explicit return types for functions and methods to improve readability and maintainability of the code.
- Use `readonly` modifier for properties that should not be modified after initialization to enhance immutability and prevent unintended side effects.
- Use `enum` for defining a set of named constants that are related to each other, and use `const enum` if the enum values are not needed at runtime to improve performance.
- Prefer `undefined` over `null` under most circumstances, and avoid using `null` unless it is necessary for a specific use case or to maintain compatibility with existing code.
- Assign proper access modifiers (`public`, `private`, `protected`) to class members to clearly indicate their intended visibility and usage, and to enhance encapsulation and maintainability of the code.
- Use `async/await` for handling asynchronous operations instead of callbacks or Promises directly, as it leads to cleaner and more readable code.
- Wrap potential error-prone code in try-catch blocks to handle exceptions gracefully and prevent unhandled exceptions from crashing the application.

Avoid:

- Using null forgiving operator (`!`) unless absolutely necessary, as it can lead to runtime errors if the value is actually null or undefined. Depending on the circumstances, consider using optional chaining (`?.`) or providing a default value with the nullish coalescing operator (`??`) to handle cases where a value may be null or undefined more safely.
- Using `as` for type assertions unless it is necessary to override the inferred type. Instead, try to write code that allows TypeScript to infer the correct types without needing to use type assertions, as this promotes better type safety and maintainability of the code.
- Using TypeScript check forgiving comments (e.g., `// @ts-ignore`) unless it is absolutely necessary to suppress a specific TypeScript error that cannot be resolved in a better way. Instead, try to address the underlying issue that is causing the TypeScript error, as this promotes better code quality and maintainability.
- Using deprecated/outdated TypeScript methods, properties, as they will be removed in the future and can lead to compatibility issues. Always refer to the official TypeScript documentation for the most up-to-date information on available features and best practices.

Don't:

- Do NOT use in-line object destructuring, or any other form of destructuring, in function parameters. Instead, define a clear interface for the parameters and use that interface in the function signature. This promotes better readability and maintainability of the code.
- Do NOT use `any` type, as it defeats the purpose of using TypeScript. Depending on the situation, use a more specific type, or use `unknown` if the type is not known at the time of writing the code, and then narrow down the type as much as possible before using it.
- Do NOT use `var` for variable declarations. Always use `let` or `const` to ensure block-scoping and prevent unintended variable hoisting.
- Do NOT use deprecated features of TypeScript, such as `namespace` and `module` for organizing code. Instead, use ES6 modules with `import` and `export` statements to structure the codebase in a modern and maintainable way.
- Do NOT reassign `this` in class methods. Instead, use arrow functions or bind the method to the class instance to ensure that `this` refers to the correct context.
- Do NOT use `eval` or any other form of dynamic code execution, as it can lead to security vulnerabilities and performance issues. Instead, write code that is statically analyzable and does not rely on dynamic code execution.
