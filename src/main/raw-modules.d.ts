/**
 * Vite's `?raw` suffix imports a file's text as a string. `electron-vite/node` (the only type
 * package the node tsconfig loads) declares `?asset` but not `?raw`, and `vite/client` has it
 * but also drags in browser globals, so only the shape the main process uses is declared here.
 */
declare module '*.md?raw' {
  const text: string
  export default text
}
