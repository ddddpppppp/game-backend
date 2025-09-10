<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import apiSetting from '@/api/modules/setting'
import eventBus from '@/utils/eventBus'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BackendManageRoleDetail',
})

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const btnDisabled = ref<boolean>(false)

// 创建初始表单状态的函数
function createInitialFormState() {
  return {
    id: route.params.id as string,
    name: '',
    access: [] as string[],
  }
}

const form = ref(createInitialFormState())
const formRules = ref<FormRules>({
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
  ],
})

const routes = ref<any[]>([])

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  form.value.id = newId as string
  getInfo()
})

onMounted(() => {
  getInfo()
})

function getInfo() {
  loading.value = true
  apiSetting.getRole({ id: form.value.id }).then((res: any) => {
    if (res.status === 1) {
      if (res.data.role) {
        form.value = res.data.role
      }
      routes.value = res.data.routes
      checkAllChecked(null)
    }
  }).finally(() => {
    loading.value = false
  })
}

function checkAllChecked(deep: any) {
  for (let i = 0; i < routes.value.length; i++) {
    const item = routes.value[i]
    if (!item.children.length) {
      continue
    }
    let condition = true
    for (let j = 0; j < item.children.length; j++) {
      if (deep === 1) {
        routes.value[i].children[j].checked = !!item.checked
      }
      const v = item.children[j]
      if (!v.children.length) {
        break
      }
      let cond = true
      for (let k = 0; k < v.children.length; k++) {
        const vv = v.children[k]
        if (deep <= 2) {
          routes.value[i].children[j].children[k].checked = !!v.checked
        }
        if (!cond) {
          return
        }
        if (!vv.checked) {
          cond = false
          condition = false
        }
      }
      if (cond) {
        routes.value[i].children[j].checked = true
      }
      else {
        routes.value[i].children[j].checked = false
        condition = false
      }
    }
    routes.value[i].checked = condition
  }
}

function onSubmit() {
  submit().then(() => {
    eventBus.emit('get-data-list')
    goBack()
  })
}

function onCancel() {
  // 重置表单数据
  form.value = createInitialFormState()
  goBack()
}

// 返回列表页
function goBack() {
  router.push({ name: 'backendManageRole' })
}

function submit() {
  return new Promise<void>((resolve, reject) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        btnDisabled.value = true
        loading.value = true
        apiSetting.editRole({ form: form.value, routes: routes.value }).then((res: any) => {
          if (res.status === 1) {
            ElMessage.success({
              message: res.statusText,
              center: true,
            })
          }
          resolve()
        }).finally(() => {
          btnDisabled.value = false
          loading.value = false
        })
      }
      else {
        reject(new Error('请检查输入内容'))
      }
    })
  })
}
</script>

<template>
  <div>
    <FaPageHeader :title="!parseInt(route.params.id as string) ? '新增角色' : '编辑角色'">
      <ElButton size="default" round @click="goBack">
        <template #icon>
          <FaIcon name="i-ep:arrow-left" />
        </template>
        返回
      </ElButton>
    </FaPageHeader>
    <FaPageMain>
      <ElRow type="flex" justify="center">
        <ElCol :md="24" :lg="16">
          <div v-loading="loading">
            <ElForm ref="formRef" :model="form" :rules="formRules" label-width="120px" label-suffix="：">
              <ElFormItem label="名称" prop="name">
                <ElInput v-model="form.name" placeholder="请输入角色名称" />
              </ElFormItem>
              <ElFormItem label="权限">
                <ElTable :data="routes" stripe highlight-current-row default-expand-all border :style="{ lineHeight: 'normal' }">
                  <ElTableColumn width="300" label="模块">
                    <template #default="{ row }">
                      {{ row.name }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="权限">
                    <template #default="{ row }">
                      <ElCheckbox v-if="row.children" :key="row.value" v-model="row.checked" @change="checkAllChecked(1)">
                        全选
                      </ElCheckbox>
                      <div v-for="auth in row.children" :key="auth.name" class="ml-4 mt-1">
                        <ElCheckbox :key="auth.name" v-model="auth.checked" @change="checkAllChecked(2)">
                          {{ auth.name }}
                        </ElCheckbox>
                        <div class="ml-4">
                          <ElCheckbox v-for="vv in auth.children" :key="vv.name" v-model="vv.checked" @change="checkAllChecked(3)">
                            {{ vv.name }}
                          </ElCheckbox>
                        </div>
                      </div>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </ElFormItem>
            </ElForm>
          </div>
        </ElCol>
      </ElRow>
    </FaPageMain>
    <FaFixedActionBar>
      <ElButton type="primary" :disabled="btnDisabled" size="large" @click="onSubmit">
        提交
      </ElButton>
      <ElButton size="large" @click="onCancel">
        取消
      </ElButton>
    </FaFixedActionBar>
  </div>
</template>
