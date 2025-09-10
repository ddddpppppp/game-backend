<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import apiSetting from '@/api/modules/setting'
import eventBus from '@/utils/eventBus'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({
  name: 'BackendManageRoleList',
})

const router = useRouter()
const { pagination, getParams, onSizeChange, onCurrentChange, onSortChange } = usePagination()

// 表格是否自适应高度
const tableAutoHeight = ref(false)

/**
 * 详情展示模式
 * router 路由跳转
 * dialog 对话框
 * drawer 抽屉
 */
const formMode = ref<'router' | 'dialog' | 'drawer'>('router')

// 搜索
const searchDefault = {
  name: '',
}
const search = ref({ ...searchDefault })
function searchReset() {
  Object.assign(search.value, searchDefault)
}

// 批量操作
const batch = ref({
  enable: true,
  selectionDataList: [{ id: 1, name: '测试' }],
})

// 列表
const loading = ref(false)
const dataList = ref([])

onMounted(() => {
  getDataList()
  if (formMode.value === 'router') {
    eventBus.on('get-data-list', () => {
      getDataList()
    })
  }
})

onBeforeUnmount(() => {
  if (formMode.value === 'router') {
    eventBus.off('get-data-list')
  }
})

function getDataList() {
  loading.value = true
  const params = {
    ...getParams(),
    ...(search.value.name && { name: search.value.name }),
  }
  apiSetting.getRoleList(params).then((res: any) => {
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

function onCreate() {
  router.push({
    name: 'backendManageRoleDetail',
    params: {
      id: 0,
    },
  })
}

function onEdit(row: any) {
  router.push({
    name: 'backendManageRoleDetail',
    params: {
      id: row.id,
    },
  })
}

function onDel(row: any) {
  ElMessageBox.confirm(`确认删除「${row.name}」吗？`, '确认信息').then(() => {
    apiSetting.delRole({ id: row.id }).then(() => {
      getDataList()
      ElMessage.success({
        message: '删除成功',
        center: true,
      })
    })
  }).catch(() => {})
}

function onDelBatch() {
  ElMessageBox.confirm(`确认批量删除吗？`, '确认信息').then(() => {
    const ids: any[] = []
    batch.value.selectionDataList.forEach((item) => {
      ids.push(item.id)
    })
    apiSetting.delRole({ ids }).then(() => {
      getDataList()
      ElMessage.success({
        message: '删除成功',
        center: true,
      })
    })
  }).catch(() => {})
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="角色管理" class="mb-0" />
    <FaPageMain :class="{ 'flex-1 overflow-auto': tableAutoHeight }" :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="名称">
              <ElInput v-model="search.name" placeholder="请输入角色名称，支持模糊查询" clearable @keydown.enter="currentChange()" @clear="currentChange()" />
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
                  <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top' " />
                </template>
                {{ fold ? '展开' : '收起' }}
              </ElButton>
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>
      <ElDivider border-style="dashed" />
      <ElSpace wrap>
        <ElButton type="primary" size="default" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增角色
        </ElButton>
        <ElButton v-if="batch.enable" size="default" :disabled="!batch.selectionDataList.length" @click="onDelBatch">
          删除
        </ElButton>
        <!--        <ElButtonGroup v-if="batch.enable"> -->
        <!--          <ElButton size="default" :disabled="!batch.selectionDataList.length"> -->
        <!--            批量操作按钮组1 -->
        <!--          </ElButton> -->
        <!--          <ElButton size="default" :disabled="!batch.selectionDataList.length"> -->
        <!--            删除 -->
        <!--          </ElButton> -->
        <!--        </ElButtonGroup> -->
      </ElSpace>
      <ElTable v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%" @sort-change="sortChange" @selection-change="batch.selectionDataList = $event">
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="name" label="名称" />
        <ElTableColumn prop="createdAt" label="生成时间" />
        <ElTableColumn prop="updatedAt" label="更新日期" />
        <ElTableColumn label="操作" width="250" align="center" fixed="right">
          <template #default="scope">
            <ElButton type="primary" size="small" plain @click="onEdit(scope.row)">
              编辑
            </ElButton>
            <ElButton type="danger" size="small" plain @click="onDel(scope.row)">
              删除
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
