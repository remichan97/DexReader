import { CanvasMode } from '../enums/canvas-mode.enum'
import { SidebarSize } from '../enums/sidebar-size.enum'
import { StartupPage } from '../enums/startup-page.enum'
import { AppTheme } from '../enums/theme-mode.enum'

export interface AppearanceSettings {
  theme: AppTheme
  accentColor?: string // Accent color in hex format, e.g., '#FF5733'
  startupPage: StartupPage
  sidebarSize: SidebarSize
  canvasMode: CanvasMode
}
