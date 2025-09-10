import { ipcMain } from 'electron'
import { createBrowserWindow, getControlWindow, getMainWindows } from './windowManager'

// 处理启动请求
ipcMain.on('start-browsers', (_, containerId: string) => {
  const mainWindows = getMainWindows()
  const exists = mainWindows.some(item => item.containerId === containerId)
  if (exists) {
    return
  }

  createBrowserWindow(containerId)
  const containerInfo = mainWindows.map(item => ({ containerId: item.containerId }))
  const controlWindow = getControlWindow()
  if (controlWindow) {
    controlWindow.webContents.send('update-container-list', containerInfo)
  }
})

// 处理删除请求
ipcMain.on('delete-browsers', (_, containerId: string) => {
  const mainWindows = getMainWindows()
  const targetIndex = mainWindows.findIndex(item => item.containerId === containerId)
  if (targetIndex === -1) {
    return
  }

  const { window } = mainWindows[targetIndex]
  window.setClosable(true)
  window.close()
  mainWindows.splice(targetIndex, 1)

  const containerInfo = mainWindows.map(item => ({ containerId: item.containerId }))
  const controlWindow = getControlWindow()
  if (controlWindow) {
    controlWindow.webContents.send('update-container-list', containerInfo)
  }
})

// 处理展示容器请求
ipcMain.on('show-container', (_, containerId) => {
  const mainWindows = getMainWindows()
  const targetWindow = mainWindows.find(({ containerId: id }) => id === containerId)
  if (targetWindow) {
    targetWindow.window.show()
    targetWindow.window.setClosable(false)
  }
})

// 处理隐藏容器请求
ipcMain.on('hide-container', (_, containerId) => {
  const mainWindows = getMainWindows()
  const targetWindow = mainWindows.find(({ containerId: id }) => id === containerId)
  if (targetWindow) {
    targetWindow.window.hide()
  }
})

// 处理请求容器列表
ipcMain.on('request-container-list', (event) => {
  const mainWindows = getMainWindows()
  const containerInfo = mainWindows.map(item => ({ containerId: item.containerId }))
  event.sender.send('update-container-list', containerInfo)
})
