<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import ImageUpload from '@/components/ImageUpload/index.vue'
import useUserStore from '@/store/modules/user'
import { FormField, FormItem } from '@/ui/shadcn/ui/form'
import { inject } from 'vue'

defineOptions({
  name: 'EditInfoForm',
})

const userStore = useUserStore()

const loading = ref(false)

const uploadFileAction = String(inject('uploadFileAction'))

const formRef = useTemplateRef<FormInstance>('formRef')

const form = ref({
  avatar: '',
  nickname: '',
})

onMounted(() => {
  form.value.avatar = userStore.avatar
  form.value.nickname = userStore.account
})

function onUpdateAvatar(res: any) {
  form.value.avatar = res.data.url
}

function onSubmit() {
  formRef.value?.validate((valid) => {
    if (valid) {
      loading.value = true
      userStore.editInfo(form.value).then(async () => {
        // toast.success('修改成功')
      }).finally(() => {
        loading.value = false
      })
    }
  })
}
</script>

<template>
  <div class="w-full flex-col-stretch-center">
    <!--    <div class="mb-6 space-y-2"> -->
    <!--      <h3 class="text-4xl color-[var(&#45;&#45;el-text-color-primary)] font-bold"> -->
    <!--        {{ t('intro') }} -->
    <!--      </h3> -->
    <!--      <p class="text-sm text-muted-foreground lg:text-base"> -->
    <!--        {{ t('subIntro') }} -->
    <!--      </p> -->
    <!--    </div> -->
    <ElForm ref="formRef" :model="form">
      <FormField name="password">
        <FormItem class="relative pb-6 space-y-0">
          <ImageUpload v-model="form.avatar" name="file" :width="150" :height="150" :action="uploadFileAction" @on-success="onUpdateAvatar" />
        </FormItem>
      </FormField>
      <FormField name="password">
        <FormItem class="relative pb-6 space-y-0">
          <FaInput v-model="form.nickname" type="text" placeholder="请输入你的昵称" class="w-full" />
        </FormItem>
      </FormField>
      <FaButton :loading="loading" size="lg" class="mt-8 w-full" type="submit" @click="onSubmit">
        保存
      </FaButton>
    </ElForm>
  </div>
</template>
