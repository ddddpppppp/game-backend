<script setup>
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/shadcn/ui/avatar'
import { Badge } from '@/ui/shadcn/ui/badge'

import { Button } from '@/ui/shadcn/ui/button'
import { Input } from '@/ui/shadcn/ui/input'
import { ScrollArea } from '@/ui/shadcn/ui/scroll-area'
import {
  Bot,
  Facebook,
  Instagram,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smartphone,
  Smile,
  Video,
} from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref } from 'vue'

// 平台图标映射
const platformIcons = {
  facebook: Facebook,
  whatsapp: MessageCircle,
  line: Smartphone,
  instagram: Instagram,
}

// 联系人数据
const contacts = ref([
  {
    id: '1',
    name: '张三',
    platform: 'whatsapp',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: '你好，我想了解一下你们的产品',
    lastTime: '14:30',
    unreadCount: 3,
    isOnline: true,
    isAI: false,
  },
  {
    id: '2',
    name: 'AI助手',
    platform: 'facebook',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: '我是AI助手，有什么可以帮助您的吗？',
    lastTime: '14:25',
    unreadCount: 0,
    isOnline: true,
    isAI: true,
  },
  {
    id: '3',
    name: '李四',
    platform: 'instagram',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: '谢谢你的帮助！',
    lastTime: '13:45',
    unreadCount: 0,
    isOnline: false,
    isAI: false,
  },
  {
    id: '4',
    name: '王五',
    platform: 'line',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: '明天见面详谈',
    lastTime: '12:30',
    unreadCount: 1,
    isOnline: true,
    isAI: false,
  },
  {
    id: '5',
    name: '赵六',
    platform: 'whatsapp',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: '好的，我知道了',
    lastTime: '11:15',
    unreadCount: 0,
    isOnline: false,
    isAI: false,
  },
])

// 聊天消息数据
const chatMessages = ref({
  1: [
    {
      id: '1',
      senderId: '1',
      senderName: '张三',
      content: '你好，我想了解一下你们的产品',
      timestamp: '14:25',
      isMe: false,
    },
    {
      id: '2',
      senderId: 'me',
      senderName: '我',
      content: '您好！很高兴为您介绍我们的产品。请问您对哪方面比较感兴趣？',
      timestamp: '14:26',
      isMe: true,
    },
    {
      id: '3',
      senderId: '1',
      senderName: '张三',
      content: '主要想了解价格和功能特点',
      timestamp: '14:28',
      isMe: false,
    },
    {
      id: '4',
      senderId: '1',
      senderName: '张三',
      content: '还有售后服务怎么样？',
      timestamp: '14:30',
      isMe: false,
    },
  ],
  2: [
    {
      id: '1',
      senderId: '2',
      senderName: 'AI助手',
      content: '您好！我是AI智能助手，很高兴为您服务。有什么问题我可以帮助您解答吗？',
      timestamp: '14:20',
      isMe: false,
    },
    {
      id: '2',
      senderId: 'me',
      senderName: '我',
      content: '你能做什么？',
      timestamp: '14:22',
      isMe: true,
    },
    {
      id: '3',
      senderId: '2',
      senderName: 'AI助手',
      content: '我可以帮助您回答问题、提供产品信息、处理客户咨询等。我具备自然语言理解能力，可以进行智能对话。',
      timestamp: '14:25',
      isMe: false,
    },
  ],
  3: [
    {
      id: '1',
      senderId: 'me',
      senderName: '我',
      content: '问题解决了吗？',
      timestamp: '13:40',
      isMe: true,
    },
    {
      id: '2',
      senderId: '3',
      senderName: '李四',
      content: '是的，已经解决了。谢谢你的帮助！',
      timestamp: '13:45',
      isMe: false,
    },
  ],
  4: [
    {
      id: '1',
      senderId: '4',
      senderName: '王五',
      content: '明天下午3点有时间吗？',
      timestamp: '12:25',
      isMe: false,
    },
    {
      id: '2',
      senderId: 'me',
      senderName: '我',
      content: '可以的，在哪里见面？',
      timestamp: '12:28',
      isMe: true,
    },
    {
      id: '3',
      senderId: '4',
      senderName: '王五',
      content: '明天见面详谈',
      timestamp: '12:30',
      isMe: false,
    },
  ],
  5: [
    {
      id: '1',
      senderId: 'me',
      senderName: '我',
      content: '文件已经发送给您了，请查收',
      timestamp: '11:10',
      isMe: true,
    },
    {
      id: '2',
      senderId: '5',
      senderName: '赵六',
      content: '好的，我知道了',
      timestamp: '11:15',
      isMe: false,
    },
  ],
})

