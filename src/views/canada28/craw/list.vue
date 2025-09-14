<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import apiCanada from '@/api/modules/canada'

defineOptions({
  name: 'Canada28DrawRecordsList',
})

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

// 搜索
const searchDefault = {
  period_number: '',
  status: '',
  start_date: '',
  end_date: '',
}
const search = ref({ ...searchDefault })
function searchReset() {
  Object.assign(search.value, searchDefault)
}

// 列表
const loading = ref(false)
const dataList = ref([])

// 状态选项
const statusOptions = [
  { label: '等待开奖', value: '0' },
  { label: '开奖中', value: '1' },
  { label: '已开奖', value: '2' },
  { label: '已结算', value: '3' },
]

onMounted(() => {
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.period_number && { period_number: search.value.period_number }),
    ...(search.value.status !== '' && { status: search.value.status }),
    ...(search.value.start_date && { start_date: search.value.start_date }),
    ...(search.value.end_date && { end_date: search.value.end_date }),
  }
  apiCanada.getDrawRecordsList(params).then((res: any) => {
    loading.value = false
    dataList.value = res.data.list
    pagination.value.total = res.data.total
  }).catch(() => {
    loading.value = false
  })
}

// 每页数量切换
function sizeChange(size: number) {
  onSizeChange(size).then(() => getDataList())
}

// 当前页码切换（翻页）
function currentChange(page = 1) {
  onCurrentChange(page).then(() => getDataList())
}

// 字段排序
function sortChange({ prop, order }: { prop: string, order: string }) {
  onSortChange(prop, order).then(() => getDataList())
}

// 获取状态类型
function getStatusType(status: number) {
  const typeMap: { [key: number]: 'info' | 'warning' | 'success' | 'primary' | 'danger' } = {
    0: 'info', // 等待开奖
    1: 'warning', // 开奖中
    2: 'success', // 已开奖
    3: 'success', // 已结算
  }
  return typeMap[status] || 'info'
}

// 格式化数字显示
function formatNumber(value: string | number) {
  if (!value && value !== 0) {
    return '0'
  }
  return Number(value).toLocaleString()
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="开奖记录" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="期号">
              <ElInput
                v-model="search.period_number" placeholder="请输入期号，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
              />
            </ElFormItem>
            <ElFormItem label="状态">
              <ElSelect v-model="search.status" placeholder="请选择状态" clearable>
                <ElOption
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="开始时间">
              <ElDatePicker
                v-model="search.start_date"
                type="datetimerange"
                placeholder="开始日期"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton @click="searchReset(); currentChange()">
                重置
              </ElButton>
              <ElButton type="primary" @click="currentChange()">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                筛选
              </ElButton>
              <ElButton link disabled @click="toggle">
                <template #icon>
                  <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top'" />
                </template>
                {{ fold ? '展开' : '收起' }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>
      <ElDivider border-style="dashed" />

      <ElTable
        v-loading="loading" class="my-4" :data="dataList" height="100%" highlight-current-row border
        @sort-change="sortChange"
      >
        <ElTableColumn prop="period_number" label="期号" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="result_numbers" label="开奖号码" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <div class="flex items-center justify-center gap-1">
              <span v-if="scope.row.result_numbers && scope.row.result_numbers.length">
                <span
                  v-for="(num, index) in scope.row.result_numbers" :key="index"
                  class="h-6 w-6 inline-flex items-center justify-center rounded-full bg-blue-100 text-xs text-blue-800 font-medium"
                >
                  {{ num }}
                </span>
                <span class="mx-1">+</span>
              </span>
              <span v-else>-</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="result_sum" label="总和" min-width="80" header-align="center" align="center">
          <template #default="scope">
            <ElTag v-if="scope.row.result_sum !== null" :type="scope.row.result_sum >= 14 ? 'danger' : 'success'" size="small">
              {{ scope.row.result_sum }}
            </ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <ElTag :type="getStatusType(scope.row.status)" size="small">
              {{ scope.row.status_text }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="user_count" label="真实用户" min-width="90" header-align="center" align="center">
          <template #default="scope">
            <span class="text-blue-600 font-medium">{{ formatNumber(scope.row.user_count) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="bot_count" label="机器人" min-width="90" header-align="center" align="center">
          <template #default="scope">
            <span class="text-gray-600 font-medium">{{ formatNumber(scope.row.bot_count) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="user_bet_count" label="用户投注笔数" min-width="110" header-align="center" align="center">
          <template #default="scope">
            <span class="text-blue-600 font-medium">{{ formatNumber(scope.row.user_bet_count) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="bot_bet_count" label="机器人投注笔数" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <span class="text-gray-600 font-medium">{{ formatNumber(scope.row.bot_bet_count) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="user_bet_amount" label="用户投注金额" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <span class="text-green-600 font-medium">${{ scope.row.user_bet_amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="bot_bet_amount" label="机器人投注金额" min-width="130" header-align="center" align="center">
          <template #default="scope">
            <span class="text-orange-600 font-medium">${{ scope.row.bot_bet_amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="total_user_profit" label="用户盈利" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <span class="text-red-600 font-medium">${{ scope.row.total_user_profit }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="platform_profit" label="平台盈利" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <span :class="Number(scope.row.platform_profit.replace(/,/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
              ${{ scope.row.platform_profit }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="start_at" label="开始时间" min-width="170" header-align="center" align="center" />
        <ElTableColumn prop="end_at" label="结束时间" min-width="170" header-align="center" align="center" />
      </ElTable>
      <ElPagination
        :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size"
        :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination"
        background @size-change="sizeChange" @current-change="currentChange"
      />
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
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
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
