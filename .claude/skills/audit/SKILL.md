---
name: audit
description: Audit the project for potential issues, code quality, security vulnerabilities, and adherence to best practices.
---

# Instructions

Help the user thoroughly audit the project for potential issues, code quality, security vulnerabilities, logical errors, and adherence to best practices.

Given the current implementing work, or if there is no current planned work (i.e., if there is no plan file located at `claude-plans/`), audit the project by the given scope requested by the user. If there is no specific scope provided, perform a comprehensive audit of the entire project.

When conducting the audit, consider the following areas:

1. **Code Quality Audit**: Review the codebase for code quality issues, including but not limited to code readability, maintainability, and adherence to coding standards. Identify any areas of the code that could be refactored for improved clarity or performance.
2. **Security Audit**: Analyze the codebase for potential security vulnerabilities, such as SQL injection, cross-site scripting (XSS), and other common security issues. Identify any areas of the code that may be susceptible to attacks and recommend improvements to enhance security.
3. **Logical Audit** : Review the code for logical errors, such as incorrect assumptions, edge cases that are not handled, and potential bugs. Identify any areas of the code that may lead to unexpected behavior or errors and recommend improvements to enhance the robustness of the code.
4. **Best Practices Audit**: Evaluate the codebase for adherence to best practices, including but not limited to proper use of design patterns, efficient algorithms, and appropriate use of libraries and frameworks. Identify any areas of the code that could be improved by following best practices and recommend changes to enhance the overall quality of the code.

After completing the audit, provide a detailed report summarizing your findings, including areas of concern, ordered by severity, and recommended actions for improvement. The report should be structured in a clear and organized manner, making it easy for the user to understand the issues identified and the steps needed to address them.
