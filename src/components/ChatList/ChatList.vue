<script setup lang="ts">
import type { WebSocketService } from '@/utils/WebSocketService'
import apiDataManage from '@/api/modules/slot'
import avatar from '@/assets/images/avatar.png'
import { debounce, getCurrentTime } from '@/utils/helper'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { inject, nextTick, onMounted, onUnmounted, ref } from 'vue'
import MessageAnnotation from './components/MessageAnnotation.vue'

const props = withDefaults(defineProps<Props>(), {
  conversationId: '',
  type: 'chat',
})
// 获取全局 WebSocket 服务
const wsServiceProvider = inject<{ instance: WebSocketService | null }>('wsService')
const wsService = wsServiceProvider?.instance
export interface Props {
  conversationId?: number | string
  type?: 'annotated' | 'chat'
}

const annotationsMap = ref<Record<string, any[]>>({})

const messageList = ref<any[]>([])
const conversation = ref<any>({})

const messageOrder = ref(0)
const sendAt = ref('')
// Mock categories for dropdown selection
const labelOptions = ref([])

// 创建一个 ref 来引用容器元素
const messageContainer = ref<HTMLElement | null>(null)

const isLoading = ref(false) // 防止重复加载
const loading = ref(false) // 防止重复加载
const scrollThreshold = 10 // 滚动到距离顶部100px内时加载更多

// 总消息数量
const totalMsgLength = ref(0)

const resizeObserver = ref<ResizeObserver | null>(null)

watch(() => props.conversationId, () => {
  messageList.value = []
  messageOrder.value = 0
  sendAt.value = ''
  getConversationDetail()
  getMessageList()
})

// 滚动到底部函数
function scrollToBottom() {
  if (messageContainer.value) {
    const container = messageContainer.value as HTMLElement
    container.scrollTop = container.scrollHeight
  }
}

// 使用防抖包装滚动处理函数
function handleScroll() {
  // 检查是否已经在加载或不应该触发加载
  if (!messageContainer.value || isLoading.value) {
    return
  }

  // 检查是否滚动到顶部附近
  if (messageContainer.value.scrollTop <= scrollThreshold) {
    // 最后一条数据了自动放弃加载
    if (messageList.value.length >= totalMsgLength.value || messageList.value.length === 0) {
      return
    }

    // 立即设置加载状态，防止重复触发
    isLoading.value = true
    loading.value = true

    // 延迟执行实际加载逻辑
    debounce(async () => {
      try {
        // 加载更多消息
        await getMessageList()

        // 等待DOM更新
        await nextTick()
      }
      catch (error) {
        console.error('Failed to load more messages:', error)
      }
      finally {
        isLoading.value = false
      }
    }, 1000)()
  }
}

// 注册和移除滚动事件监听器
onMounted(() => {
  if (messageContainer.value) {
    messageContainer.value.addEventListener('scroll', handleScroll)

    getConversationDetail()
    getMessageList()
  }
})

onUnmounted(() => {
  if (messageContainer.value) {
    messageContainer.value.removeEventListener('scroll', handleScroll)
    resizeObserver.value?.unobserve(messageContainer.value)
    resizeObserver.value = null
  }
})

// Fetch conversation details
function getConversationDetail() {
  apiDataManage.getConversation({ id: props.conversationId }).then((res: any) => {
    if (res.status === 1) {
      conversation.value = res.data.conversation || {}
      labelOptions.value = res.data.labels || []
    }
    else {
      ElMessage.error({
        message: res.statusText || '获取会话详情失败',
        center: true,
      })
    }
  }).catch(() => {
    ElMessage.error({
      message: '获取会话详情失败',
      center: true,
    })
  })
}

