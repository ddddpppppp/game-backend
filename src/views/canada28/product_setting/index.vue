<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import apiCanada from '@/api/modules/canada'

defineOptions({
  name: 'Canada28ProductSetting',
})

const { pagination } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

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
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

// 编辑对话框
const editDialogVisible = ref(false)
const editForm = ref({
  id: 0,
  type_name: '',
  description: '',
  odds: 0,
  status: 1,
})

onMounted(() => {
  getDataList()
})

function getDataList() {
  loading.value = true
  apiCanada.getBetTypesList().then((res: any) => {
    loading.value = false
    dataList.value = res.data.list || []
    pagination.value.total = res.data.total || 0
  }).catch(() => {
    loading.value = false
  })
}

// 编辑玩法
function onEdit(row: any) {
  editForm.value = {
    id: row.id,
    type_name: row.type_name,
    description: row.description,
    odds: row.odds,
    status: row.status,
  }
  editDialogVisible.value = true
}

// 保存编辑
function handleEditSave() {
  if (!editForm.value.odds || editForm.value.odds <= 0) {
    ElMessage.error('请输入正确的赔率')
    return
  }

  apiCanada.updateBetType(editForm.value).then(() => {
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    getDataList()
  }).catch((error) => {
    ElMessage.error(error.message || '更新失败')
  })
}

// 切换单个状态
function onToggleStatus(row: any) {
  const action = row.status === 1 ? '禁用' : '启用'
  ElMessageBox.confirm(`确认${action}玩法「${row.type_name}」吗？`, '确认信息').then(() => {
    const data = {
      id: row.id,
      odds: row.odds,
      status: row.status === 1 ? 0 : 1,
    }
    apiCanada.updateBetType(data).then(() => {
      getDataList()
      ElMessage.success(`${action}成功`)
    })
  }).catch(() => { })
}

// 批量操作
function onBatchToggleStatus(status: number) {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(`确认批量${action}选中的玩法吗？`, '确认信息').then(() => {
    const ids: any[] = []
    batch.value.selectionDataList.forEach((item) => {
      ids.push(item.id)
    })
    apiCanada.batchUpdateStatus({ ids, status }).then(() => {
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
  return status === 1 ? '启用' : '禁用'
}

// 关闭编辑对话框
function handleEditClose() {
  editDialogVisible.value = false
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="加拿大28玩法设置" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <div class="mb-4 flex items-center justify-between">
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
        v-loading="loading"
        class="my-4"
        :data="dataList"
        height="100%"
        highlight-current-row
        border
        @selection-change="batch.selectionDataList = $event"
      >
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="sort" label="排序" min-width="60" header-align="center" align="center" />
        <ElTableColumn prop="type_name" label="玩法名称" min-width="150" header-align="center" align="center" />
        <ElTableColumn prop="type_key" label="玩法标识" min-width="150" header-align="center" align="center" />
        <ElTableColumn prop="description" label="玩法描述" min-width="200" header-align="center" align="center" />
        <ElTableColumn prop="odds" label="赔率倍数" min-width="100" header-align="center" align="center">
          <template #default="scope">
            <ElTag type="info">
              {{ scope.row.odds }}x
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
        <ElTableColumn prop="updated_at" label="更新时间" min-width="170" header-align="center" align="center" />

        <ElTableColumn label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <div class="flex flex-wrap items-center justify-center gap-1">
              <ElTooltip content="编辑" placement="top">
                <ElButton type="primary" size="small" circle @click="onEdit(scope.row)">
                  <FaIcon name="i-ep:edit" />
                </ElButton>
              </ElTooltip>

              <ElTooltip :content="scope.row.status === 1 ? '禁用' : '启用'" placement="top">
                <ElButton
                  :type="scope.row.status === 1 ? 'warning' : 'success'"
                  size="small"
                  circle
                  @click="onToggleStatus(scope.row)"
                >
                  <FaIcon :name="scope.row.status === 1 ? 'i-ep:close' : 'i-ep:check'" />
                </ElButton>
              </ElTooltip>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </FaPageMain>

    <!-- 编辑对话框 -->
    <ElDialog
      v-model="editDialogVisible"
      title="编辑玩法配置"
      width="500px"
      :close-on-click-modal="false"
      @close="handleEditClose"
    >
      <ElForm :model="editForm" label-width="100px">
        <ElFormItem label="玩法名称">
          <ElInput v-model="editForm.type_name" disabled />
        </ElFormItem>
        <ElFormItem label="玩法描述">
          <ElInput v-model="editForm.description" disabled />
        </ElFormItem>
        <ElFormItem label="赔率倍数" required>
          <ElInputNumber
            v-model="editForm.odds"
            :min="0.01"
            :precision="2"
            :step="0.1"
            placeholder="请输入赔率倍数"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="editForm.status" placeholder="请选择状态">
            <ElOption
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="handleEditClose">取消</ElButton>
          <ElButton type="primary" @click="handleEditSave">保存</ElButton>
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
</style>
