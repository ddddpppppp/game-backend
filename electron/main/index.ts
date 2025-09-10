import process from 'node:process'
import { app, BrowserWindow, Menu } from 'electron'
import { indexHtml, url } from '../config/pathConfig'
import { createControlWindow, getControlWindow } from './windowManager'
import './ipcHandlers'
import './timerControl'

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

if (app.isPackaged) {
  process.env.NODE_ENV = 'production'
}

app.on('ready', () => {
  createControlWindow()
  if (process.env.NODE_ENV === 'production') {
    Menu.setApplicationMenu(null)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools()
    }
  })
})

app.on('activate', async () => {
  let controlWindow = getControlWindow()
  if (controlWindow === null) {
    if (process.env.NODE_ENV === 'production') {
      controlWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          devTools: true,
        },
      })
      controlWindow.loadFile(indexHtml)
    }
    else {
      controlWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          devTools: true,
        },
      })
      controlWindow.loadURL(url)
    }
  }
})
