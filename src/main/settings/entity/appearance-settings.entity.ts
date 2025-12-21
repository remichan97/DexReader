import { AppTheme } from '../enum/theme-mode.enum'

export interface AppearanceSettings {
  theme: AppTheme
  accentColor?: string // Accent color in hex format, e.g., '#FF5733'
}
