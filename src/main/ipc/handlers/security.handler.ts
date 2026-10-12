import { getCspNonce } from '../../security/csp-nonce'
import { wrapIpcHandler } from '../wrap-handler'

export function registerSecurityHandlers(): void {
  /**
   * Get the CSP nonce generated for this app launch.
   *
   * The renderer needs this to configure Griffel's DOM renderer so Fluent's
   * runtime-injected <style> tags carry the same nonce the main process put in
   * the Content-Security-Policy response header (see src/main/security/csp-nonce.ts).
   *
   * @returns string - the current launch's CSP nonce
   */
  wrapIpcHandler('security:get-csp-nonce', () => {
    return getCspNonce()
  })
}
