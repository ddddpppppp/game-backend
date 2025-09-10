<script setup>
import { Alert, AlertDescription, AlertTitle } from '@/ui/shadcn/ui/alert'

import { Button } from '@/ui/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/ui/card'
import { Input } from '@/ui/shadcn/ui/input'
import { Label } from '@/ui/shadcn/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/shadcn/ui/select'
import { Textarea } from '@/ui/shadcn/ui/textarea'
import { ElMessageBox } from 'element-plus'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  HelpCircle,
  MessageCircle,
  Plus,
  Power,
  RefreshCw,
  Shield,
  Smartphone,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

// 响应式数据
const accounts = ref([
  {
    id: '1',
    platform: 'facebook',
    accessToken: 'fb_token_***',
    status: 'active',
    lastSync: '2024-01-20 15:30',
    description: '官方Facebook页面',
    messageCount: 1234,
    responseRate: 95,
  },
  {
    id: '2',
    platform: 'whatsapp',
    accessToken: 'wa_token_***',
    status: 'active',
    lastSync: '2024-01-20 15:25',
    description: 'WhatsApp Business API',
    messageCount: 856,
    responseRate: 98,
  },
  {
    id: '3',
    platform: 'instagram',
    accessToken: 'ig_token_***',
    status: 'inactive',
    lastSync: '2024-01-19 10:15',
    description: 'Instagram官方账号',
    messageCount: 432,
    responseRate: 87,
  },
])

const activityLogs = ref([
  {
    id: '1',
    type: 'message',
    platform: 'WhatsApp',
    message: '成功发送消息给用户 +86138****1234',
    timestamp: '2024-01-20 15:30',
    status: 'success',
  },
  {
    id: '2',
    type: 'sync',
    platform: 'Facebook',
    message: '账号同步完成',
    timestamp: '2024-01-20 15:25',
    status: 'success',
  },
  {
    id: '3',
    type: 'error',
    platform: 'Instagram',
    message: 'API访问令牌已过期',
    timestamp: '2024-01-20 15:20',
    status: 'error',
  },
  {
    id: '4',
    type: 'login',
    platform: 'LINE',
    message: '用户登录成功',
    timestamp: '2024-01-20 15:15',
    status: 'success',
  },
])

const systemAlerts = ref([
  {
    id: '1',
    type: 'warning',
    title: 'API配额警告',
    message: 'Facebook API今日使用量已达80%，请注意监控',
    timestamp: '2024-01-20 14:30',
  },
  {
    id: '2',
    type: 'info',
    title: '系统更新',
    message: 'AI模型已更新至v2.1，响应速度提升15%',
    timestamp: '2024-01-20 10:00',
  },
])

const isDialogOpen = ref(false)
const editingAccount = ref(null)
const formData = ref({
  platform: '',
  accessToken: '',
  description: '',
})

// 计算属性
const totalMessages = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + (acc.messageCount || 0), 0)
})

const avgResponseRate = computed(() => {
  if (accounts.value.length === 0) {
    return 0
  }
  return accounts.value.reduce((sum, acc) => sum + (acc.responseRate || 0), 0) / accounts.value.length
})

// 方法
function handleAddAccount() {
  if (formData.value.platform && formData.value.accessToken) {
    const newAccount = {
      id: Date.now().toString(),
      platform: formData.value.platform,
      accessToken: formData.value.accessToken,
      status: 'active',
      lastSync: new Date().toLocaleString('zh-CN'),
      description: formData.value.description,
      messageCount: 0,
      responseRate: 0,
    }

    if (editingAccount.value) {
      const index = accounts.value.findIndex(acc => acc.id === editingAccount.value.id)
      if (index !== -1) {
        accounts.value[index] = { ...newAccount, id: editingAccount.value.id }
      }
    }
    else {
      accounts.value.push(newAccount)
    }

    formData.value = { platform: '', accessToken: '', description: '' }
    isDialogOpen.value = false
    editingAccount.value = null
  }
}

function getActivityIcon(type) {
  switch (type) {
    case 'message':
      return MessageCircle
    case 'sync':
      return RefreshCw
    case 'error':
      return AlertTriangle
    case 'login':
      return Users
    default:
      return Activity
  }
}

function openAddDialog() {
  editingAccount.value = null
  formData.value = { platform: '', accessToken: '', description: '' }
  isDialogOpen.value = true
}

onMounted(() => {
  ElMessageBox.confirm('此功能开发中，所有数据为测试数据', '提示').then(() => {
    console.log('AI精聊控制台')
  }).catch(() => {})
})
</script>

