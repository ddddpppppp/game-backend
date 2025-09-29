<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import apiUser from '@/api/modules/user'
import UserStatsDialog from '@/components/UserStatsDialog.vue'

defineOptions({
  name: 'WithdrawList',
})

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

// 搜索
const searchDefault = {
  username: '',
  order_no: '',
  status: '',
  coin_type: '',
  start_date: '',
  end_date: '',
  device_code: '',
  ip: '',
}
const search = ref({ ...searchDefault })
function searchReset() {
  Object.assign(search.value, searchDefault)
}

// 列表
const loading = ref(false)
const dataList = ref([])
const stats = ref({
  total_amount: 0,
  total_fee: 0,
  pending_amount: 0,
  completed_amount: 0,
  failed_amount: 0,
  pending_count: 0,
  completed_count: 0,
  failed_count: 0,
})

// 状态选项
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '已过期', value: 'expired' },
]

onMounted(() => {
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.username && { username: search.value.username }),
    ...(search.value.order_no && { order_no: search.value.order_no }),
    ...(search.value.status !== '' && { status: search.value.status }),
    ...(search.value.coin_type && { coin_type: search.value.coin_type }),
    ...(search.value.start_date && { start_date: search.value.start_date }),
    ...(search.value.end_date && { end_date: search.value.end_date }),
    ...(search.value.device_code && { device_code: search.value.device_code }),
    ...(search.value.ip && { ip: search.value.ip }),
  }
  apiUser.getUserWithdrawList(params).then((res: any) => {
    loading.value = false
    dataList.value = res.data.list
    pagination.value.total = res.data.total
    stats.value = res.data.stats
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

// 处理提现申请
function processWithdraw(row: any, action: 'approve' | 'reject') {
  const actionText = action === 'approve' ? '批准' : '拒绝'

  if (action === 'approve') {
    const confirmText = `确认${actionText}用户「${row.user?.nickname}」的提现申请吗？`
    ElMessageBox.confirm(confirmText, '确认信息').then(() => {
      apiUser.processWithdraw({
        id: row.id,
        action,
      }).then(() => {
        getDataList()
        ElMessage.success(`${actionText}成功`)
      })
    }).catch(() => {})
  }
  else {
    // 拒绝时需要填写理由
    ElMessageBox.prompt(
      `请输入拒绝用户「${row.user?.nickname}」提现申请的理由：`,
      '拒绝理由',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入拒绝理由',
        inputPlaceholder: '请填写拒绝理由...',
      },
    ).then(({ value }) => {
      apiUser.processWithdraw({
        id: row.id,
        action,
        remark: value,
      }).then(() => {
        getDataList()
        ElMessage.success(`${actionText}成功`)
      })
    }).catch(() => {})
  }
}

// 获取状态类型
function getStatusType(status: string) {
  const typeMap: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    expired: 'info',
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
function getStatusText(status: string) {
  const textMap: Record<string, string> = {
    pending: '待审核',
    completed: '已完成',
    failed: '失败',
    expired: '已过期',
  }
  return textMap[status] || status
}

// 格式化金额
function formatAmount(amount: number, coinType: string) {
  return `${Number(amount).toFixed(4)} ${coinType}`
}

// 复制到剪贴板
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 格式化日期
function formatDate(date: string) {
  if (!date) {
    return '-'
  }
  return new Date(date).toLocaleString('zh-CN')
}

// 用户统计对话框引用
const userStatsDialogRef = ref()

// 查看用户统计
function viewUserStats(userId: number) {
  userStatsDialogRef.value?.open(userId)
}

// 显示失败原因
function showFailureReason(remark: string) {
  ElMessageBox.alert(remark, '失败原因', { confirmButtonText: '确定' })
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="提现列表" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="用户邮箱">
              <ElInput
                v-model="search.username" placeholder="请输入用户邮箱，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
              />
            </ElFormItem>
            <ElFormItem v-if="!fold" label="订单号">
              <ElInput
                v-model="search.order_no" placeholder="请输入订单号，支持模糊查询" clearable @keydown.enter="currentChange()"
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
            <ElFormItem v-if="!fold" label="开始日期">
              <ElDatePicker
                v-model="search.start_date"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
              />
            </ElFormItem>
            <ElFormItem v-if="!fold" label="结束日期">
              <ElDatePicker
                v-model="search.end_date"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
              />
            </ElFormItem>
            <ElFormItem v-if="!fold" label="设备号">
              <ElInput
                v-model="search.device_code" placeholder="请输入设备号，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
              />
            </ElFormItem>
            <ElFormItem v-if="!fold" label="注册IP">
              <ElInput
                v-model="search.ip" placeholder="请输入注册IP，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
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
              <ElButton link @click="toggle">
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

      <!-- 统计卡片 -->
      <div class="grid-cols-1 mb-4 ml-2 mr-2 gap-4 hidden md:grid md:grid-cols-5">
        <ElCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                总提现金额
              </p>
              <p class="text-2xl text-blue-600 font-bold">
                ${{ Number(stats.total_amount).toFixed(2) }}
              </p>
            </div>
            <FaIcon name="i-ep:money" class="text-3xl text-blue-500" />
          </div>
        </ElCard>

        <ElCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                总手续费
              </p>
              <p class="text-2xl text-gray-600 font-bold">
                ${{ Number(stats.total_fee).toFixed(2) }}
              </p>
            </div>
            <FaIcon name="i-ep:coin" class="text-3xl text-gray-500" />
          </div>
        </ElCard>

        <ElCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                待审核
              </p>
              <p class="text-2xl text-orange-600 font-bold">
                ${{ Number(stats.pending_amount).toFixed(2) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ stats.pending_count }} 笔
              </p>
            </div>
            <FaIcon name="i-ep:clock" class="text-3xl text-orange-500" />
          </div>
        </ElCard>

        <ElCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                已完成
              </p>
              <p class="text-2xl text-green-600 font-bold">
                ${{ Number(stats.completed_amount).toFixed(2) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ stats.completed_count }} 笔
              </p>
            </div>
            <FaIcon name="i-ep:success-filled" class="text-3xl text-green-500" />
          </div>
        </ElCard>

        <ElCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">
                失败
              </p>
              <p class="text-2xl text-red-600 font-bold">
                ${{ Number(stats.failed_amount).toFixed(2) }}
              </p>
              <p class="text-xs text-gray-500">
                {{ stats.failed_count }} 笔
              </p>
            </div>
            <FaIcon name="i-ep:failed" class="text-3xl text-red-500" />
          </div>
        </ElCard>
      </div>

      <ElDivider border-style="dashed" />

      <ElTable
        v-loading="loading" class="my-4" :data="dataList" height="100%" highlight-current-row border
        @sort-change="sortChange"
      >
        <!-- <ElTableColumn prop="id" label="ID" min-width="80" header-align="center" align="center" class-name="hidden md:table-cell" /> -->
        <ElTableColumn prop="user" label="用户信息" min-width="200" header-align="center" align="center">
          <template #default="scope">
            <div v-if="scope.row.user">
              <div class="font-medium">
                {{ scope.row.user.nickname }}
              </div>
              <div class="text-sm text-gray-500">
                {{ scope.row.user.username }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="用户统计" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <ElTooltip content="查看用户统计" placement="top">
              <ElButton
                type="primary"
                size="small"
                circle
                @click="viewUserStats(scope.row.user_id)"
              >
                <FaIcon name="i-ep:data-analysis" />
              </ElButton>
            </ElTooltip>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="device_code" label="设备号" min-width="160" header-align="center" align="center" class-name="hidden lg:table-cell">
          <template #default="scope">
            <div v-if="scope.row.user && scope.row.user.device_code" class="flex items-center justify-center gap-2">
              <span
                class="text-sm font-mono"
                :class="{ 'text-red-600 font-bold': scope.row.device_code_count > 2 }"
              >
                {{ scope.row.user.device_code.length > 10 ? `${scope.row.user.device_code.slice(0, 8)}...` : scope.row.user.device_code }}
              </span>
              <ElButton size="small" text @click="copyToClipboard(scope.row.user.device_code)">
                <FaIcon name="i-ep:copy-document" />
              </ElButton>
              <span v-if="scope.row.device_code_count > 1" class="text-xs text-gray-500">
                ({{ scope.row.device_code_count }})
              </span>
            </div>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="ip" label="注册IP" min-width="170" header-align="center" align="center" class-name="hidden lg:table-cell">
          <template #default="scope">
            <div v-if="scope.row.user && scope.row.user.ip" class="flex items-center justify-center gap-2">
              <span
                class="text-sm font-mono"
                :class="{ 'text-red-600 font-bold': scope.row.ip_count > 2 }"
              >
                {{ scope.row.user.ip }}
              </span>
              <ElButton size="small" text @click="copyToClipboard(scope.row.user.ip)">
                <FaIcon name="i-ep:copy-document" />
              </ElButton>
              <span v-if="scope.row.ip_count > 1" class="text-xs text-gray-500">
                ({{ scope.row.ip_count }})
              </span>
            </div>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="order_no" label="订单号" min-width="250" header-align="center" align="center" class-name="hidden md:table-cell">
          <template #default="scope">
            <div v-if="scope.row.order_no" class="flex items-center justify-center gap-2">
              <span class="text-sm font-mono">{{ scope.row.order_no }}</span>
              <ElButton size="small" text @click="copyToClipboard(scope.row.order_no)">
                <FaIcon name="i-ep:copy-document" />
              </ElButton>
            </div>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="amount" label="提现金额" min-width="160" header-align="center" align="center">
          <template #default="scope">
            <div class="font-medium">
              {{ formatAmount(scope.row.amount, '$') }}
            </div>
            <div v-if="scope.row.actual_amount && scope.row.actual_amount !== scope.row.amount" class="text-sm text-gray-500">
              实际下发: {{ formatAmount(scope.row.actual_amount, '$') }}
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="fee" label="手续费" min-width="100" header-align="center" align="center" class-name="hidden md:table-cell">
          <template #default="scope">
            {{ formatAmount(scope.row.fee || 0, '$') }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="channel_name" label="类型" min-width="90" header-align="center" align="center">
          <template #default="scope">
            <span class="text-sm text-red-500 font-bold">{{ scope.row.channel_name }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account" label="提现信息" min-width="420" header-align="center" align="center">
          <template #default="scope">
            <div v-if="scope.row.account" class="flex items-center justify-center gap-2">
              <span class="text-sm font-mono">{{ scope.row.account }}</span>
              <ElButton size="small" text @click="copyToClipboard(scope.row.account)">
                <FaIcon name="i-ep:copy-document" />
              </ElButton>
            </div>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <div class="flex items-center justify-center gap-1">
              <ElTag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </ElTag>
              <ElButton
                v-if="scope.row.status === 'failed' && scope.row.remark"
                size="small"
                text
                type="danger"
                @click="showFailureReason(scope.row.remark)"
              >
                <FaIcon name="i-ep:info-filled" />
              </ElButton>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="申请时间" min-width="160" header-align="center" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="completed_at" label="处理时间" min-width="160" header-align="center" align="center" class-name="hidden lg:table-cell">
          <template #default="scope">
            {{ formatDate(scope.row.completed_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.status === 'pending'" class="flex items-center justify-center gap-1">
              <ElTooltip content="批准提现" placement="top">
                <ElButton
                  type="success"
                  size="small"
                  circle
                  @click="processWithdraw(scope.row, 'approve')"
                >
                  <FaIcon name="i-ep:check" />
                </ElButton>
              </ElTooltip>
              <ElTooltip content="拒绝提现" placement="top">
                <ElButton
                  type="danger"
                  size="small"
                  circle
                  @click="processWithdraw(scope.row, 'reject')"
                >
                  <FaIcon name="i-ep:close" />
                </ElButton>
              </ElTooltip>
            </div>
            <span v-else class="text-sm text-gray-400">无操作</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size"
        :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination"
        background @size-change="sizeChange" @current-change="currentChange"
      />
    </FaPageMain>

    <!-- 用户统计对话框 -->
    <UserStatsDialog ref="userStatsDialogRef" />
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
