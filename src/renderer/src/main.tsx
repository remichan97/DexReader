import './assets/tokens.css'
import './assets/utilities.css'
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createDOMRenderer, RendererProvider } from '@fluentui/react-components'
import App from './App'
import { globalErrorHandler } from './utils/errorHandler'
import { rendererLog } from './services/logging.service'
import './i18n/config' // Import i18n configuration to initialize translations

// Initialize global error handlers
globalErrorHandler.initialize()

/**
 * Fetches the CSP nonce main generated for this launch (src/main/security/csp-nonce.ts)
 * so Griffel's runtime-injected <style> tags carry it and satisfy the response-header
 * CSP without 'unsafe-inline'. Falls back to rendering without a nonce on failure rather
 * than leaving the window blank - Fluent styles would be CSP-blocked in that case, but
 * the rest of the app (including the untouched hand-rolled components) still works.
 */
async function getCspNonce(): Promise<string | undefined> {
  try {
    const result = await globalThis.api.getCspNonce()
    if (!result.success) {
      rendererLog.error('[Bootstrap] Failed to fetch CSP nonce:', result.error)
      return undefined
    }
    return result.data
  } catch (error) {
    rendererLog.error('[Bootstrap] Failed to fetch CSP nonce:', error)
    return undefined
  }
}

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Failed to find the root element to mount the app into')
  }

  const nonce = await getCspNonce()
  const griffelRenderer = createDOMRenderer(document, {
    styleElementAttributes: nonce ? { nonce } : undefined
  })

  createRoot(rootElement).render(
    <StrictMode>
      <RendererProvider renderer={griffelRenderer}>
        <App />
      </RendererProvider>
    </StrictMode>
  )
}

void bootstrap()
