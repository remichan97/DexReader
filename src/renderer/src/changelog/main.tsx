import './changelog.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createDOMRenderer,
  FluentProvider,
  RendererProvider,
  type Theme
} from '@fluentui/react-components'
import i18next from '../i18n/config' // Initialises translations for every namespace
import { createDexReaderThemes } from '../theme/fluentTheme'
import { ChangelogApp } from './ChangelogApp'
import { readWindowParams } from './windowParams'

// The accent the window falls back to when the system one cannot be read (Windows blue).
const FALLBACK_ACCENT = '#0078d4'

/**
 * Fetches the CSP nonce main generated for this launch so Griffel's runtime-injected <style>
 * tags carry it. Without it the window still renders, only partly unstyled, so a failure is not
 * allowed to leave it blank. Main logs the failure.
 */
async function getCspNonce(): Promise<string | undefined> {
  try {
    const result = await globalThis.changelog.getCspNonce()
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

async function getAccentColour(): Promise<string> {
  try {
    const result = await globalThis.changelog.getSystemAccentColour()
    return result.success && result.data ? result.data : FALLBACK_ACCENT
  } catch {
    return FALLBACK_ACCENT
  }
}

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Failed to find the root element to mount the changelog into')
  }

  // The nonce comes first: nothing may inject a style until the renderer carries it.
  const [nonce, accentColour] = await Promise.all([getCspNonce(), getAccentColour()])
  const { language, theme } = readWindowParams(globalThis.location.search)

  await i18next.changeLanguage(language)
  document.documentElement.lang = language
  document.title = i18next.t('changelog:title')

  const themes = createDexReaderThemes(accentColour)
  const fluentTheme: Theme = theme === 'dark' ? themes.dark : themes.light
  const griffelRenderer = createDOMRenderer(document, {
    styleElementAttributes: nonce ? { nonce } : undefined
  })

  createRoot(rootElement).render(
    <StrictMode>
      <RendererProvider renderer={griffelRenderer}>
        <FluentProvider theme={fluentTheme}>
          <ChangelogApp language={language} />
        </FluentProvider>
      </RendererProvider>
    </StrictMode>
  )
}

void bootstrap()