async function getMessageList() {
  loading.value = true
  // 获取容器元素
  const container = messageContainer.value
  if (!container) {
    return
  }
  // 保存当前scrollTop和scrollHeight
  const prevScrollTop = container.scrollTop
  const prevScrollHeight = container.scrollHeight
  let res = null
  if (props.type === 'annotated') {
    res = await apiDataManage.getMessageList({ id: props.conversationId, messageOrder: messageOrder.value })
  }
  else {
    res = await apiDataManage.getRawMessageList({ id: props.conversationId, sendAt: sendAt.value })
  }
  if (res.status === 1) {
    loading.value = false
    totalMsgLength.value = res.data.total
    if (messageOrder.value > 0 || sendAt.value !== '') {
      // 上拉加载
      messageList.value = [...res.data.list, ...messageList.value]
    }
    else {
      messageList.value = res.data.list || []
      // 首次加载时滚动到底部，也使用动画效果
      nextTick(() => {
        scrollToBottom()
      })
    }
    if (props.type === 'annotated') {
      messageOrder.value = messageList.value[0].messageOrder
    }
    else {
      sendAt.value = messageList.value[0].sentAt
    }

    // 设置ResizeObserver监听容器高度变化，保持滚动位置
    nextTick(() => {
      resizeObserver.value = new ResizeObserver(() => {
        const newScrollHeight = container.scrollHeight
        const heightDiff = newScrollHeight - prevScrollHeight
        container.scrollTop = prevScrollTop + heightDiff

        // 调整后断开观察，避免重复触发
        resizeObserver.value?.unobserve(container)
        resizeObserver.value = null
      })
      resizeObserver.value.observe(container)
    })
  }
  else {
    ElMessage.error({
      message: res.statusText || '获取会话详情失败',
      center: true,
    })
  }
}

defineExpose({
  submitConversationAnnotated() {
    return new Promise<void>((resolve, reject) => {
      apiDataManage.submitConversationAnnotated({ id: props.conversationId, annotations: annotationsMap.value }).then((res: any) => {
        if (res.status === 1) {
          ElMessage.success({
            message: res.statusText || '标注会话成功',
            center: true,
          })
        }
        else {
          ElMessage.error({
            message: res.statusText || '标注会话失败',
            center: true,
          })
        }
        resolve()
      }).catch(() => {
        ElMessage.error({
          message: '标注会话失败',
          center: true,
        })
        reject(new Error('标注会话失败'))
      })
    })
  },
  sendMessage(message: any) {
    return new Promise<void>((resolve, reject) => {
      message.conversationId = props.conversationId
      if (wsService?.send({ action: 'send_msg_to_user', data: message })) {
        const newMessage = {
          conversationId: props.conversationId,
          messageOrder: messageList.value.length + 1,
          senderRole: 'assistant',
          contentType: '',
          textContent: '',
          attachment: '',
          mediaAttachments: null,
          // 事件格式  2025-04-23 07:47:29
          sentAt: getCurrentTime(),
          username: '助手',
          annotations: [],
        }
        if (message.type === 'image') {
          newMessage.contentType = 'image'
          newMessage.attachment = message.content
        }
        else if (message.type === 'text') {
          newMessage.contentType = 'text'
          newMessage.textContent = message.content
        }
        messageList.value.push(newMessage)
        // 在消息添加到列表后，使用nextTick等待DOM更新，然后滚动到底部
        nextTick(() => {
          scrollToBottom()
        })
        resolve()
      }
      else {
        reject(new Error('发送消息失败'))
      }
    })
  },
})

// Get message sender class
function getMessageClass(sender: string) {
  return sender === 'user' ? 'chat-message-user' : 'chat-message-assistant'
}

// Get sender name
function getSenderName(sender: string, item: any) {
  return sender === 'user' ? item.username : '助手'
}

function trim(text: string) {
  return text.trim()
}

function updateAnnotations(messageId: string, annotations: any) {
  annotationsMap.value[messageId] = annotations
}
</script>

