<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ref, useTemplateRef, watch } from 'vue'
import apiSetting from '@/api/modules/setting'

export interface Props {
  id?: number | string
}
const props = withDefaults(
  defineProps<Props>(),
  {
    id: '',
  },
)

const emits = defineEmits<{
  success: []
}>()

const btnDisabled = ref(false)

const visible = defineModel<boolean>({
  default: false,
})

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')

// 创建初始表单状态的函数
function createInitialFormState() {
  return {
    id: props.id,
    name: '',
    type: '',
    isBackup: -1,
    params: '',
  }
}

const form = ref(createInitialFormState())

const formRules = ref<FormRules>({
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' },
  ],
  isBackup: [
    { required: true, message: '请选择是否备用', trigger: 'change' },
  ],
  params: [
    { required: true, message: '请输入参数', trigger: 'blur' },
  ],
})

// 监听对话框显示状态，当显示时重新加载数据
watch(() => visible.value, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      // 重置表单为初始状态，然后加载数据
      form.value = createInitialFormState()
      getInfo()
    })
  }
})

onMounted(() => {
  getInfo()
})

function getInfo() {
  if (props.id && props.id !== '') {
    loading.value = true
    apiSetting.getPaymentChannel({ id: props.id }).then((res: any) => {
      loading.value = false
      if (res.status === 1) {
        form.value = res.data.payment
      }
    })
  }
}

function onSubmit() {
  submit().then(() => {
    emits('success')
    onCancel()
  })
}

function onCancel() {
  // 重置表单数据为初始状态
  form.value = createInitialFormState()
  visible.value = false
}

function submit() {
  return new Promise<void>((resolve, reject) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        btnDisabled.value = true
        loading.value = true
        apiSetting.editPaymentChannel({ form: form.value }).then((res: any) => {
          if (res.status === 1) {
            ElMessage.success({
              message: res.statusText,
            })
          }
          resolve()
        }).finally(() => {
          loading.value = false
          btnDisabled.value = false
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
    <el-dialog
      v-model="visible"
      width="700px"
      :title="id ? '编辑支付渠道' : '新增支付渠道'"
      :close-on-click-modal="true"
      destroy-on-close
      class="conversation-drawer"
    >
      <div v-loading="loading" class="setting-payment-main">
        <ElForm ref="formRef" :model="form" :rules="formRules" label-width="120px" label-suffix="：">
          <ElFormItem label="名称" prop="name">
            <ElInput v-model="form.name" placeholder="请输入名称" />
          </ElFormItem>
          <ElFormItem label="类型" prop="type">
            <ElSelect v-model="form.type" placeholder="请选择类型" clearable>
              <ElOption label="cashapp" value="cashapp" />
              <ElOption label="paypal" value="paypal" />
              <ElOption label="usdt" value="usdt" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="是否备用" prop="isBackup">
            <ElSelect v-model="form.isBackup" placeholder="请选择是否备用" clearable>
              <ElOption label="是" :value="1" />
              <ElOption label="否" :value="-1" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="参数" prop="params">
            <ElInput v-model="form.params" placeholder="请输入参数" type="textarea" :rows="4" />
          </ElFormItem>
        </ElForm>
      </div>

      <div class="buttons">
        <ElButton size="large" @click="onCancel">
          取消
        </ElButton>
        <ElButton type="primary" size="large" :disabled="btnDisabled" @click="onSubmit">
          提交
        </ElButton>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.setting-payment-main {
  margin-top: 20px;
}
</style>
