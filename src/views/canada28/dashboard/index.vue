<script setup>
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import apiCanada from '@/api/modules/canada'

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

// 获取当前日期及之前的7天时间范围
const dateRange = ref(getLast7Days())

const loading = ref(false)

// Team performance data
const teamPeriod = ref('day')

// Dashboard data
const personalStats = ref({
  depositAmount: 0,
  depositAmountTrend: { value: 0, trend: 'up' },
  withdrawAmount: 0,
  withdrawAmountTrend: { value: 0, trend: 'up' },
  betAmount: 0,
  betAmountTrend: { value: 0, trend: 'up' },
  platformProfit: 0,
  platformProfitTrend: { value: 0, trend: 'up' },
})

// Chart data
const chartData = ref({
  labels: [],
  depositData: [],
  withdrawData: [],
  betData: [],
  profitData: [],
})

// ECharts option for team performance
const teamChartOption = computed(() => {
  // Create a cohesive color palette
  const colors = [
    '#10b981', // 充值 - 绿色
    '#ef4444', // 提现 - 红色
    '#3b82f6', // 投注 - 蓝色
    '#f59e0b', // 平台盈利 - 黄色
  ]

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        let result = `${params[0].name}<br/>`
        params.forEach((param) => {
          result += `${param.marker + param.seriesName}: $${param.value.toLocaleString()}<br/>`
        })
        return result
      },
    },
    legend: {
      data: ['平台充值', '平台提现', '用户投注', '平台盈利'],
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.value.labels || [],
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '金额 ($)',
        position: 'left',
        axisLabel: {
          formatter(value) {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`
            }
            else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`
            }
            return value
          },
        },
      },
    ],
    series: [
      {
        name: '平台充值',
        type: 'bar',
        barWidth: 15,
        itemStyle: {
          color: colors[0],
        },
        data: chartData.value.depositData || [],
      },
      {
        name: '平台提现',
        type: 'bar',
        barWidth: 15,
        itemStyle: {
          color: colors[1],
        },
        data: chartData.value.withdrawData || [],
      },
      {
        name: '用户投注',
        type: 'bar',
        barWidth: 15,
        itemStyle: {
          color: colors[2],
        },
        data: chartData.value.betData || [],
      },
      {
        name: '平台盈利',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: colors[3],
        },
        itemStyle: {
          color: colors[3],
        },
        data: chartData.value.profitData || [],
      },
    ],
    color: colors,
  }
})

onMounted(() => {
  getDashboardData()
})

async function getDashboardData() {
  loading.value = true
  try {
    const res = await apiCanada.getDashboardStats({
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      period: teamPeriod.value,
    })

    if (res && res.status === 1 && res.data) {
      // Update personal stats
      personalStats.value = res.data.personal || personalStats.value

      // Update chart data
      chartData.value = res.data.chart || chartData.value
    }
  }
  catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
  finally {
    loading.value = false
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 获取最近7天的日期范围函数
function getLast7Days() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6) // 当前日期算一天，所以减6天

  // 格式化日期为 YYYY/MM/DD 格式
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  return [formatDate(start), formatDate(end)]
}
</script>

