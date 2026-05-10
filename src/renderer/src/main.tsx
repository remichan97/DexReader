import './assets/tokens.css'
import './assets/utilities.css'
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { globalErrorHandler } from './utils/errorHandler'
import './i18n/config' // Import i18n configuration to initialize translations

// Initialize global error handlers
globalErrorHandler.initialize()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
