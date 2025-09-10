<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import apiSetting from '@/api/modules/setting'
import eventBus from '@/utils/eventBus'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaymentChannelDetail from './detail.vue'

defineOptions({
  name: 'BackendManagePaymentList',
})

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

// 详情
const formModeProps = ref<{
  visible: boolean
  id: number
}>({
  visible: false,
  id: 0,
})
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
  selectionDataList: [
    {
      id: '',
    },
  ],
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
  apiSetting.getPaymentChannelList(params).then((res: any) => {
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

function onSet(row: any, field: string) {
  apiSetting.setPaymentChannel({ id: row.id, key: field, value: row[field] }).then(() => {
    getDataList()
  })
}

function onDel(row: any) {
  ElMessageBox.confirm(`确认冻结「${row.name}」吗？`, '确认信息').then(() => {
    apiSetting.disablePaymentChannel({ id: row.id }).then(() => {
      getDataList()
      ElMessage.success({
        message: '冻结成功',
        center: true,
      })
    })
  }).catch(() => { })
}

function onDelBatch() {
  ElMessageBox.confirm(`确认批量冻结吗？`, '确认信息').then(() => {
    const ids: any[] = []
    batch.value.selectionDataList.forEach((item) => {
      ids.push(item.id)
    })
    apiSetting.disablePaymentChannel({ ids }).then(() => {
      getDataList()
      ElMessage.success({
        message: '冻结成功',
        center: true,
      })
    })
  }).catch(() => { })
}

function onRecovery(row: any) {
  ElMessageBox.confirm(`确认恢复「${row.name}」吗？`, '确认信息').then(() => {
    apiSetting.enablePaymentChannel({ id: row.id }).then(() => {
      getDataList()
      ElMessage.success({
        message: '恢复成功',
        center: true,
      })
    })
  }).catch(() => { })
}

function onRecoveryBatch() {
  ElMessageBox.confirm(`确认批量恢复吗？`, '确认信息').then(() => {
    const ids: any[] = []
    batch.value.selectionDataList.forEach((item) => {
      ids.push(item.id)
    })
    apiSetting.enablePaymentChannel({ ids }).then(() => {
      getDataList()
      ElMessage.success({
        message: '恢复成功',
        center: true,
      })
    })
  }).catch(() => { })
}
function onCreate() {
  formModeProps.value.id = 0
  formModeProps.value.visible = true
}

function onEdit(row: any) {
  formModeProps.value.id = row.id
  formModeProps.value.visible = true
}
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="代收渠道管理" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="名称">
              <ElInput
                v-model="search.name" placeholder="请输入代收渠道名称，支持模糊查询" clearable @keydown.enter="currentChange()"
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
      <ElSpace wrap>
        <ElButton type="primary" size="default" @click="onCreate">
          <template #icon>
            <FaIcon name="i-ep:plus" />
          </template>
          新增代收渠道
        </ElButton>
        <!--        <ElButton v-if="batch.enable" size="default" :disabled="!batch.selectionDataList.length" @click="onDelBatch"> -->
        <!--          删除 -->
        <!--        </ElButton> -->
        <ElButtonGroup v-if="batch.enable">
          <ElButton size="default" :disabled="!batch.selectionDataList.length" @click="onDelBatch">
            冻结
          </ElButton>
          <ElButton size="default" :disabled="!batch.selectionDataList.length" @click="onRecoveryBatch">
            恢复
          </ElButton>
        </ElButtonGroup>
      </ElSpace>
      <ElTable
        v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%"
        @sort-change="sortChange" @selection-change="batch.selectionDataList = $event"
      >
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="name" label="名称" min-width="150" header-align="center" align="center" />
        <ElTableColumn prop="type" label="类型" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="rate" label="费率" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.rate" type="number" @change="onSet(scope.row, 'rate')">
              <template #suffix>
                %
              </template>
            </ElInput>
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="dayLimitMoney" label="日限额" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.dayLimitMoney" type="number" @change="onSet(scope.row, 'dayLimitMoney')" />
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="dayLimitCount" label="日限笔数" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.dayLimitCount" type="number" @change="onSet(scope.row, 'dayLimitCount')" />
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="chargeFee" label="手续费" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.chargeFee" type="number" @change="onSet(scope.row, 'chargeFee')" />
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="guarantee" label="保证金" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.guarantee" type="number" @change="onSet(scope.row, 'guarantee')">
              <template #suffix>
                %
              </template>
            </ElInput>
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="freezeTime" label="冻结日期" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.freezeTime" type="number" @change="onSet(scope.row, 'freezeTime')">
              <template #suffix>
                天
              </template>
            </ElInput>
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="countTime" label="结算日期" width="100" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.countTime" type="number" @change="onSet(scope.row, 'countTime')">
              <template #suffix>
                天
              </template>
            </ElInput>
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="sort" label="排序" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.sort" type="number" @change="onSet(scope.row, 'sort')" />
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" width="150" header-align="center" align="center">
          <template #default="scope">
            <ElInput v-if="scope.row.id > 0" v-model="scope.row.remark" @change="onSet(scope.row, 'remark')" />
            <span v-else>--</span>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="statusName" label="状态" header-align="center" align="center">
          <template #default="scope">
            <ElButton v-if="scope.row.id > 0" :type="scope.row.statusClass" size="small">
              {{ scope.row.statusName }}
            </ElButton>
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="orderCount" label="订单量" header-align="center" align="center" />
        <ElTableColumn prop="orderSuccessCount" label="成功量" header-align="center" align="center" />
        <ElTableColumn prop="orderAmount" label="订单金额" width="200" header-align="center" align="center" />
        <ElTableColumn prop="orderSuccessAmount" label="成功金额" width="200" header-align="center" align="center" />
        <ElTableColumn prop="orderSuccessRate" label="成功率" width="100" header-align="center" align="center" />

        <ElTableColumn label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.id > 0">
              <ElButton v-if="scope.row.status === 1" type="danger" size="small" plain @click="onDel(scope.row)">
                冻结
              </ElButton>
              <ElButton v-else type="primary" size="small" plain @click="onRecovery(scope.row)">
                恢复
              </ElButton>
              <ElButton type="primary" size="small" plain @click="onEdit(scope.row)">
                编辑
              </ElButton>
            </div>
            <span v-else>--</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        :current-page="pagination.page" :total="pagination.total" :page-size="pagination.size"
        :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" class="pagination"
        background @size-change="sizeChange" @current-change="currentChange"
      />
    </FaPageMain>
    <PaymentChannelDetail :id="formModeProps.id" v-model="formModeProps.visible" @success="getDataList" />
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
