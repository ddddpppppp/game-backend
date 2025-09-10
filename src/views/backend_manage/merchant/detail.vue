<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { inject } from 'vue'
import apiAdmin from '@/api/modules/admin'
import apiSetting from '@/api/modules/setting'
import ImageUpload from '@/components/ImageUpload/index.vue'
import eventBus from '@/utils/eventBus'

defineOptions({
  name: 'BackendManageMerchantDetail',
})

const route = useRoute()
const router = useRouter()

const uploadFileAction = String(inject('uploadFileAction'))
const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const btnDisabled = ref<boolean>(false)
// 创建初始表单状态的函数
function createInitialFormState() {
  return {
    id: route.params.id as string,
    avatar: '',
    name: '',
    username: '',
    password: '',
    ipWhiteList: '',
    accessList: [] as string[],
    takeoutRate: 0,
    walletFreezeDays: '',
    paymentChannelIds: [] as string[],
    copyMerTakeoutId: '',
  }
}

const form = ref(createInitialFormState())
const merchantList = ref<any[]>([])
let usernameDisabled = false
const formRules = ref<FormRules>({
  avatar: [
    { required: true, message: '请上传头像', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入商户昵称', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入商户账号', trigger: 'blur' },
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
  const id = route.params.id as string
  apiAdmin.getAllMerchant({}).then((res: any) => {
    if (res.status === 1) {
      merchantList.value = res.data.list
    }
  })
  if (id && id !== '0') {
    usernameDisabled = true
    loading.value = true
    apiSetting.getMerchant({ id }).then((res: any) => {
      if (res.status === 1) {
        if (res.data.merchant) {
          form.value = res.data.merchant
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
  router.push({ name: 'backendManageMerchant' })
}

function submit() {
  return new Promise<void>((resolve, reject) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        btnDisabled.value = true
        loading.value = true
        apiSetting.editMerchant({ form: form.value }).then((res: any) => {
          if (res.status === 1) {
            ElMessage.success({
              message: res.statusText,
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
    <FaPageHeader :title="!parseInt(route.params.id as string) ? '新增商户' : '编辑商户'">
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
                <ImageUpload
                  v-model="form.avatar" name="file" :width="150" :height="150" :action="uploadFileAction"
                  @on-success="onUpdateAvatar"
                />
              </ElFormItem>
              <ElFormItem label="名称" prop="name">
                <ElInput v-model="form.name" placeholder="请输入商户名称" />
              </ElFormItem>
              <ElFormItem label="登录账号" prop="username">
                <ElInput v-model="form.username" placeholder="请输入登录账号" :disabled="usernameDisabled" />
              </ElFormItem>
              <ElFormItem label="登录密码" prop="password">
                <ElInput v-model="form.password" placeholder="请输入登录密码，不输入就不更改密码" />
              </ElFormItem>
              <ElFormItem label="ip白名单" prop="ipWhiteList">
                <ElInput v-model="form.ipWhiteList" placeholder="请输入ip白名单，多个ip用,分隔" />
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
