<route lang="yaml">
  meta:
    enabled: false
  </route>

<script setup lang="ts">
import apiCanada from '@/api/modules/canada'

defineOptions({
  name: 'FinanceStats',
})

// 表格是否自适应高度
const tableAutoHeight = ref(false)

const loading = ref(false)
// 日期范围 - 默认最近一周
const dateRange = ref<[string, string]>([
  new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天前
  new Date().toISOString().split('T')[0], // 今天
])

// 渠道统计数据
const channelStats = ref<Array<any>>([])

// 合计数据
const summaryStats = ref<any>({})

onMounted(() => {
  loadData()
})

// 格式化日期
function formatDateRange(): [string, string] {
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    return [
      dateRange.value[0],
      dateRange.value[1],
    ]
  }
  // 如果没有选择日期，返回默认的最近一周
  return [
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0],
  ]
}

// 加载数据
async function loadData() {
  loading.value = true
  const [startDate, endDate] = formatDateRange()

  try {
    // 加载渠道统计数据 - 使用新的API
    const channelRes = await apiCanada.getFinanceStats({
      start_date: startDate,
      end_date: endDate,
    })
    channelStats.value = channelRes.data.list
    summaryStats.value = channelRes.data.total // 使用总计数据作为汇总
  }
  catch (error) {
    console.error('Failed to load finance data:', error)
  }
  finally {
    loading.value = false
  }
}

// 日期范围改变
function onDateRangeChange() {
  loadData()
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="财务统计" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <!-- 日期选择器 -->
      <ElCard class="mb-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            时间范围
          </h3>
          <div class="w-90">
            <ElDatePicker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="onDateRangeChange"
            />
          </div>
        </div>
      </ElCard>

      <!-- 财务数据表格 -->
      <ElCard class="mb-4">
        <template #header>
          <span class="text-lg font-semibold">财务数据</span>
        </template>
        <ElTable v-loading="loading" :data="[...channelStats, summaryStats]" border>
          <ElTableColumn prop="channel_name" label="渠道" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold text-blue-600' : ''">
                {{ scope.row.channel_name }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="注册人数" min-width="100" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-blue-600'">
                {{ scope.row.register_count === '--' ? '--' : `${scope.row.register_count || 0}人` }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="赠送金额" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-green-600'">
                ${{ scope.row.gift_amount || '0.00' }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="充值人数" min-width="100" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-blue-600'">
                {{ scope.row.deposit_user_count || 0 }}人
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="充值笔数" min-width="100" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-blue-600'">
                {{ scope.row.deposit_count || 0 }}笔
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="充值金额" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-green-600'">
                ${{ scope.row.deposit_amount || '0.00' }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="通道/网关" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <div class="text-xs" :class="scope.row.channel_name === '合计' ? 'font-bold' : ''">
                <div class="text-red-600">
                  通道: ${{ scope.row.channel_fee_rate || '0.00' }}
                </div>
                <div class="text-orange-600">
                  网关: ${{ scope.row.gateway_fee || '0.00' }}
                </div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="实际金额" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-purple-600'">
                ${{ scope.row.actual_amount || '0.00' }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="下分人数" min-width="100" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-blue-600'">
                {{ scope.row.withdraw_user_count || 0 }}人
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="下分金额" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-red-600'">
                ${{ scope.row.withdraw_amount || '0.00' }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="提现费" min-width="100" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-orange-600'">
                ${{ scope.row.withdraw_fee || '0.00' }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="实际出金" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-red-600'">
                {{ scope.row.actual_withdraw === '--' ? '--' : `$${scope.row.actual_withdraw || '0.00'}` }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="未下分" min-width="100" header-align="center" align="center">
            <template #default="scope">
              <span :class="scope.row.channel_name === '合计' ? 'font-bold' : 'text-yellow-600'">
                {{ scope.row.user_balances === '--' ? '--' : `$${scope.row.user_balances || '0.00'}` }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="利润" min-width="120" header-align="center" align="center">
            <template #default="scope">
              <span
                :class="[
                  scope.row.channel_name === '合计' ? 'font-bold' : '',
                  scope.row.profit_color === 'green' ? 'text-green-600' : 'text-red-600',
                ]"
              >
                ${{ scope.row.profit || '0.00' }}
              </span>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </FaPageMain>
  </div>
</template>

  <style scoped>
  .absolute-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .search-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    margin-bottom: -18px;

    :deep(.el-form-item) {
      grid-column: auto / span 1;

      &:last-child {
        grid-column-end: -1;

        .el-form-item__content {
          justify-content: flex-end;
        }
      }
    }
  }

  .el-divider {
    width: calc(100% + 40px);
    margin-inline: -20px;
  }
  </style>
