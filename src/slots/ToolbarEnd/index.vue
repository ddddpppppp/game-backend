<i18n lang="yaml">
zh-cn:
  profile: 个人设置
  preferences: 偏好设置
  hotkeys: 快捷键介绍
  logout: 退出登录
  current_account: 当前登录账号
  timezone: 时区设置
  beijing_time: 北京时间
  la_time: 洛杉矶时间
  current_timezone: 当前时区
zh-tw:
  profile: 個人設置
  preferences: 偏好設置
  hotkeys: 快捷鍵介紹
  logout: 退出登錄
  current_account: 當前登錄帳號
  timezone: 時區設置
  beijing_time: 北京時間
  la_time: 洛杉磯時間
  current_timezone: 當前時區
en:
  profile: Personal Settings
  preferences: Preferences
  hotkeys: Hotkeys Introduction
  logout: Logout
  current_account: Current Login Account
  timezone: Timezone Settings
  beijing_time: Beijing Time
  la_time: Los Angeles Time
  current_timezone: Current Timezone
</i18n>

<script setup lang="ts">
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import eventBus from '@/utils/eventBus'
import storage from '@/utils/storage'
import { useI18n } from 'vue-i18n'
import Profile from './profile.vue'

const router = useRouter()

const settingsStore = useSettingsStore()
const userStore = useUserStore()

const { t } = useI18n()
const { generateI18nTitle } = useMenu()

const isProfileShow = ref(false)
const isTimezonePopoverVisible = ref(false)

// 时区选项
const timezones = [
  { value: 'Asia/Shanghai', label: 'beijing_time', offset: '+08:00' },
  { value: 'America/Los_Angeles', label: 'la_time', offset: '-07:00' },
]

// 从localStorage获取缓存的时区，如果没有则默认使用北京时间
const currentTimezone = ref(storage.local.get('userTimezone') || 'Asia/Shanghai')

// 切换时区
function changeTimezone(timezone: string) {
  currentTimezone.value = timezone
  // 保存时区到localStorage
  storage.local.set('userTimezone', timezone)
  isTimezonePopoverVisible.value = false
}

// 打开时区弹窗
function openTimezonePopover() {
  isTimezonePopoverVisible.value = true
}
</script>

<template>
  <FaDropdown
    align="end" :items="[
      [
        { label: generateI18nTitle(settingsStore.settings.home.title), icon: 'i-mdi:home', handle: () => router.push({ path: settingsStore.settings.home.fullPath }), hide: !settingsStore.settings.home.enable },
        { label: t('profile'), icon: 'i-mdi:account', handle: () => isProfileShow = true },
        { label: t('preferences'), icon: 'i-mdi:cog', handle: () => eventBus.emit('global-preferences-toggle'), hide: !settingsStore.settings.userPreferences.enable },
        { label: t('timezone'), icon: 'i-mdi:clock-time-five', handle: () => openTimezonePopover() },
      ],
      [
        { label: t('hotkeys'), icon: 'i-mdi:keyboard', handle: () => eventBus.emit('global-hotkeys-intro-toggle'), hide: settingsStore.mode !== 'pc' },
      ],
      [
        { label: t('logout'), icon: 'i-mdi:logout', handle: () => userStore.logout(settingsStore.settings.home.fullPath) },
      ],
    ]" class="flex-center"
  >
    <template #label>
      <div class="space-y-2">
        <div class="text-xs text-secondary-foreground/50 font-light">
          {{ t('current_account') }}
        </div>
        <div class="flex-center-start gap-2">
          <FaAvatar :src="userStore.avatar" :fallback="userStore.account.slice(0, 5)" shape="square" />
          <div class="space-y-1">
            <div class="text-base lh-none">
              {{ userStore.account }}
            </div>
            <div class="text-xs text-secondary-foreground/50 font-normal">
              这里可以显示邮箱
            </div>
          </div>
        </div>
      </div>
    </template>
    <FaButton variant="ghost" class="h-9 flex-center gap-1 px-2">
      <FaAvatar :src="userStore.avatar" class="size-6">
        <FaIcon name="i-carbon:user-avatar-filled-alt" class="size-6 text-secondary-foreground/50" />
      </FaAvatar>
      <template v-if="settingsStore.mode === 'pc'">
        {{ userStore.account }}
        <FaIcon name="i-ep:caret-bottom" />
      </template>
    </FaButton>
  </FaDropdown>
  <FaModal v-model="isProfileShow" align-center :header="false" :footer="false" :close-on-click-overlay="false" :close-on-press-escape="false" class="h-500px min-w-600px overflow-hidden" content-class="min-h-full p-0 flex">
    <Profile />
  </FaModal>

  <!-- 时区选择弹窗（作为独立组件） -->
  <Teleport to="body">
    <div v-if="isTimezonePopoverVisible" class="fixed left-0 top-0 z-36 h-full w-full" @click="isTimezonePopoverVisible = false">
      <div class="timezone-popover absolute border rounded-md bg-white p-2 shadow-lg" style="top: 60px; right: 20px; z-index: 9999; width: 220px;" @click.stop>
        <div class="mb-2 font-medium">
          {{ t('current_timezone') }}
        </div>
        <div class="text-sm space-y-2">
          <div
            v-for="tz in timezones"
            :key="tz.value"
            class="flex cursor-pointer items-center rounded p-2 hover:bg-gray-100"
            :class="{ 'bg-primary/10': currentTimezone === tz.value }"
            @click="changeTimezone(tz.value)"
          >
            <div class="flex-1">
              {{ t(tz.label) }}
            </div>
            <div class="text-xs text-gray-500">
              {{ tz.offset }}
            </div>
            <FaIcon v-if="currentTimezone === tz.value" name="i-mdi:check" class="ml-2 text-primary" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.timezone-popover {
  z-index: 9999;
}
</style>
