import type { WebSocketService } from '@/utils/WebSocketService'
import { inject, onUnmounted } from 'vue'

/**
 * WebSocket 服务 Composable
 * 用于在组件中方便地使用 WebSocket 服务
 */
export function useWebSocket() {
  const wsServiceProvider = inject<{ instance: WebSocketService | null }>('wsService')!

  if (!wsServiceProvider) {
    throw new Error('WebSocket service not provided. Make sure it is provided in App.vue')
  }

  /**
   * 发送消息
   * @param data 要发送的数据
   * @returns 是否发送成功
   */
  function send(data: any): boolean {
    if (!wsServiceProvider.instance) {
      console.error('WebSocket not initialized')
      return false
    }
    return wsServiceProvider.instance.send(data)
  }

  /**
   * 监听 WebSocket 消息
   * @param type 消息类型
   * @param handler 处理函数
   */
  function on(type: string, handler: (event: MessageEvent) => void): void {
    if (!wsServiceProvider.instance) {
      console.warn('WebSocket not initialized, event handler will not be registered')
      return
    }
    wsServiceProvider.instance.on(type, handler)

    // 组件卸载时自动移除事件监听器
    onUnmounted(() => {
      if (wsServiceProvider.instance) {
        wsServiceProvider.instance.off(type, handler)
      }
    })
  }

  /**
   * 移除 WebSocket 消息监听器
   * @param type 消息类型
   * @param handler 处理函数
   */
  function off(type: string, handler: (event: MessageEvent) => void): void {
    if (!wsServiceProvider.instance) {
      return
    }
    wsServiceProvider.instance.off(type, handler)
  }

  /**
   * 获取连接状态
   * @returns 是否已连接
   */
  function isConnected(): boolean {
    if (!wsServiceProvider.instance) {
      return false
    }
    return wsServiceProvider.instance.getConnectionStatus()
  }

  return {
    send,
    on,
    off,
    isConnected,
  }
}

export default useWebSocket
