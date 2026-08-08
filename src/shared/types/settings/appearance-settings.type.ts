import { SidebarSize } from '../../enums/settings/sidebar-size.enum'
import { StartupPage } from '../../enums/settings/startup-page.enum'
import { AppTheme } from '../../enums/settings/theme-mode.enum'

export interface AppearanceSettings {
  theme: AppTheme
  accentColor?: string // Accent color in hex format, e.g., '#FF5733'
  startupPage: StartupPage
  sidebarSize: SidebarSize
}
