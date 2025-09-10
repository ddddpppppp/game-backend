<script setup>
import { Avatar, AvatarFallback } from '@/ui/shadcn/ui/avatar'

import { Badge } from '@/ui/shadcn/ui/badge'
import { Button } from '@/ui/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/shadcn/ui/dropdown-menu'
import { Input } from '@/ui/shadcn/ui/input'
import { Label } from '@/ui/shadcn/ui/label'
import { Progress } from '@/ui/shadcn/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/shadcn/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/ui/table'
import { Textarea } from '@/ui/shadcn/ui/textarea'
import { ElMessageBox } from 'element-plus'
import {
  Edit,
  Facebook,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Smartphone,
  Trash2,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

// 平台图标映射
const platformIcons = {
  facebook: Facebook,
  whatsapp: MessageCircle,
  line: Smartphone,
  instagram: Instagram,
}

// 平台颜色映射
const platformColors = {
  facebook: 'bg-blue-500',
  whatsapp: 'bg-green-500',
  line: 'bg-green-600',
  instagram: 'bg-pink-500',
}

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

const isDialogOpen = ref(false)
const editingAccount = ref(null)
const formData = ref({
  platform: '',
  accessToken: '',
  description: '',
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

function handleEdit(account) {
  editingAccount.value = account
  formData.value = {
    platform: account.platform,
    accessToken: account.accessToken,
    description: account.description || '',
  }
  isDialogOpen.value = true
}

function handleDelete(id) {
  accounts.value = accounts.value.filter(acc => acc.id !== id)
}

function toggleStatus(id) {
  const account = accounts.value.find(acc => acc.id === id)
  if (account) {
    account.status = account.status === 'active' ? 'inactive' : 'active'
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'active':
      return { class: 'bg-green-100 text-green-800 hover:bg-green-100', text: '运行中' }
    case 'inactive':
      return { class: '', text: '已停用', variant: 'secondary' }
    case 'error':
      return { class: '', text: '错误', variant: 'destructive' }
    default:
      return { class: '', text: '未知', variant: 'outline' }
  }
}

function getPlatformName(platform) {
  const names = {
    facebook: 'Facebook',
    whatsapp: 'WhatsApp',
    line: 'LINE',
    instagram: 'Instagram',
  }
  return names[platform]
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
        <!-- <Button variant="outline" size="sm">
            <Settings class="mr-2 h-4 w-4" />
            设置
          </Button> -->
        <Button size="sm" @click="openAddDialog">
          <Plus class="mr-2 h-4 w-4" />
          添加账号
        </Button>
      </div>
    </div>
    <!-- 主要内容区域 -->
    <div class="mx-4 mt-4 lg:grid-cols-3">
      <!-- 左侧 - 账号列表 -->
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>账号列表</CardTitle>
                <CardDescription class="mt-1">
                  管理您的社交媒体账号配置和状态
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw class="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>平台</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>性能</TableHead>
                  <TableHead>最后同步</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead class="text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="account in accounts" :key="account.id">
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Avatar :class="`h-8 w-8 ${platformColors[account.platform]}`">
                        <AvatarFallback class="text-white">
                          <component :is="platformIcons[account.platform]" class="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span class="font-medium">{{ getPlatformName(account.platform) }}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      :class="getStatusBadge(account.status).class"
                      :variant="getStatusBadge(account.status).variant"
                    >
                      {{ getStatusBadge(account.status).text }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div class="space-y-1">
                      <div class="text-sm">
                        消息: {{ account.messageCount?.toLocaleString() }}
                      </div>
                      <div class="flex items-center gap-2">
                        <Progress :model-value="account.responseRate" class="h-2 w-16" />
                        <span class="text-xs text-muted-foreground">{{ account.responseRate }}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ account.lastSync }}
                  </TableCell>
                  <TableCell class="max-w-[150px] truncate text-sm text-muted-foreground">
                    {{ account.description || '-' }}
                  </TableCell>
                  <TableCell class="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" class="h-8 w-8 p-0">
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="handleEdit(account)">
                          <Edit class="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="toggleStatus(account.id)">
                          <PowerOff v-if="account.status === 'active'" class="mr-2 h-4 w-4" />
                          <Power v-else class="mr-2 h-4 w-4" />
                          {{ account.status === 'active' ? '停用' : '启用' }}
                        </DropdownMenuItem>
                        <DropdownMenuItem class="text-red-600" @click="handleDelete(account.id)">
                          <Trash2 class="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
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
