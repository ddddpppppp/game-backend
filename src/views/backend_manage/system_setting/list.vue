<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import apiSetting from '@/api/modules/setting'

defineOptions({
  name: 'BackendManageSystemSettingList',
})

const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

// 搜索
const searchDefault = {
  name: '',
}
const search = ref({ ...searchDefault })
function searchReset() {
  Object.assign(search.value, searchDefault)
}

// 列表
const loading = ref(false)
const dataList = ref([])

onMounted(() => {
  getDataList()
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.name && { name: search.value.name }),
  }
  apiSetting.getSystemSettingList(params).then((res: any) => {
    loading.value = false
    dataList.value = res.data.list
    pagination.value.total = res.data.total
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

function onEdit(row: any) {
  router.push({
    name: 'backendManageSystemSettingDetail',
    params: {
      name: row.name,
    },
  })
}

function getStatusType(status: number) {
  return status === 1 ? 'success' : 'danger'
}

function getStatusText(status: number) {
  return status === 1 ? '启用' : '禁用'
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="系统设置" class="mb-0" />
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="名称">
              <ElInput v-model="search.name" placeholder="请输入设置名称，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
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
              <ElButton disabled link @click="toggle">
                <template #icon>
                  <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top' " />
                </template>
                {{ fold ? '展开' : '收起' }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>
      <ElDivider border-style="dashed" />

      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange">
        <ElTableColumn prop="title" label="设置名称" min-width="150" header-align="center" align="left" />
        <ElTableColumn prop="description" label="描述" min-width="200" header-align="center" align="left" />
        <ElTableColumn prop="name" label="标识符" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="status" label="状态" min-width="80" header-align="center" align="center">
          <template #default="scope">
            <ElTag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="sort" label="排序" min-width="80" header-align="center" align="center" />
        <ElTableColumn prop="updatedAt" label="更新时间" min-width="180" header-align="center" align="center" />

        <ElTableColumn label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <ElButton type="primary" size="small" plain @click="onEdit(scope.row)">
              编辑
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination" background @size-change="sizeChange" @current-change="currentChange" />
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
