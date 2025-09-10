<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import apiSetting from '@/api/modules/setting'
import eventBus from '@/utils/eventBus'

defineOptions({
  name: 'BackendManageBalanceList',
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

// 搜索
const searchDefault = {
  content: '',
}
const search = ref({ ...searchDefault })

const type = ref('balance')
const typeList = ref([
  {
    label: '我的钱包',
    value: 'balance',
  },
  {
    label: '冻结钱包',
    value: 'freeze',
  },
])

const balanceTotal = ref({
  balance: 0,
  balanceFrozen: 0,
})
function searchReset() {
  Object.assign(search.value, searchDefault)
}

// 批量操作
const batch = ref({
  enable: false,
  selectionDataList: [],
})

// 列表
const loading = ref(false)
const dataList = ref([])

onMounted(() => {
  getDataList()
  apiSetting.getBalanceTotal({}).then((res: any) => {
    balanceTotal.value.balance = Number.parseFloat(res.data.balance)
    balanceTotal.value.balanceFrozen = Number.parseFloat(res.data.balanceFrozen)
  })
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
    ...(search.value.content && { content: search.value.content }),
  }
  if (type.value === 'balance') {
    apiSetting.getBalanceList(params).then((res: any) => {
      dataList.value = res.data.list
      pagination.value.total = res.data.total
    }).finally(() => {
      loading.value = false
    })
  }
  else {
    apiSetting.getBalanceFrozenList(params).then((res: any) => {
      dataList.value = res.data.list
      pagination.value.total = res.data.total
    }).finally(() => {
      loading.value = false
    })
  }
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
</script>

<template>
  <div :class="{ 'absolute-container': tableAutoHeight }">
    <FaPageHeader title="余额管理" class="mb-0" />
    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex-1 flex flex-col overflow-auto': tableAutoHeight }"
    >
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <ElForm :model="search" size="default" label-width="100px" inline-message inline class="search-form">
            <ElFormItem label="明细">
              <ElInput
                v-model="search.content" placeholder="请输入明细内容，支持模糊查询" clearable @keydown.enter="currentChange()"
                @clear="currentChange()"
              />
            </ElFormItem>
            <ElFormItem label="类型">
              <ElSelect v-model="type" placeholder="请选择类型" clearable @change="currentChange()">
                <ElOption v-for="item in typeList" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
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
      <!--      <ElSpace wrap> -->
      <!--        <ElButton type="primary" size="default" @click="onCreate"> -->
      <!--          <template #icon> -->
      <!--            <FaIcon name="i-ep:plus" /> -->
      <!--          </template> -->
      <!--          新增日志 -->
      <!--        </ElButton> -->
      <!--        <ElButton v-if="batch.enable" size="default" :disabled="!batch.selectionDataList.length" @click="onDelBatch"> -->
      <!--          删除 -->
      <!--        </ElButton> -->
      <!--        <ElButtonGroup v-if="batch.enable"> -->
      <!--          <ElButton size="default" :disabled="!batch.selectionDataList.length" @click="onDelBatch"> -->
      <!--            冻结 -->
      <!--          </ElButton> -->
      <!--          <ElButton size="default" :disabled="!batch.selectionDataList.length" @click="onRecoveryBatch"> -->
      <!--            恢复 -->
      <!--          </ElButton> -->
      <!--        </ElButtonGroup> -->
      <!--      </ElSpace> -->
      <div class="balance-mini-cards">
        <div class="available mini-card">
          <FaIcon name="i-ep:wallet" class="mini-card-icon" />
          <span class="mini-card-label">可用余额:</span>
          <span class="mini-card-value">
            <FaCountTo :start-val="0" :end-val="balanceTotal.balance" :duration="2000" prefix="$" />
          </span>
        </div>

        <div class="mini-card frozen">
          <FaIcon name="ep:lock" class="mini-card-icon" />
          <span class="mini-card-label">冻结余额:</span>
          <span class="mini-card-value">
            <FaCountTo :start-val="0" :end-val="balanceTotal.balanceFrozen" :duration="2000" prefix="$" />
          </span>
        </div>
      </div>
      <ElTable
        v-loading="loading" class="my-4" :data="dataList" stripe highlight-current-row border height="100%"
        @sort-change="sortChange" @selection-change="batch.selectionDataList = $event"
      >
        <ElTableColumn v-if="batch.enable" type="selection" align="center" fixed />
        <ElTableColumn prop="merName" label="商户" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="adminName" label="员工" min-width="120" header-align="center" align="center" />
        <ElTableColumn v-if="type === 'balance'" prop="historyMoney" label="历史余额" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="money" label="钱包变化" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <span :class="{ 'text-red-500': scope.row.money < 0, 'text-green-500': scope.row.money > 0 }">
              {{ scope.row.money > 0 ? `+${scope.row.money}` : scope.row.money }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="type === 'freeze'" prop="status" label="状态" min-width="120" header-align="center" align="center">
          <template #default="scope">
            <ElTag :type="scope.row.statusClass">
              {{ scope.row.statusName }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn v-if="type === 'balance'" prop="afterMoney" label="变化后余额" min-width="120" header-align="center" align="center" />
        <ElTableColumn prop="remark" label="明细" min-width="250" header-align="center" align="center" />
        <ElTableColumn prop="createdAt" label="变更时间" min-width="120" header-align="center" align="center" />
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

.balance-mini-cards {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.mini-card {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 4%);
}

.mini-card.available {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.mini-card.frozen {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
}

.mini-card-icon {
  margin-right: 8px;
  font-size: 20px;
}

.mini-card-label {
  margin-right: 8px;
  font-size: 13px;
  color: #606266;
}

.mini-card-value {
  font-size: 14px;
  font-weight: 600;
}

.mini-card.available .mini-card-value {
  color: #67c23a;
}

.mini-card.frozen .mini-card-value {
  color: #e6a23c;
}
</style>
