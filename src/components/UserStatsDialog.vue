<script setup lang="ts">
import { ElMessage } from 'element-plus'
import apiUser from '@/api/modules/user'

interface UserStats {
  user_id: number
  summary: {
    total_recharge_amount: number
    total_recharge_count: number
    total_withdraw_amount: number
    total_withdraw_count: number
    total_bet_amount: number
    total_bet_count: number
  }
  recent_records: {
    recharge: Array<{
      amount: number
      created_at: string
    }>
    withdraw: Array<{
      amount: number
      status: string
      status_text: string
      created_at: string
    }>
    bet: Array<{
      amount: number
      bet_name: string
      status: string
      period_number: string
      created_at: string
    }>
  }
}

const visible = ref(false)
const loading = ref(false)
const userStats = ref<UserStats | null>(null)
const activeTab = ref('recharge')

// 打开对话框
function open(userId: number) {
  visible.value = true
  getUserStats(userId)
}

// 获取用户统计数据
async function getUserStats(userId: number) {
  loading.value = true
  try {
    const response = await apiUser.getUserStats({ user_id: userId })
    userStats.value = response.data
  }
  catch (error) {
    ElMessage.error('获取用户统计数据失败')
    console.error('获取用户统计数据失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 关闭对话框
function handleClose() {
  visible.value = false
  userStats.value = null
  activeTab.value = 'recharge'
}

// 格式化日期
function formatDate(date: string) {
  if (!date) {
    return '-'
  }
  return new Date(date).toLocaleString('zh-CN')
}

// 暴露方法供父组件调用
defineExpose({
  open,
})
</script>

<template>
  <ElDialog
    v-model="visible"
    title="用户统计信息"
    width="80%"
    :before-close="handleClose"
    destroy-on-close
  >
    <div v-loading="loading" class="user-stats-container">
      <div v-if="userStats" class="stats-content">

        <!-- 统计汇总 -->
        <div class="summary-stats mb-6">
          <h3 class="mb-4 text-lg font-bold">
            统计汇总
          </h3>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <!-- 充值统计 -->
            <ElCard>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">
                    总充值
                  </p>
                  <p class="text-2xl text-green-600 font-bold">
                    ${{ Number(userStats.summary.total_recharge_amount || 0).toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ userStats.summary.total_recharge_count }} 次
                  </p>
                </div>
                <FaIcon name="i-ep:money" class="text-3xl text-green-500" />
              </div>
            </ElCard>

            <!-- 提现统计 -->
            <ElCard>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">
                    总提现
                  </p>
                  <p class="text-2xl text-blue-600 font-bold">
                    ${{ Number(userStats.summary.total_withdraw_amount || 0).toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ userStats.summary.total_withdraw_count }} 次
                  </p>
                </div>
                <FaIcon name="i-ep:coin" class="text-3xl text-blue-500" />
              </div>
            </ElCard>

            <!-- 下注统计 -->
            <ElCard>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">
                    总下注
                  </p>
                  <p class="text-2xl text-orange-600 font-bold">
                    ${{ Number(userStats.summary.total_bet_amount || 0).toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ userStats.summary.total_bet_count }} 次
                  </p>
                </div>
                <FaIcon name="i-ep:trophy" class="text-3xl text-orange-500" />
              </div>
            </ElCard>
          </div>
        </div>

        <!-- 最近记录 -->
        <div class="recent-records">
          <ElTabs v-model="activeTab" class="stats-tabs">
            <!-- 充值记录 -->
            <ElTabPane label="充值记录" name="recharge">
              <ElTable :data="userStats.recent_records.recharge" height="300" stripe>
                <ElTableColumn prop="amount" label="金额" min-width="120" align="center">
                  <template #default="scope">
                    <span class="text-green-600 font-medium">
                      ${{ Number(scope.row.amount).toFixed(2) }}
                    </span>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="created_at" label="时间" align="center">
                  <template #default="scope">
                    {{ formatDate(scope.row.created_at) }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>

            <!-- 提现记录 -->
            <ElTabPane label="提现记录" name="withdraw">
              <ElTable :data="userStats.recent_records.withdraw" height="300" stripe>
                <ElTableColumn prop="amount" label="金额" min-width="120" align="center">
                  <template #default="scope">
                    <span class="text-blue-600 font-medium">
                      ${{ Number(scope.row.amount).toFixed(2) }}
                    </span>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="status" label="状态" min-width="100" align="center">
                  <template #default="scope">
                    <ElTag :type="scope.row.status_color" size="small">
                      {{ scope.row.status_text }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="created_at" label="时间" align="center">
                  <template #default="scope">
                    {{ formatDate(scope.row.created_at) }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>

            <!-- 下注记录 -->
            <ElTabPane label="下注记录" name="bet">
              <ElTable :data="userStats.recent_records.bet" height="300" stripe>
                <ElTableColumn prop="period_number" label="期号" min-width="120" align="center" />
                <ElTableColumn prop="amount" label="下注金额" min-width="120" align="center">
                  <template #default="scope">
                    <span class="text-orange-600 font-medium">
                      ${{ Number(scope.row.amount).toFixed(2) }}
                    </span>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="bet_name" label="投注内容" min-width="120" align="center" />
                <ElTableColumn prop="win_amount" label="中奖金额" min-width="120" align="center">
                  <template #default="scope">
                    <span class="text-green-600 font-medium">
                      ${{ Number(scope.row.win_amount).toFixed(2) }}
                    </span>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="status" label="结果" min-width="100" align="center">
                  <template #default="scope">
                    <ElTag :type="scope.row.status === 'win' ? 'success' : 'danger'" size="small">
                      {{ scope.row.status === 'win' ? '中奖' : '未中奖' }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn prop="created_at" label="时间" align="center">
                  <template #default="scope">
                    {{ formatDate(scope.row.created_at) }}
                  </template>
                </ElTableColumn>
              </ElTable>
            </ElTabPane>
          </ElTabs>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">关闭</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<style scoped>
.user-stats-container {
  min-height: 400px;
}

.stats-content {
  padding: 0 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

:deep(.stats-tabs .el-tabs__content) {
  padding-top: 20px;
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-card__body) {
  padding: 20px;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gap-4 {
  gap: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.mr-3 {
  margin-right: 0.75rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.text-4xl {
  font-size: 2.25rem;
  line-height: 2.5rem;
}

.font-bold {
  font-weight: 700;
}

.font-medium {
  font-weight: 500;
}

.text-gray-600 {
  color: #4b5563;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-300 {
  color: #d1d5db;
}

.text-green-600 {
  color: #059669;
}

.text-blue-600 {
  color: #2563eb;
}

.text-blue-500 {
  color: #3b82f6;
}

.text-orange-600 {
  color: #ea580c;
}

.text-orange-500 {
  color: #f97316;
}

.text-green-500 {
  color: #10b981;
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
