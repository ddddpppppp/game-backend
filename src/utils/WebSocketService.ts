interface WebSocketOptions {
  token: () => string
  path: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

type MessageHandler = (event: MessageEvent) => void

export class WebSocketService {
  private static instances: Record<string, WebSocketService> = {}
  private ws: WebSocket | null = null
  private readonly options: WebSocketOptions
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private isConnected = false
  private isConnecting = false
  private heartbeatTimeout: number | null = null
  private lastHeartbeatResponse = 0

  /**
   * 获取 WebSocket 服务实例
   * @param key 实例键名
   * @param options 配置选项
   * @returns WebSocket 服务实例
   */
  public static getInstance(key: string, options: WebSocketOptions): WebSocketService {
    if (!WebSocketService.instances[key]) {
      WebSocketService.instances[key] = new WebSocketService(options)
    }
    return WebSocketService.instances[key]
  }

  private constructor(options: WebSocketOptions) {
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    }
    this.connect()
  }

  /**
   * 连接 WebSocket
   */
  public connect(): void {
    if (this.isConnected || this.isConnecting) {
      return
    }

    this.isConnecting = true
    const token = this.options.token()

    if (!token) {
      console.warn('WebSocket connection failed: No token available')
      this.isConnecting = false
      return
    }

    const host = new URL(this.options?.path || '', import.meta.env.VITE_WS_URL)
    const url = `${host}`
    const urlParams = new URL(url)
    urlParams.searchParams.set('token', token)
    const urlWithToken = urlParams.toString()

    try {
      this.ws = new WebSocket(urlWithToken)
      this.setupEventListeners()
    }
    catch (error) {
      console.error('WebSocket connection error:', error)
      this.isConnecting = false
      this.reconnect()
    }
  }

  /**
   * 设置 WebSocket 事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) {
      return
    }

    this.ws.onopen = () => {
      this.isConnected = true
      this.isConnecting = false
      this.reconnectAttempts = 0

      // 发送心跳包
      this.startHeartbeat()
    }

    this.ws.onclose = (event) => {
      console.error('WebSocket closed:', event)
      this.isConnected = false
      this.isConnecting = false

      if (!event.wasClean) {
        this.reconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnected = false
      this.isConnecting = false
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const type = data.action || 'message'

        // 更新最后心跳响应时间
        if (type === 'heartbeat_ack') {
          this.lastHeartbeatResponse = Date.now()
          return
        }

        // 触发对应类型的所有消息处理函数
        this.triggerMessageHandlers(type, event)

        // 同时触发通用消息处理函数
        this.triggerMessageHandlers('message', event)
      }
      catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  }

  /**
   * 触发消息处理函数
   */
  private triggerMessageHandlers(type: string, event: MessageEvent): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  /**
   * 启动心跳包
   */
  private startHeartbeat(): void {
    this.lastHeartbeatResponse = Date.now()

    const heartbeatInterval = setInterval(() => {
      if (!this.isConnected || !this.ws) {
        clearInterval(heartbeatInterval)
        if (this.heartbeatTimeout !== null) {
          clearTimeout(this.heartbeatTimeout)
          this.heartbeatTimeout = null
        }
        return
      }

      // 检查上次心跳响应时间，如果超过了心跳间隔加上一定的容忍时间（例如10秒），则认为连接可能已断开
      const now = Date.now()
      if (now - this.lastHeartbeatResponse > 40000) { // 30秒心跳间隔 + 10秒容忍时间
        console.warn('Heartbeat response timeout, reconnecting...')
        this.close()
        this.connect()
        clearInterval(heartbeatInterval)
        return
      }

      // 发送心跳包
      this.send({
        action: 'heartbeat',
        timestamp: now,
      })
    }, 10000) // 每30秒发送一次心跳
  }

  /**
   * 重新连接
   */
  private reconnect(): void {
    if (this.reconnectTimer !== null || this.isConnecting) {
      return
    }

    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
      console.warn('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.options.reconnectInterval)
  }

  /**
   * 发送消息
   * @param data 要发送的数据
   * @returns 是否发送成功
   */
  public send(data: any): boolean {
    if (!this.isConnected || !this.ws) {
      return false
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      this.ws.send(message)
      return true
    }
    catch (error) {
      console.error('Error sending WebSocket message:', error)
      return false
    }
  }

  /**
   * 关闭连接
   */
  public close(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.isConnected = false
    this.isConnecting = false
  }

  /**
   * 添加消息处理函数
   * @param type 消息类型
   * @param handler 处理函数
   */
  public on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }

    const handlers = this.messageHandlers.get(type)
    handlers?.add(handler)
  }

  /**
   * 移除消息处理函数
   * @param type 消息类型
   * @param handler 处理函数
   */
  public off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.messageHandlers.delete(type)
      }
    }
  }

  /**
   * 获取连接状态
   * @returns 是否已连接
   */
  public getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export default WebSocketService
