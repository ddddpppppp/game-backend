// src/utils/websocket.ts
type MessageHandler<T = any> = (data: T) => void
type ErrorHandler = (error: Event) => void
type TokenProvider = string | (() => string | Promise<string>)

interface WsMessage<T = any> {
  action: string
  data: T
}

interface QueuedMessage {
  action: string
  data: any
  timestamp: number
  retries?: number
}

const instanceMap = new Map<string, WebSocketService>()

export class WebSocketService {
  private socket: WebSocket | null = null
  private url: string
  private messageHandlers = new Map<string, MessageHandler>()
  private errorHandlers = new Set<ErrorHandler>()
  private messageQueue: QueuedMessage[] = []
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectDelay = 3000
  private heartbeatInterval: number | null = null
  private heartbeatTimeout: number | null = null
  private readonly heartbeatDelay = 3000
  private readonly heartbeatTimeoutDelay = 10000
  private readonly maxMessageRetries = 3
  private readonly queueExpiry = 60000
  private isDestroyed = true

  // Token 相关参数
  private tokenProvider: TokenProvider | null = null

  constructor(
    options?: {
      token?: TokenProvider // 静态 token 或动态获取函数
      path?: string // 可选路径
    },
  ) {
    // 处理基础 URL 和路径
    const url = new URL(options?.path || '', import.meta.env.VITE_WS_URL)
    this.tokenProvider = options?.token || null

    // 初始 URL（不含 Token）
    this.url = url.toString().replace(/^http/, 'ws')
    this.isDestroyed = false
    this.connect()
  }

  public static getInstance(key: string, options?: ConstructorParameters<typeof WebSocketService>[0]) {
    if (!instanceMap.has(key)) {
      instanceMap.set(key, new WebSocketService(options))
    }
    return instanceMap.get(key)!
  }

  public static destroyInstance(key: string) {
    const instance = instanceMap.get(key)
    if (instance) {
      instance.destroy() // 新增彻底销毁方法
      instanceMap.delete(key)
    }
  }

  // 新增彻底销毁方法
  private destroy() {
    this.cleanup()
    this.socket?.close()
    this.socket = null
    this.messageQueue = []
    this.isDestroyed = true
    this.reconnectAttempts = this.maxReconnectAttempts // 阻止重连
  }

  private async getToken(): Promise<string | null> {
    // eslint-disable-next-line style/max-statements-per-line
    if (!this.tokenProvider) { return null }
    return typeof this.tokenProvider === 'function'
      ? this.tokenProvider()
      : this.tokenProvider
  }

  private async getFullUrl(): Promise<string> {
    const token = await this.getToken()
    // eslint-disable-next-line style/max-statements-per-line
    if (!token) { return this.url }

    const url = new URL(this.url)
    url.searchParams.set('token', token) // 始终通过 Query 传递
    return url.toString()
  }

  private async connect() {
    const url = await this.getFullUrl() // 获取带 Token 的完整 URL
    this.socket = new WebSocket(url)

    // 其他原有逻辑保持不变...
    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.setupHeartbeat()
      this.processQueue()
    }

    // 其他原有事件监听保持不变...
    this.socket.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data)
        this.handleMessage(message)
      }
      catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    this.socket.onclose = (event) => {
      // 过滤非正常关闭（如token失效不重连）
      if ([401].includes(event.code)) {
        console.error('认证失败，停止重连')
        return
      }
      this.cleanup()
      this.reconnect()
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.errorHandlers.forEach(handler => handler(error))
    }
  }

  // 清理资源
  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  // 设置心跳检测
  private setupHeartbeat() {
    // 清除旧定时器
    // eslint-disable-next-line style/max-statements-per-line
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval) }
    // eslint-disable-next-line style/max-statements-per-line
    if (this.heartbeatTimeout) { clearTimeout(this.heartbeatTimeout) }

    this.heartbeatInterval = window.setInterval(() => {
      if (this.shouldSendHeartbeat()) {
        this.sendHeartbeat()
      }
    }, this.heartbeatDelay)
  }

  private shouldSendHeartbeat() {
    return this.socket?.readyState === WebSocket.OPEN
      && !this.heartbeatTimeout
  }

  private sendHeartbeat() {
    this.sendInternal('heartbeat', { timestamp: Date.now() })

    this.heartbeatTimeout = window.setTimeout(() => {
      console.error('心跳超时，触发重连')
      this.handleHeartbeatTimeout()
    }, this.heartbeatTimeoutDelay)
  }

  private handleHeartbeatTimeout() {
    this.heartbeatTimeout = null
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.close(4000, 'Heartbeat timeout')
    }
  }

  // 处理接收到的消息
  private handleMessage(message: WsMessage) {
    // 处理心跳响应
    if (message.action === 'heartbeat_ack') {
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout)
        this.heartbeatTimeout = null
      }
      return
    }

    // 调用注册的处理器
    const handler = this.messageHandlers.get(message.action)
    if (handler) {
      handler(message.data)
    }
    else {
      console.warn(`No handler registered for action: ${message.action}`)
    }
  }

  // 自动重连
  private reconnect() {
    // 增加状态检查
    if (this.reconnectAttempts >= this.maxReconnectAttempts
      || this.isDestroyed) {
      return
    }

    // 添加随机延迟防止雪崩
    const jitterDelay = this.reconnectDelay * (1 + Math.random())

    setTimeout(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.connect()
      }
    }, jitterDelay)
  }

  // 处理消息队列
  private processQueue() {
    const now = Date.now()

    // 过滤掉过期的消息
    this.messageQueue = this.messageQueue.filter(msg =>
      now - msg.timestamp < this.queueExpiry,
    )

    // 尝试发送队列中的消息
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendInternal(message.action, message.data)
      }
    }
  }

  // 内部发送方法（直接发送，不经过队列）
  private sendInternal(action: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ action, data }))
      }
      catch (error) {
        console.error('Error sending WebSocket message:', error)
      }
    }
  }

  // 公共API ==============================================

  // 注册消息处理器
  public registerHandler<T>(action: string, handler: MessageHandler<T>) {
    this.messageHandlers.set(action, handler as MessageHandler)
  }

  // 注销消息处理器
  public unregisterHandler(action: string) {
    this.messageHandlers.delete(action)
  }

  // 注册错误处理器
  public onError(handler: ErrorHandler) {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  // 发送消息（会自动加入队列如果未连接）
  public send(action: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendInternal(action, data)
    }
    else {
      // 检查是否已有相同的未发送消息
      const existingIndex = this.messageQueue.findIndex(
        msg => msg.action === action && JSON.stringify(msg.data) === JSON.stringify(data),
      )

      if (existingIndex >= 0) {
        // 更新已有消息的时间戳和重试次数
        this.messageQueue[existingIndex].timestamp = Date.now()
        this.messageQueue[existingIndex].retries
          = (this.messageQueue[existingIndex].retries || 0) + 1
      }
      else {
        // 添加到队列
        this.messageQueue.push({
          action,
          data,
          timestamp: Date.now(),
          retries: 0,
        })
      }

      // 如果队列中有消息超过最大重试次数，移除它们
      this.messageQueue = this.messageQueue.filter(
        msg => (msg.retries || 0) < this.maxMessageRetries,
      )
    }
  }

  // 获取当前连接状态
  public get status() {
    return this.socket?.readyState
  }

  // 获取队列中的消息数量
  public get queuedMessages() {
    return this.messageQueue.length
  }
}
