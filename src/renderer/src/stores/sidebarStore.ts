/**
 * Sidebar State Store - Manages sidebar display mode
 *
 * Manages:
 * - Sidebar display mode (full, compact, auto-hide)
 *
 * Persistence: displayMode persisted to settings.json (not localStorage)
 */

import { create } from 'zustand'

export type SidebarDisplayMode = 'full' | 'compact' | 'auto-hide'

interface SidebarState {
  // Display mode
  displayMode: SidebarDisplayMode

  // Actions
  setDisplayMode: (mode: SidebarDisplayMode) => void
}

export const useSidebarStore = create<SidebarState>()((set) => ({
  // Initial state (default to full, will be loaded from settings on app init)
  displayMode: 'full',

  // Actions
  setDisplayMode: (displayMode) => set({ displayMode })
}))
