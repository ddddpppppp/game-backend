<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import apiSetting from '@/api/modules/setting'
import { useFaModal } from '@/ui/components/FaModal'

defineOptions({
  name: 'BackendManageSystemSettingDetail',
})

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const formRef = useTemplateRef<FormInstance>('formRef')
const btnDisabled = ref<boolean>(false)

// 设置信息
const settingInfo = ref<any>({})

// 表单数据
const form = ref<any>({})

// 创建不同类型设置的表单规则
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}

  const settingName = route.params.name as string

  switch (settingName) {
    case 'usdt_recharge':
    case 'btc_recharge':
    case 'eth_recharge':
      rules.address = [{ required: true, message: '请输入钱包地址', trigger: 'blur' }]
      rules.qr_code = [{ required: true, message: '请上传二维码', trigger: 'blur' }]
      rules.min_amount = [{ required: true, message: '请输入最小金额', trigger: 'blur' }]
      rules.max_amount = [{ required: true, message: '请输入最大金额', trigger: 'blur' }]
      break
    case 'withdraw_setting':
      rules.min_amount = [{ required: true, message: '请输入最小提现金额', trigger: 'blur' }]
      rules.max_amount = [{ required: true, message: '请输入最大提现金额', trigger: 'blur' }]
      rules.daily_limit = [{ required: true, message: '请输入每日限额', trigger: 'blur' }]
      break
    case 'notification_setting':
      rules.admin_email = [
        { required: true, message: '请输入管理员邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
      ]
      break
    case 'security_setting':
      rules.login_attempts = [{ required: true, message: '请输入登录尝试次数', trigger: 'blur' }]
      rules.lockout_duration = [{ required: true, message: '请输入锁定时长', trigger: 'blur' }]
      rules.session_timeout = [{ required: true, message: '请输入会话超时时间', trigger: 'blur' }]
      break
  }

  return rules
})

// 监听路由参数变化
watch(() => route.params.name, (newName) => {
  if (newName) {
    getInfo()
  }
})

onMounted(() => {
  getInfo()
})

function getInfo() {
  const name = route.params.name as string
  if (!name) {
    router.push({ name: 'backendManageSystemSetting' })
    return
  }

  loading.value = true
  apiSetting.getSystemSetting({ name }).then((res: any) => {
    if (res.status === 1) {
      settingInfo.value = res.data.setting
      // 将配置数据复制到表单
      form.value = { ...res.data.setting.config }
    }
  }).catch((e) => {
    useFaModal().error({
      title: '提醒',
      content: e.statusText || '获取设置信息失败',
    })
  }).finally(() => {
    loading.value = false
  })
}

function onSubmit() {
  submit().then(() => {
    goBack()
  })
}

function onCancel() {
  goBack()
}

// 返回列表页
function goBack() {
  router.push({ name: 'backendManageSystemSetting' })
}

function submit() {
  return new Promise<void>((resolve, reject) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        btnDisabled.value = true
        loading.value = true

        const submitData = {
          form: {
            name: settingInfo.value.name,
            config: form.value,
          },
        }

        apiSetting.editSystemSetting(submitData).then((res: any) => {
          if (res.status === 1) {
            ElMessage.success({
              message: res.statusText || '保存成功',
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

// 获取设置类型标题
function getSettingTypeTitle() {
  const name = route.params.name as string
  const titles: Record<string, string> = {
    usdt_recharge: 'USDT充值设置',
    btc_recharge: 'BTC充值设置',
    eth_recharge: 'ETH充值设置',
    withdraw_setting: '提现设置',
    notification_setting: '通知设置',
    security_setting: '安全设置',
  }
  return titles[name] || '系统设置'
}

// 判断是否为充值设置
function isRechargeType() {
  const name = route.params.name as string
  return ['usdt_recharge', 'btc_recharge', 'eth_recharge'].includes(name)
}

// 判断是否为提现设置
function isWithdrawType() {
  return route.params.name === 'withdraw_setting'
}

// // 判断是否为通知设置
// function isNotificationType() {
//   return route.params.name === 'notification_setting'
// }

// // 判断是否为安全设置
// function isSecurityType() {
//   return route.params.name === 'security_setting'
// }
</script>

<template>
  <div>
    <FaPageHeader :title="`编辑${getSettingTypeTitle()}`">
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
            <ElForm ref="formRef" :model="form" :rules="formRules" label-width="150px" label-suffix="：">
              <!-- 充值设置表单 -->
              <template v-if="isRechargeType()">
                <ElFormItem label="最小充值金额" prop="min_amount">
                  <ElInputNumber v-model="form.min_amount" :min="0" :precision="4" placeholder="请输入最小充值金额" style="width: 100%" />
                </ElFormItem>
                <ElFormItem label="最大充值金额" prop="max_amount">
                  <ElInputNumber v-model="form.max_amount" :min="0" :precision="4" placeholder="请输入最大充值金额" style="width: 100%" />
                </ElFormItem>
                <ElFormItem label="USDT赠送比例" prop="usdt_gift_rate">
                  <ElInput v-model="form.usdt_gift_rate" :min="0" :max="100" :precision="2" placeholder="请输入USDT赠送比例（0-100之间）" style="width: 100%">
                    <template #append>
                      %
                    </template>
                  </ElInput>
                </ElFormItem>
                <ElFormItem label="CashApp赠送比例" prop="cashapp_gift_rate">
                  <ElInput v-model="form.cashapp_gift_rate" :min="0" :max="100" :precision="2" placeholder="请输入CashApp赠送比例（0-100之间）" style="width: 100%">
                    <template #append>
                      %
                    </template>
                  </ElInput>
                </ElFormItem>
              </template>

              <!-- 提现设置表单 -->
              <template v-if="isWithdrawType()">
                <ElFormItem label="最小提现金额" prop="min_amount">
                  <ElInputNumber v-model="form.min_amount" :min="0" :precision="2" placeholder="请输入最小提现金额" style="width: 100%" />
                </ElFormItem>
                <ElFormItem label="最大提现金额" prop="max_amount">
                  <ElInputNumber v-model="form.max_amount" :min="0" :precision="2" placeholder="请输入最大提现金额" style="width: 100%" />
                </ElFormItem>
                <ElFormItem label="提现手续费率" prop="fee_rate">
                  <ElInput v-model="form.fee_rate" :min="0" :max="100" :precision="2" placeholder="请输入手续费率（0-100之间）" style="width: 100%">
                    <template #append>
                      %
                    </template>
                  </ElInput>
                </ElFormItem>
                <ElFormItem label="每日提现次数限制" prop="daily_limit">
                  <ElInputNumber v-model="form.daily_limit" :min="1" placeholder="请输入每日提现次数限制" style="width: 100%" />
                </ElFormItem>
                <!-- <ElFormItem label="是否需要人工审核">
                  <ElSwitch v-model="form.review_required" />
                </ElFormItem> -->
              </template>
            </ElForm>
          </div>
        </ElCol>
      </ElRow>
    </FaPageMain>
    <FaFixedActionBar>
      <ElButton :disabled="btnDisabled" type="primary" size="large" @click="onSubmit">
        保存设置
      </ElButton>
      <ElButton size="large" @click="onCancel">
        取消
      </ElButton>
    </FaFixedActionBar>
  </div>
</template>

<style scoped>
:deep(.el-input-number) {
  width: 100%;
}
</style>
