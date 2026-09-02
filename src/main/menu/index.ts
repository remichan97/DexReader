import { Menu, MenuItemConstructorOptions } from 'electron'

import { buildViewMenu } from './view.menu'
import { buildFileMenu } from './file.menu'
import { buildLibraryMenu } from './library.menu'
import { buildHelpMenu } from './help.menu'
import { getMainWindow } from '../window'
import { MenuState } from './menu-state'

export function createMenu(state: MenuState): Menu {
  const mainWindow = getMainWindow()
  if (!mainWindow) {
    throw new Error('Cannot create menu before the main window exists')
  }

  const template: MenuItemConstructorOptions[] = [
    buildFileMenu(mainWindow, state),
    buildViewMenu(mainWindow),
    buildLibraryMenu(mainWindow, state),
    buildHelpMenu(mainWindow)
  ]

  return Menu.buildFromTemplate(template)
}

export function updateMenuState(state: MenuState): void {
  const menu = createMenu(state)
  Menu.setApplicationMenu(menu)
}