<template>
  <div class="min-h-screen bg-gray-50/50">
    <!-- 页面标题和快速操作 -->
    <div class="position-relative">
      <FaPageHeader title="AI精聊控制台" class="mb-0" />
      <div class="absolute right-5 top-4.5 flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          导出数据
        </Button>
        <Button size="sm" @click="openAddDialog">
          <Plus class="mr-2 h-4 w-4" />
          添加账号
        </Button>
      </div>
    </div>
    <div class="mx-auto p-6 space-y-6">
      <!-- 系统警告 -->
      <div v-if="systemAlerts.length > 0" class="space-y-2">
        <Alert
          v-for="alert in systemAlerts"
          :key="alert.id"
          :class="{
            'border-red-200': alert.type === 'error',
            'border-yellow-200': alert.type === 'warning',
            'border-blue-200': alert.type === 'info',
          }"
        >
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>{{ alert.title }}</AlertTitle>
          <AlertDescription>{{ alert.message }}</AlertDescription>
        </Alert>
      </div>

      <!-- 统计卡片 -->
      <div class="grid gap-4 lg:grid-cols-6 md:grid-cols-3">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              总账号数
            </CardTitle>
            <Smartphone class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ accounts.length }}
            </div>
            <p class="text-xs text-muted-foreground">
              +2 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              运行中
            </CardTitle>
            <Power class="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl text-green-600 font-bold">
              {{ accounts.filter(acc => acc.status === 'active').length }}
            </div>
            <p class="text-xs text-muted-foreground">
              正常运行
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              总消息数
            </CardTitle>
            <MessageCircle class="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl text-blue-600 font-bold">
              {{ totalMessages.toLocaleString() }}
            </div>
            <p class="text-xs text-muted-foreground">
              +12% 较昨日
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              响应率
            </CardTitle>
            <TrendingUp class="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl text-green-600 font-bold">
              {{ avgResponseRate.toFixed(1) }}%
            </div>
            <p class="text-xs text-muted-foreground">
              +3% 较昨日
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              在线用户
            </CardTitle>
            <Users class="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl text-purple-600 font-bold">
              1,234
            </div>
            <p class="text-xs text-muted-foreground">
              实时统计
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle class="text-sm font-medium">
              系统状态
            </CardTitle>
            <Activity class="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl text-green-600 font-bold">
              正常
            </div>
            <p class="text-xs text-muted-foreground">
              99.9% 可用性
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- 主要内容区域 -->
      <div class="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
        <!-- 快捷操作 -->
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>常用功能快速访问</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-3">
              <Button variant="outline" class="h-16 flex-col gap-2">
                <BarChart3 class="h-5 w-5" />
                <span class="text-xs">数据报告</span>
              </Button>
              <Button variant="outline" class="h-16 flex-col gap-2">
                <Shield class="h-5 w-5" />
                <span class="text-xs">安全设置</span>
              </Button>
              <Button variant="outline" class="h-16 flex-col gap-2">
                <Upload class="h-5 w-5" />
                <span class="text-xs">批量导入</span>
              </Button>
              <Button variant="outline" class="h-16 flex-col gap-2">
                <HelpCircle class="h-5 w-5" />
                <span class="text-xs">帮助文档</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- 系统监控 -->
        <Card>
          <CardHeader>
            <CardTitle>系统监控</CardTitle>
            <CardDescription>实时系统状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-green-500" />
                  <span class="text-sm">API服务</span>
                </div>
                <span class="text-sm text-green-600">正常</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-green-500" />
                  <span class="text-sm">数据库</span>
                </div>
                <span class="text-sm text-green-600">正常</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-yellow-500" />
                  <span class="text-sm">消息队列</span>
                </div>
                <span class="text-sm text-yellow-600">繁忙</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-green-500" />
                  <span class="text-sm">AI模型</span>
                </div>
                <span class="text-sm text-green-600">正常</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 活动日志 -->
        <Card>
          <CardHeader>
            <CardTitle>活动日志</CardTitle>
            <CardDescription>最近系统活动记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="log in activityLogs"
                :key="log.id"
                class="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50"
              >
                <div
                  :class="`p-1 rounded-full ${
                    log.status === 'success'
                      ? 'bg-green-100'
                      : log.status === 'warning'
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                  }`"
                >
                  <component
                    :is="getActivityIcon(log.type)"
                    :class="`h-3 w-3 ${
                      log.status === 'success'
                        ? 'text-green-600'
                        : log.status === 'warning'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">
                    {{ log.platform }}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {{ log.message }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ log.timestamp }}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 添加账号对话框 -->
    <el-dialog
      v-model="isDialogOpen"
      :title="editingAccount ? '编辑账号' : '添加新账号'"
      width="425px"
      :z-index="2000"
      append-to-body
      custom-class="account-dialog"
    >
      <p class="mb-4 text-sm text-gray-500">
        配置您的社交媒体账号信息，用于AI精聊服务
      </p>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="platform">平台</Label>
          <Select v-model="formData.platform">
            <SelectTrigger>
              <SelectValue placeholder="选择社交媒体平台" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">
                Facebook
              </SelectItem>
              <SelectItem value="whatsapp">
                WhatsApp
              </SelectItem>
              <SelectItem value="line">
                LINE
              </SelectItem>
              <SelectItem value="instagram">
                Instagram
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="accessToken">访问令牌</Label>
          <Input
            id="accessToken"
            v-model="formData.accessToken"
            type="password"
            placeholder="输入API访问令牌"
          />
        </div>
        <div class="grid gap-2">
          <Label for="description">描述（可选）</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="输入账号描述信息"
            :rows="3"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="isDialogOpen = false">
            取消
          </Button>
          <Button @click="handleAddAccount">
            {{ editingAccount ? '更新' : '添加' }}
          </Button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
