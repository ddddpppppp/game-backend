<script setup lang="ts">
import type { WebSocketService } from '@/utils/WebSocketService'
import { inject, onMounted, onUnmounted, ref } from 'vue'

// 获取全局 WebSocket 服务
const wsServiceProvider = inject<{ instance: WebSocketService | null }>('wsService')
const wsService = wsServiceProvider?.instance

const messages = ref<{ type: string, content: string, timestamp: number }[]>([])
const connectionStatus = ref(false)

// 监听 WebSocket 消息
function handleMessage(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data)
    messages.value.push({
      type: data.type || 'unknown',
      content: data.content || JSON.stringify(data),
      timestamp: Date.now(),
    })
  }
  catch (error) {
    console.error('Error parsing message:', error)
  }
}

// 发送消息示例
function sendMessage() {
  if (wsService) {
    wsService.send({
      type: 'chat',
      content: 'Hello from WebSocket example!',
      timestamp: Date.now(),
    })
  }
}

// 更新连接状态
function updateConnectionStatus() {
  if (wsService) {
    connectionStatus.value = wsService.getConnectionStatus()
  }
}

onMounted(() => {
  if (wsService) {
    // 注册消息处理函数
    wsService.on('message', handleMessage)

    // 定期更新连接状态
    const statusInterval = setInterval(updateConnectionStatus, 1000)

    // 组件卸载时清理
    onUnmounted(() => {
      wsService.off('message', handleMessage)
      clearInterval(statusInterval)
    })
  }
})
</script>

<template>
  <div class="websocket-example">
    <h2>WebSocket 示例</h2>

    <div class="connection-status">
      连接状态: <span :class="{ connected: connectionStatus, disconnected: !connectionStatus }">
        {{ connectionStatus ? '已连接' : '未连接' }}
      </span>
    </div>

    <div class="actions">
      <el-button type="primary" :disabled="!connectionStatus" @click="sendMessage">
        发送测试消息
      </el-button>
    </div>

    <div class="messages">
      <h3>接收到的消息 ({{ messages.length }})</h3>
      <div v-if="messages.length === 0" class="no-messages">
        暂无消息
      </div>
      <div v-else class="message-list">
        <div v-for="(msg, index) in messages" :key="index" class="message-item">
          <div class="message-header">
            <span class="message-type">{{ msg.type }}</span>
            <span class="message-time">{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
          </div>
          <div class="message-content">
            {{ msg.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.websocket-example {
  max-width: 800px;
  padding: 20px;
  margin: 20px auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.connection-status {
  margin-bottom: 20px;
  font-size: 16px;
}

.connected {
  font-weight: bold;
  color: #67c23a;
}

.disconnected {
  font-weight: bold;
  color: #f56c6c;
}

.actions {
  margin-bottom: 20px;
}

.messages {
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.no-messages {
  padding: 20px 0;
  color: #909399;
  text-align: center;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
}

.message-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.message-type {
  font-weight: bold;
  color: #409eff;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  word-break: break-word;
}
</style>