<template>
  <div v-loading="loading" class="dashboard-container">
    <!-- Header with FaPageHeader -->
    <FaPageHeader title="Canada28 仪表盘" class="mb-0" />

    <!-- Improved Date Filter Section -->
    <div class="date-filter-container flex justify-end">
      <div class="filter-wrapper">
        <div class="filter-section">
          <div class="filter-group">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY/MM/DD"
              value-format="YYYY/MM/DD"
              class="subtle-date-picker"
            />
          </div>
        </div>

        <div class="filter-actions">
          <el-button type="primary" size="large" class="search-btn" @click="getDashboardData">
            <FaIcon name="i-ep:search" />
          </el-button>
        </div>
      </div>
    </div>

    <div class="dashboard">
      <!-- Stat Cards - First Row -->
      <div class="mb-4 flex-center gap-4">
        <FaDigitalCard
          title="平台充值"
          icon="i-ep:wallet"
          :digital="`$${formatNumber(personalStats.depositAmount)}`"
          :description="`较上个周期${personalStats.depositAmountTrend.trend === 'up' ? '上升' : '下降'}${personalStats.depositAmountTrend.value}%`"
          :trend="personalStats.depositAmountTrend.trend"
        />
        <FaDigitalCard
          title="平台提现"
          icon="i-ep:money"
          :digital="`$${formatNumber(personalStats.withdrawAmount)}`"
          :description="`较上个周期${personalStats.withdrawAmountTrend.trend === 'up' ? '上升' : '下降'}${personalStats.withdrawAmountTrend.value}%`"
          :trend="personalStats.withdrawAmountTrend.trend"
        />
        <FaDigitalCard
          title="用户投注"
          icon="i-ep:coin"
          :digital="`$${formatNumber(personalStats.betAmount)}`"
          :description="`较上个周期${personalStats.betAmountTrend.trend === 'up' ? '上升' : '下降'}${personalStats.betAmountTrend.value}%`"
          :trend="personalStats.betAmountTrend.trend"
        />
        <FaDigitalCard
          title="平台盈利"
          icon="i-ep:data-analysis"
          :digital="`$${formatNumber(personalStats.platformProfit)}`"
          :description="`较上个周期${personalStats.platformProfitTrend.trend === 'up' ? '上升' : '下降'}${personalStats.platformProfitTrend.value}%`"
          :trend="personalStats.platformProfitTrend.trend"
        />
      </div>

      <!-- Team Performance Section with ECharts -->
      <el-row :gutter="20" class="dashboard-section">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>Canada28 数据统计</span>
                <el-radio-group v-model="teamPeriod" size="small" @change="getDashboardData">
                  <el-radio-button value="day">
                    日
                  </el-radio-button>
                  <el-radio-button value="week">
                    周
                  </el-radio-button>
                  <el-radio-button value="month">
                    月
                  </el-radio-button>
                </el-radio-group>
              </div>
            </template>

            <!-- Team Performance Chart with ECharts -->
            <div class="echarts-container">
              <VChart class="chart" :option="teamChartOption" autoresize />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: calc(100vh - 100px);
  padding: 20px;
  padding-top: 10px;
}

.mb-0 {
  margin-bottom: 0;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gap-4 {
  gap: 16px;
}

.dashboard-section {
  margin-bottom: 24px;
}

.section-card {
  max-height: 360px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.echarts-container {
  width: 100%;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}

.wallet-card {
  height: 100%;
}

.wallet-content {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.wallet-item {
  margin-bottom: 16px;
}

.wallet-label {
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.wallet-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.wallet-button {
  align-self: flex-start;
  margin-top: auto;
}

/* Override Element Plus styles to match the primary color */
:deep(.el-button--primary) {
  --el-button-bg-color: hsl(var(--primary));
  --el-button-border-color: hsl(var(--primary));
  --el-button-hover-bg-color: hsl(var(--primary));
  --el-button-hover-border-color: hsl(var(--primary));
  --el-button-active-bg-color: hsl(var(--primary));
  --el-button-active-border-color: hsl(var(--primary));

  font-weight: 500;
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
  border-radius: 6px;
}

.date-filter-container {
  padding: 0 20px;
}

.filter-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.filter-section {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-label {
  min-width: fit-content;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}

.subtle-select {
  width: 220px;
}

.subtle-date-picker {
  width: 240px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-btn {
  padding: 8px 20px;
  border-radius: 6px;
}

/* Subtle styling for Select */
:deep(.filter-group .el-select__wrapper) {
  width: 220px;
  padding: 13px 10px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.filter-group .el-select__wrapper:hover) {
  background-color: #f1f3f4;
  border-color: #d1d5db;
}

:deep(.filter-group .el-select__wrapper.is-focused) {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 10%);
}

/* Subtle styling for DatePicker */
:deep(.filter-group .el-input__wrapper) {
  width: 240px;
  padding: 20px 10px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: none;
  transition: all 0.2s ease;
}

:deep(.filter-group .el-input__wrapper.is-active) {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsl(var(--primary) / 10%);
}

/* Primary button hover styling */
:deep(.el-button--primary:hover) {
  background-color: hsl(var(--primary) / 90%);
  border-color: hsl(var(--primary) / 90%);
}

/* Responsive design */
@media (width <= 768px) {
  .filter-wrapper {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }

  .subtle-select,
  .subtle-date-picker {
    width: 100%;
  }

  .filter-actions {
    justify-content: center;
  }
}
</style>
