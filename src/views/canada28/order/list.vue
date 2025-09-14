<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import apiCanada from '@/api/modules/canada'

defineOptions({
  name: 'Canada28BetRecordsList',
})

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

// 搜索
const searchDefault = {
  period_number: '',
  username: '',
  bet_type: '',
  status: '',
  user_type: '',
  start_date: '',
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
  { label: '等待开奖', value: 'pending' },
  { label: '已中奖', value: 'win' },
  { label: '未中奖', value: 'lose' },
  { label: '已取消', value: 'cancel' },
]

// 用户类型选项
const userTypeOptions = [
  { label: '真实用户', value: 'user' },
  { label: '机器人', value: 'bot' },
]

// 投注类型选项
const betTypeOptions = [
  { label: '大', value: 'big' },
  { label: '小', value: 'small' },
  { label: '单', value: 'odd' },
  { label: '双', value: 'even' },
  { label: '豹子', value: 'triple' },
  { label: '对子', value: 'double' },
  { label: '顺子', value: 'straight' },
]

onMounted(() => {
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.period_number && { period_number: search.value.period_number }),
    ...(search.value.username && { username: search.value.username }),
    ...(search.value.bet_type && { bet_type: search.value.bet_type }),
    ...(search.value.status !== '' && { status: search.value.status }),
    ...(search.value.user_type && { user_type: search.value.user_type }),
    ...(search.value.start_date && { start_date: search.value.start_date }),
  }
  apiCanada.getBetRecordsList(params).then((res: any) => {
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
function getStatusType(status: string) {
  const typeMap: { [key: string]: 'info' | 'warning' | 'success' | 'primary' | 'danger' } = {
    pending: 'warning', // 等待开奖
    win: 'success', // 已中奖
    lose: 'danger', // 未中奖
    cancel: 'info', // 已取消
  }
  return typeMap[status] || 'info'
}

// 获取用户类型标签类型
function getUserTypeType(userType: string) {
  return userType === 'bot' ? 'info' : 'success'
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="投注记录" class="mb-0" />
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
            <ElFormItem label="用户名">
              <ElInput
                v-model="search.username" placeholder="请输入用户名，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
              />
            </ElFormItem>
            <ElFormItem label="用户类型">
              <ElSelect v-model="search.user_type" placeholder="请选择用户类型" clearable>
                <ElOption
                  v-for="option in userTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="投注类型">
              <ElSelect v-model="search.bet_type" placeholder="请选择投注类型" clearable>
                <ElOption
                  v-for="option in betTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
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
            <ElFormItem label="投注时间">
              <ElDatePicker
                v-model="search.start_date"
                type="datetimerange"
                placeholder="选择时间范围"
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
        <ElTableColumn prop="username" label="用户名" min-width="150" header-align="center" align="center" />
        <ElTableColumn prop="user_type_text" label="用户类型" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <ElTag :type="getUserTypeType(scope.row.user_type)" size="small">
              {{ scope.row.user_type_text }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="bet_name" label="投注项目" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="amount" label="投注金额" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <span class="text-blue-600 font-medium">${{ scope.row.amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="multiplier" label="赔率" min-width="80" header-align="center" align="center">
          <template #default="scope">
            <span class="text-purple-600 font-medium">{{ scope.row.multiplier }}x</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="potential_win" label="可赢金额" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <span class="text-green-600 font-medium">${{ scope.row.potential_win }}</span>
          </template>
        </ElTableColumn>
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
        <ElTableColumn prop="actual_profit" label="实际盈亏" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <span :class="Number(scope.row.actual_profit.replace(/,/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
              ${{ scope.row.actual_profit }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="ip" label="IP地址" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <span class="text-gray-600">{{ scope.row.ip || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="投注时间" min-width="170" header-align="center" align="center" />
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
