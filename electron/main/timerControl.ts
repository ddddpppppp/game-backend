import type { BrowserWindow } from 'electron'

// 在 IPC 通信中动态控制（主进程添加）
import { ipcMain } from 'electron'
import { getMainWindows } from './windowManager'

interface TimerControl {
  start: () => void
  stop: () => void
}

const windowTimers = new WeakMap<BrowserWindow, TimerControl>()

// 创建动态注入器
export function createDynamicTimerInjector(win: BrowserWindow) {
  const existing = windowTimers.get(win)
  if (existing) {
    existing.stop()
  }

  let intervalId: NodeJS.Timeout | null = null

  const controller: TimerControl = {
    start: () => {
      if (intervalId) {
        return
      }

      intervalId = setInterval(() => {
        win.webContents.executeJavaScript(
          `console.log('动态时间:', ${Date.now()})`,
        ).catch(err => console.error('执行失败:', err))
      }, 1000)

      // 窗口关闭时自动清理
      win.on('closed', () => controller.stop())
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      windowTimers.delete(win)
    },
  }

  windowTimers.set(win, controller)
  return controller
}

ipcMain.on('timer-control', (_, containerId: string, action: 'start' | 'stop') => {
  const mainWindows = getMainWindows()
  const targetWindow = mainWindows.find(({ containerId: id }) => id === containerId)
  if (!targetWindow) {
    return
  }
  const win = targetWindow.window
  if (!win) {
    return
  }

  const controller = windowTimers.get(win) || createDynamicTimerInjector(win)

  if (action === 'start') {
    controller.start()
  }
  else {
    controller.stop()
  }
})
