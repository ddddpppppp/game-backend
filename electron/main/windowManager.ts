import path from 'node:path'
import process from 'node:process'
import { BrowserWindow, session } from 'electron'
import { __dirname, indexHtml, preloadJs, url } from '../config/pathConfig'

let controlWindow: BrowserWindow | null = null
const mainWindows: { window: BrowserWindow, containerId: string }[] = []

// 绑定 ESC 键监听的通用函数
function bindEscapeListener(window: BrowserWindow) {
  window.webContents.on('before-input-event', (_, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
      window.hide()
    }
  })
}

// 创建中控台窗口
export function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1600,
    height: 600,
    icon: path.join(__dirname, '../../icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: preloadJs,
    },
  })
  controlWindow.maximize()
  if (process.env.NODE_ENV === 'production') {
    controlWindow.loadFile(indexHtml)
  }
  else {
    controlWindow.loadURL(url)
    controlWindow.webContents.openDevTools()
  }
  controlWindow.on('closed', () => {
    // 强制关闭所有已创建的窗口，包括最小化的窗口
    for (const item of [...mainWindows]) {
      item.window.setClosable(true)
      item.window.close()
    }
    // 清空窗口列表
    mainWindows.length = 0
    controlWindow = null // 释放内存
  })
  return controlWindow
}

// 创建Facebook窗口
export function createBrowserWindow(containerId: string) {
  const persistentSession = session.fromPartition(`persist:${containerId}`, {
    cache: true,
  })
  const window = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(__dirname, '../../icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      session: persistentSession,
      preload: preloadJs,
    },
    show: false,
    resizable: true,
  })
  window.loadURL('http://baidu.com')
  mainWindows.push({ window, containerId })

  // 监听窗口最小化事件
  window.on('minimize', () => {
    const targetWindow = mainWindows.find(({ containerId: id }) => id === containerId)
    if (targetWindow) {
      targetWindow.window.hide()
    }
  })

  // 监听窗口关闭事件，自动移除记录
  window.on('closed', () => {
    const index = mainWindows.findIndex(item => item.containerId === containerId)
    if (index !== -1) {
      mainWindows.splice(index, 1)
      if (controlWindow) {
        controlWindow.webContents.send('update-container-list', mainWindows.map(item => ({ containerId: item.containerId })))
      }
    }
  })

  bindEscapeListener(window)
  return window
}

export function getMainWindows() {
  return mainWindows
}

export function getControlWindow() {
  return controlWindow
}
