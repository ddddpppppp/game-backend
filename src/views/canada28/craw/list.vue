<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import apiUser from '@/api/modules/user'

defineOptions({
  name: 'UserList',
})

const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

// 搜索
const searchDefault = {
  username: '',
  nickname: '',
  status: '',
  parent_id: '',
}
const search = ref({ ...searchDefault })
function searchReset() {
  Object.assign(search.value, searchDefault)
}

// 批量操作
const batch = ref({
  enable: true,
  selectionDataList: [] as Array<{ id: string | number }>,
})

// 列表
const loading = ref(false)
const dataList = ref([])

// 状态选项
const statusOptions = [
  { label: '正常', value: '1' },
  { label: '禁用', value: '0' },
]

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref<'password' | 'funding'>('password')

const passwordForm = ref({
  user_id: 0,
  new_password: '',
  confirm_password: '',
})

const fundingForm = ref({
  user_id: 0,
  new_funding_password: '',
  confirm_funding_password: '',
})

onMounted(() => {
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.username && { username: search.value.username }),
    ...(search.value.nickname && { nickname: search.value.nickname }),
    ...(search.value.status !== '' && { status: search.value.status }),
    ...(search.value.parent_id && { parent_id: search.value.parent_id }),
  }
  apiUser.getUserList(params).then((res: any) => {
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

function onChangePassword(row: any) {
  dialogTitle.value = '修改登录密码'
  dialogType.value = 'password'
  passwordForm.value = {
    user_id: row.id,
    new_password: '',
    confirm_password: '',
  }
  dialogVisible.value = true
}

function onChangeFundingPassword(row: any) {
  dialogTitle.value = '修改资金密码'
  dialogType.value = 'funding'
  fundingForm.value = {
    user_id: row.id,
    new_funding_password: '',
    confirm_funding_password: '',
  }
  dialogVisible.value = true
}

function onToggleStatus(row: any) {
  const action = row.status === 1 ? '禁用' : '启用'
  ElMessageBox.confirm(`确认${action}用户「${row.nickname}」吗？`, '确认信息').then(() => {
    apiUser.toggleUserStatus({ user_id: row.id }).then(() => {
      getDataList()
      ElMessage.success(`${action}成功`)
    })
  }).catch(() => { })
}

function onResetTwoAuth(row: any) {
  ElMessageBox.confirm(`确认重置用户「${row.nickname}」的两步验证吗？`, '确认信息').then(() => {
    apiUser.resetTwoAuth({ user_id: row.id }).then(() => {
      getDataList()
      ElMessage.success('重置成功')
    })
  }).catch(() => { })
}

function onBatchToggleStatus(status: number) {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(`确认批量${action}选中的用户吗？`, '确认信息').then(() => {
    const userIds: any[] = []
    batch.value.selectionDataList.forEach((item) => {
      userIds.push(item.id)
    })
    apiUser.batchToggleUserStatus({ user_ids: userIds, status }).then(() => {
      getDataList()
      ElMessage.success(`批量${action}成功`)
    })
  }).catch(() => { })
}

// 获取状态类型
function getStatusType(status: number) {
  return status === 1 ? 'success' : 'danger'
}

// 获取状态文本
function getStatusText(status: number) {
  return status === 1 ? '正常' : '禁用'
}

// 获取两步验证状态
function getTwoAuthText(twoAuth: number) {
  return twoAuth === 1 ? '已开启' : '未开启'
}

function getTwoAuthType(twoAuth: number) {
  return twoAuth === 1 ? 'success' : 'info'
}

// 处理对话框确认
function handleDialogConfirm() {
  if (dialogType.value === 'password') {
    handlePasswordSubmit()
  }
  else if (dialogType.value === 'funding') {
    handleFundingSubmit()
  }
}

function handlePasswordSubmit() {
  if (!passwordForm.value.new_password || !passwordForm.value.confirm_password) {
    ElMessage.error('请填写新密码')
    return
  }

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  if (passwordForm.value.new_password.length < 6) {
    ElMessage.error('密码长度不能少于6位')
    return
  }

  apiUser.changeUserPassword(passwordForm.value).then(() => {
    ElMessage.success('密码修改成功')
    dialogVisible.value = false
    getDataList()
  })
}

function handleFundingSubmit() {
  if (!fundingForm.value.new_funding_password || !fundingForm.value.confirm_funding_password) {
    ElMessage.error('请填写新资金密码')
    return
  }

  if (fundingForm.value.new_funding_password !== fundingForm.value.confirm_funding_password) {
    ElMessage.error('两次输入的资金密码不一致')
    return
  }

  if (fundingForm.value.new_funding_password.length < 6) {
    ElMessage.error('资金密码长度不能少于6位')
    return
  }

  apiUser.changeFundingPassword(fundingForm.value).then(() => {
    ElMessage.success('资金密码修改成功')
    dialogVisible.value = false
    getDataList()
  })
}

function handleDialogClose() {
  dialogVisible.value = false
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="用户管理" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="邮箱">
              <ElInput
                v-model="search.username" placeholder="请输入邮箱，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
              />
            </ElFormItem>
            <ElFormItem label="昵称">
              <ElInput
                v-model="search.nickname" placeholder="请输入用户昵称，支持模糊查询" clearable @keydown.enter="currentChange()"
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
            <ElFormItem label="邀请人ID">
              <ElInput
                v-model="search.parent_id" placeholder="请输入邀请人ID" clearable @keydown.enter="currentChange()"
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
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ElButton v-if="batch.enable" size="default" :disabled="!batch.selectionDataList.length" @click="onBatchToggleStatus(1)">
            <template #icon>
              <FaIcon name="i-ep:check" />
            </template>
            批量启用
          </ElButton>
          <ElButton v-if="batch.enable" size="default" :disabled="!batch.selectionDataList.length" @click="onBatchToggleStatus(0)">
            <template #icon>
              <FaIcon name="i-ep:close" />
            </template>
            批量禁用
          </ElButton>
        </div>
      </div>
      <ElTable
        v-loading="loading" class="my-4" :data="dataList" height="100%" highlight-current-row border
        @sort-change="sortChange" @selection-change="batch.selectionDataList = $event"
      >
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="id" label="ID" min-width="60" header-align="center" align="center" />
        <ElTableColumn prop="username" label="邮箱" min-width="200" header-align="center" align="center" />
        <ElTableColumn prop="nickname" label="昵称" min-width="150" header-align="center" align="center" />
        <ElTableColumn prop="parent" label="邀请人" min-width="150" header-align="center" align="center">
          <template #default="scope">
            <span v-if="scope.row.parent">{{ scope.row.parent.nickname }} (ID: {{ scope.row.parent.id }})</span>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="invite_count" label="邀请人数" min-width="90" header-align="center" align="center">
          <template #default="scope">
            {{ scope.row.invite_count || 0 }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="two_auth" label="两步验证" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <ElTag :type="getTwoAuthType(scope.row.two_auth)" size="small">
              {{ getTwoAuthText(scope.row.two_auth) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" min-width="80" header-align="center" align="center">
          <template #default="scope">
            <ElTag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="注册时间" min-width="170" header-align="center" align="center" />
        <ElTableColumn prop="updated_at" label="更新时间" min-width="170" header-align="center" align="center" />

        <ElTableColumn label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <div class="flex flex-wrap items-center justify-center gap-1">
              <ElTooltip content="修改登录密码" placement="top">
                <ElButton type="warning" size="small" circle @click="onChangePassword(scope.row)">
                  <FaIcon name="i-ep:key" />
                </ElButton>
              </ElTooltip>

              <ElTooltip content="修改资金密码" placement="top">
                <ElButton type="info" size="small" circle @click="onChangeFundingPassword(scope.row)">
                  <FaIcon name="i-ep:wallet" />
                </ElButton>
              </ElTooltip>

              <ElTooltip :content="scope.row.status === 1 ? '禁用用户' : '启用用户'" placement="top">
                <ElButton
                  :type="scope.row.status === 1 ? 'warning' : 'success'"
                  size="small"
                  circle
                  @click="onToggleStatus(scope.row)"
                >
                  <FaIcon :name="scope.row.status === 1 ? 'i-ep:close' : 'i-ep:check'" />
                </ElButton>
              </ElTooltip>

              <ElTooltip v-if="scope.row.two_auth === 1" content="重置两步验证" placement="top">
                <ElButton type="danger" size="small" circle @click="onResetTwoAuth(scope.row)">
                  <FaIcon name="i-ep:refresh" />
                </ElButton>
              </ElTooltip>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size"
        :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination"
        background @size-change="sizeChange" @current-change="currentChange"
      />
    </FaPageMain>

    <!-- 密码修改对话框 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <!-- 修改登录密码表单 -->
      <ElForm v-if="dialogType === 'password'" :model="passwordForm" label-width="100px">
        <ElFormItem label="新密码" required>
          <ElInput v-model="passwordForm.new_password" type="password" placeholder="请输入新密码" />
        </ElFormItem>
        <ElFormItem label="确认密码" required>
          <ElInput v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码" />
        </ElFormItem>
      </ElForm>

      <!-- 修改资金密码表单 -->
      <ElForm v-else-if="dialogType === 'funding'" :model="fundingForm" label-width="100px">
        <ElFormItem label="新资金密码" required>
          <ElInput v-model="fundingForm.new_funding_password" type="password" placeholder="请输入新资金密码" />
        </ElFormItem>
        <ElFormItem label="确认密码" required>
          <ElInput v-model="fundingForm.confirm_funding_password" type="password" placeholder="请再次输入新资金密码" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="handleDialogClose">取消</ElButton>
          <ElButton type="primary" @click="handleDialogConfirm">确定</ElButton>
        </span>
      </template>
    </ElDialog>
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
