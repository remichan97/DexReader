import { randomBytes } from 'node:crypto'

let cspNonce: string | undefined

/**
 * Generates a new CSP nonce for the current app launch. Must be called once,
 * before the renderer's document is requested, so the nonce baked into the
 * response header matches the one handed to the renderer's Griffel renderer.
 */
export function generateCspNonce(): string {
  cspNonce = randomBytes(16).toString('base64')
  return cspNonce
}

export function getCspNonce(): string {
  if (!cspNonce) {
    throw new Error('CSP nonce has not been generated yet - call generateCspNonce() first')
  }
  return cspNonce
}

/**
 * `style-src` carries the nonce so Griffel's runtime-injected <style> tags are
 * permitted without weakening the policy to 'unsafe-inline'. script-src/img-src
 * are unchanged from the previous <meta> tag. Production only - the built app
 * serves real .css files via <link>, which 'self' already covers, so only
 * Griffel's runtime styles need the nonce.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  return `default-src 'self'; script-src 'self'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: mangadex: local-manga:;`
}

/**
 * Vite's dev server injects un-nonced inline content that production never ships:
 * component CSS via <style> tags (not just for HMR, on initial load too) and
 * @vitejs/plugin-react's React Fast Refresh preamble <script>. Both need
 * 'unsafe-inline' instead of the nonce. A nonce-source in the same directive would
 * make browsers ignore 'unsafe-inline' entirely (a deliberate CSP backwards-
 * compatibility rule), so the nonce is deliberately left out here rather than
 * combined with it. Dev-only; never shipped.
 */
export const DEV_CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: mangadex: local-manga:;"
