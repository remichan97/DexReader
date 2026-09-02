import { ipcMain } from 'electron'
import { updateMenuState } from '../../menu/index'
import type { MenuState } from '../../menu/menu-state'

// Menu state is a one-way push from renderer to main (no response expected), so this
// stays a plain ipcMain.on listener rather than a wrapIpcHandler request/response call.
let menuState: MenuState = {
  isIncognito: false
}

export function registerMenuStateHandler(): void {
  ipcMain.on('update-menu-state', (_, state: Partial<MenuState>) => {
    menuState = { ...menuState, ...state }
    updateMenuState(menuState)
  })
}