// 当前选中的联系人
const selectedContact = ref(contacts.value[0])
const searchQuery = ref('')
const newMessage = ref('')
const chatContainer = ref(null)

// 过滤联系人
const filteredContacts = computed(() => {
  if (!searchQuery.value) {
    return contacts.value
  }
  return contacts.value.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 当前聊天消息
const currentMessages = computed(() => {
  return chatMessages.value[selectedContact.value?.id] || []
})

// 选择联系人
function selectContact(contact) {
  selectedContact.value = contact
  // 清除未读消息
  contact.unreadCount = 0
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 发送消息
function sendMessage() {
  if (!newMessage.value.trim() || !selectedContact.value) {
    return
  }

  const message = {
    id: Date.now().toString(),
    senderId: 'me',
    senderName: '我',
    content: newMessage.value.trim(),
    timestamp: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isMe: true,
  }

  // 添加消息到当前聊天
  if (!chatMessages.value[selectedContact.value.id]) {
    chatMessages.value[selectedContact.value.id] = []
  }
  chatMessages.value[selectedContact.value.id].push(message)

  // 更新联系人最后消息
  selectedContact.value.lastMessage = newMessage.value.trim()
  selectedContact.value.lastTime = message.timestamp

  // 清空输入框
  newMessage.value = ''

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })

  // 模拟AI回复（如果是AI助手）
  if (selectedContact.value.isAI) {
    setTimeout(() => {
      simulateAIReply()
    }, 1000)
  }
  else {
    // 模拟用户回复
    setTimeout(() => {
      simulateUserReply()
    }, 2000 + Math.random() * 3000)
  }
}

// 模拟AI回复
function simulateAIReply() {
  const aiReplies = [
    '我理解您的问题，让我为您详细解答。',
    '根据您的需求，我推荐以下解决方案...',
    '这是一个很好的问题，我来帮您分析一下。',
    '感谢您的咨询，我会尽力为您提供帮助。',
    '基于我的分析，建议您可以考虑以下几个方面...',
  ]

  const reply = {
    id: Date.now().toString(),
    senderId: selectedContact.value.id,
    senderName: selectedContact.value.name,
    content: aiReplies[Math.floor(Math.random() * aiReplies.length)],
    timestamp: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isMe: false,
  }

  chatMessages.value[selectedContact.value.id].push(reply)
  selectedContact.value.lastMessage = reply.content
  selectedContact.value.lastTime = reply.timestamp

  nextTick(() => {
    scrollToBottom()
  })
}

// 模拟用户回复
function simulateUserReply() {
  if (selectedContact.value.isAI) {
    return
  }

  const userReplies = [
    '好的，我明白了',
    '谢谢您的解答',
    '还有其他问题想咨询',
    '这个方案不错',
    '我需要考虑一下',
    '可以详细介绍一下吗？',
  ]

  const reply = {
    id: Date.now().toString(),
    senderId: selectedContact.value.id,
    senderName: selectedContact.value.name,
    content: userReplies[Math.floor(Math.random() * userReplies.length)],
    timestamp: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    isMe: false,
  }

  chatMessages.value[selectedContact.value.id].push(reply)
  selectedContact.value.lastMessage = reply.content
  selectedContact.value.lastTime = reply.timestamp

  // 增加未读消息数（如果不是当前选中的联系人）
  if (selectedContact.value.id !== reply.senderId) {
    const contact = contacts.value.find(c => c.id === reply.senderId)
    if (contact) {
      contact.unreadCount = (contact.unreadCount || 0) + 1
    }
  }

  nextTick(() => {
    scrollToBottom()
  })
}

// 滚动到底部
function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// 处理回车发送
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 获取平台颜色
function getPlatformColor(platform) {
  const colors = {
    facebook: 'text-blue-600',
    whatsapp: 'text-green-600',
    line: 'text-green-700',
    instagram: 'text-pink-600',
  }
  return colors[platform] || 'text-gray-600'
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="chat-container flex bg-gray-50">
    <!-- 左侧联系人列表 -->
    <div class="w-80 flex flex-col border-r border-gray-200 bg-white">
      <!-- 搜索栏 -->
      <div class="border-b border-gray-200 p-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 transform text-gray-400 -translate-y-1/2" />
          <Input
            v-model="searchQuery"
            placeholder="搜索联系人..."
            class="pl-10"
          />
        </div>
      </div>

      <!-- 联系人列表 -->
      <ScrollArea class="flex-1">
        <div class="p-2">
          <div
            v-for="contact in filteredContacts"
            :key="contact.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors" :class="[
              selectedContact?.id === contact.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50',
            ]"
            @click="selectContact(contact)"
          >
            <div class="relative">
              <Avatar class="h-12 w-12">
                <AvatarImage :src="contact.avatar" :alt="contact.name" />
                <AvatarFallback>{{ contact.name.charAt(0) }}</AvatarFallback>
              </Avatar>
              <!-- 在线状态 -->
              <div
                v-if="contact.isOnline"
                class="absolute h-4 w-4 border-2 border-white rounded-full bg-green-500 -bottom-1 -right-1"
              />
              <!-- 平台图标 -->
              <div class="absolute h-5 w-5 flex items-center justify-center border rounded-full bg-white -right-1 -top-1">
                <component
                  :is="platformIcons[contact.platform]"
                  class="h-3 w-3" :class="[getPlatformColor(contact.platform)]"
                />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="truncate text-gray-900 font-medium">
                    {{ contact.name }}
                  </h3>
                  <Bot v-if="contact.isAI" class="h-4 w-4 text-blue-500" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ contact.lastTime }}</span>
                  <Badge v-if="contact.unreadCount > 0" class="h-5 min-w-[20px] bg-red-500 text-xs text-white">
                    {{ contact.unreadCount }}
                  </Badge>
                </div>
              </div>
              <p class="mt-1 truncate text-sm text-gray-600">
                {{ contact.lastMessage }}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex flex-1 flex-col">
      <!-- 聊天头部 -->
      <div class="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <div class="flex items-center gap-3">
          <div class="relative">
            <Avatar class="h-10 w-10">
              <AvatarImage :src="selectedContact?.avatar" :alt="selectedContact?.name" />
              <AvatarFallback>{{ selectedContact?.name?.charAt(0) }}</AvatarFallback>
            </Avatar>
            <div
              v-if="selectedContact?.isOnline"
              class="absolute h-3 w-3 border-2 border-white rounded-full bg-green-500 -bottom-1 -right-1"
            />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-gray-900 font-semibold">
                {{ selectedContact?.name }}
              </h2>
              <Bot v-if="selectedContact?.isAI" class="h-4 w-4 text-blue-500" />
              <component
                :is="platformIcons[selectedContact?.platform]"
                class="h-4 w-4" :class="[getPlatformColor(selectedContact?.platform)]"
              />
            </div>
            <p class="text-sm text-gray-500">
              {{ selectedContact?.isOnline ? '在线' : '离线' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="message in currentMessages"
          :key="message.id"
          class="flex" :class="[
            message.isMe ? 'justify-end' : 'justify-start',
          ]"
        >
          <div
            class="max-w-xs rounded-lg px-4 py-2 lg:max-w-md" :class="[
              message.isMe
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200 text-gray-900',
            ]"
          >
            <p class="text-sm">
              {{ message.content }}
            </p>
            <p
              class="mt-1 text-xs" :class="[
                message.isMe ? 'text-blue-100' : 'text-gray-500',
              ]"
            >
              {{ message.timestamp }}
            </p>
          </div>
        </div>
      </div>

      <!-- 消息输入区域 -->
      <div class="border-t border-gray-200 bg-white p-4">
        <div class="flex items-end gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Smile class="h-4 w-4" />
          </Button>
          <div class="flex-1">
            <Input
              v-model="newMessage"
              placeholder="输入消息..."
              class="resize-none"
              @keypress="handleKeyPress"
            />
          </div>
          <Button :disabled="!newMessage.trim()" @click="sendMessage">
            <Send class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  height: calc(100vh - 50px);
}

/* 自定义滚动条样式 */
:deep(.scroll-area) {
  scrollbar-color: #cbd5e1 #f1f5f9;
  scrollbar-width: thin;
}

:deep(.scroll-area::-webkit-scrollbar) {
  width: 6px;
}

:deep(.scroll-area::-webkit-scrollbar-track) {
  background: #f1f5f9;
}

:deep(.scroll-area::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 3px;
}

:deep(.scroll-area::-webkit-scrollbar-thumb:hover) {
  background: #94a3b8;
}
</style>