<template>
  <div class="chat-container" :class="{ 'border-radius-8': props.type === 'annotated' }">
    <div ref="messageContainer" v-loading="loading" :scrollbar="true" class="chat-messageList-container">
      <div v-if="!messageList.length" class="chat-empty-state">
        <el-empty description="暂无会话记录" />
      </div>
      <template v-else>
        <div class="chat-message-wrapper">
          <!-- 根据发送者类型调整布局 -->
          <div v-for="message in messageList" :key="message.messageId" :data-id="message.messageId" class="chat-row" :class="{ 'chat-row-reverse': message.senderRole === 'assistant' }">
            <!-- 消息内容 -->
            <div class="message-column">
              <div class="chat-message" :class="getMessageClass(message.senderRole)">
                <div class="message-avatar">
                  <el-avatar :size="38" :src="message.senderRole === 'assistant' ? avatar : message.avatar" />
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="sender-name">{{ getSenderName(message.senderRole, message) }}</span>
                  </div>
                  <div class="message-body">
                    <div v-if="trim(message.textContent)">
                      {{ trim(message.textContent) }}
                    </div>
                    <div v-if="message.attachment">
                      <el-image
                        :src="message.attachment"
                        alt="image"
                        fit="contain"
                        :preview-src-list="[message.attachment]"
                        loading="lazy"
                        style="max-width: 380px; max-height: 380px;"
                        class="message-image"
                      >
                        <template #placeholder>
                          <div class="image-slot">
                            <el-icon><Loading /></el-icon>
                            <span>加载中...</span>
                          </div>
                        </template>
                        <template #error>
                          <div class="image-slot">
                            <FaIcon name="i-ph:image-broken-duotone" />
                            <span>加载失败</span>
                          </div>
                        </template>
                      </el-image>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 时间显示 - 框外显示，根据发送者对齐 -->
              <div
                v-if="message.sentAt"
                class="message-time"
                :class="{ 'time-right': message.senderRole === 'assistant', 'time-left': message.senderRole === 'user' }"
              >
                {{ message.sentAt }}
              </div>
            </div>

            <!-- 用户消息时，标注区在右侧 -->
            <MessageAnnotation
              v-if="props.type === 'annotated' && message.annotations.length > 0"
              :annotations="message.annotations"
              :label-options="labelOptions"
              :message-id="String(message.messageId)"
              @update:annotations="updateAnnotations"
            />
          </div>
        </div>
      </template>
      <div class="message-list-bottom-spacer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 95%;
  background-color: #f9fafb;
}

.border-radius-8 {
  border-radius: 8px;
}

.chat-messageList-container {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 18px;
  overflow: scroll;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.chat-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.chat-message-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 16px;
}

.chat-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  width: 100%;
  margin-top: 10px;

  .message-column {
    display: flex;
    flex-direction: column;
    max-width: 60%;
  }
}

.chat-row-reverse {
  flex-direction: row-reverse;
}

.chat-message {
  display: flex;
  gap: 10px;
  width: 100%;

  &.chat-message-user {
    align-self: flex-start;
    min-width: 198px;

    .message-content {
      background-color: #fff;
      border-radius: 2px 10px 10px;
    }
  }

  &.chat-message-assistant {
    flex-direction: row-reverse;
    align-self: flex-end;
    min-width: 198px;

    .message-content {
      background-color: #e1f3ff;
      border-radius: 10px 2px 10px 10px;

      .message-header {
        flex-direction: row-reverse;
      }
    }
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;

  .sender-name {
    font-size: 13px;
    font-weight: 600;
  }
}

.message-body {
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-time {
  margin-top: 5px;
  font-size: 11px;
  color: #909399;

  &.time-right {
    align-self: flex-end;
    margin-right: 50px;
  }

  &.time-left {
    align-self: flex-start;
    margin-left: 50px;
  }
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

:deep(.image-slot) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 30px;
  color: #909399;
}

.loading-indicator {
  padding: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.message-list-bottom-spacer {
  height: 20px; /* 提供一些底部空间 */
}

.sm-font {
  font-size: 12px;
}

/* 滚动动画相关样式 */
.new-message-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  z-index: 100;
  padding: 8px 16px;
  color: white;
  text-align: center;
  background-color: #1890ff;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
  transform: translateX(-50%);
  animation: bounce-fade 1.5s ease-in-out forwards;
}

.indicator-content {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
}

.arrow {
  font-size: 16px;
  animation: bounce 0.6s infinite alternate;
}

.text {
  font-size: 14px;
  font-weight: bold;
}

@keyframes bounce-fade {
  0% {
    opacity: 0;
    transform: translate(-50%, 10px);
  }

  20% {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(5px);
  }
}

/* 删除旧的滚动指示器 */
.scroll-indicator {
  display: none;
}

@keyframes indicator-fade {
  0%,
  100% {
    opacity: 0;
  }
}
</style>
