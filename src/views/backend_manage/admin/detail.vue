<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import apiAdmin from '@/api/modules/admin'
import apiSetting from '@/api/modules/setting'
import ImageUpload from '@/components/ImageUpload/index.vue'
import { useFaModal } from '@/ui/components/FaModal'
import eventBus from '@/utils/eventBus'
import { ElMessage } from 'element-plus'
import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({
  name: 'BackendManageAdminDetail',
})

const route = useRoute()
const router = useRouter()

const uploadFileAction = String(inject('uploadFileAction'))
const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const btnDisabled = ref<boolean>(false)
const takeout = ref(false)

// 创建初始表单状态的函数
function createInitialFormState() {
  return {
    id: route.params.id as string,
    avatar: '',
    nickname: '',
    username: '',
    password: '',
    roleId: 0,
    takeoutRate: '',
  }
}
const takeoutRatePlaceholder = ref(0)
const form = ref(createInitialFormState())
const roleList = ref([{ id: 0, name: '请选择角色' }])
let usernameDisabled = false
const formRules = ref<FormRules>({
  avatar: [
    { required: true, message: '请上传头像', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入管理员昵称', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'blur' },
  ],
})

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
  apiAdmin.getAllRole({}).then((res) => {
    if (res.status === 1) {
      if (res.data.list) {
        roleList.value = res.data.list
      }
      if (res.data.takeout) {
        takeout.value = true
        apiAdmin.getMyTakeoutRate({}).then((res) => {
          if (res.status === 1) {
            takeoutRatePlaceholder.value = res.data.rate
          }
        })
      }
    }
  }).catch((e) => {
    useFaModal().error({
      title: '提醒',
      content: e.statusText,
    })
  }).finally(() => {
    loading.value = false
  })
  const id = route.params.id as string
  if (id && id !== '0') {
    usernameDisabled = true
    apiSetting.getAdmin({ id }).then((res: any) => {
      if (res.status === 1) {
        if (res.data.admin) {
          form.value = res.data.admin
        }
      }
    }).finally(() => {
      loading.value = false
    })
  }
}

function onUpdateAvatar(res: any) {
  form.value.avatar = res.data.url
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
  router.push({ name: 'backendManageAdmin' })
}

function submit() {
  return new Promise<void>((resolve, reject) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        if (takeout.value) {
          if (Number(form.value.takeoutRate) > takeoutRatePlaceholder.value) {
            ElMessage.error({
              message: `抽成点位不能超过${takeoutRatePlaceholder.value}点`,
              center: true,
            })
            reject(new Error(`抽成点位不能超过${takeoutRatePlaceholder.value}点`))
          }
        }
        btnDisabled.value = true
        loading.value = true
        apiSetting.editAdmin({ form: form.value }).then((res: any) => {
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
    <FaPageHeader :title="!parseInt(route.params.id as string) ? '新增员工' : '编辑员工'">
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
              <ElFormItem label="头像" prop="avatar">
                <ImageUpload v-model="form.avatar" name="file" :width="150" :height="150" :action="uploadFileAction" @on-success="onUpdateAvatar" />
              </ElFormItem>
              <ElFormItem label="昵称" prop="nickname">
                <ElInput v-model="form.nickname" placeholder="请输入管理员名称" />
              </ElFormItem>
              <ElFormItem label="登录账号" prop="username">
                <ElInput v-model="form.username" placeholder="请输入登录账号" :disabled="usernameDisabled" />
              </ElFormItem>
              <ElFormItem label="登录密码" prop="password">
                <ElInput v-model="form.password" placeholder="请输入登录密码，不输入就不更改密码" />
              </ElFormItem>
              <ElFormItem label="角色" prop="roleId">
                <el-radio-group v-model="form.roleId">
                  <el-radio v-for="(role, index) in roleList" :key="index" :value="role.id">
                    {{ role.name }}
                  </el-radio>
                </el-radio-group>
              </ElFormItem>
              <ElFormItem v-if="takeout" label="外卖代理抽成">
                <ElInput v-model="form.takeoutRate" :placeholder="`请输入抽成点位，不超过${takeoutRatePlaceholder}`" />
              </ElFormItem>
            </ElForm>
          </div>
        </ElCol>
      </ElRow>
    </FaPageMain>
    <FaFixedActionBar>
      <ElButton :disabled="btnDisabled" type="primary" size="large" @click="onSubmit">
        提交
      </ElButton>
      <ElButton size="large" @click="onCancel">
        取消
      </ElButton>
    </FaFixedActionBar>
  </div>
</template>
