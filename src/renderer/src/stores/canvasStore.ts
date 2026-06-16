/**
 * Canvas State Store - Manages hero backdrop canvas mode
 *
 * Manages:
 * - Canvas mode (none, blurred, gradient, accent)
 *
 * Persistence: canvasMode persisted to settings.json (not localStorage)
 */

import { create } from 'zustand'

export type CanvasMode = 'none' | 'blurred' | 'gradient' | 'accent'

interface CanvasState {
  // Canvas mode
  canvasMode: CanvasMode

  // Actions
  setCanvasMode: (mode: CanvasMode) => void
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  // Initial state (default to none, will be loaded from settings on app init)
  canvasMode: 'none',

  // Actions
  setCanvasMode: (canvasMode) => set({ canvasMode })
}))
