import type { Settings } from '#/global'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'es-toolkit'
import { toast } from 'vue-sonner'
import apiUser from '@/api/modules/user'
import router from '@/router'
import settingsDefault from '@/settings'
import eventBus from '@/utils/eventBus'
import { diffTwoObj, mergeWithoutUndefinedProps } from '@/utils/object'
import storage from '@/utils/storage'
import useMenuStore from './menu'
import useRouteStore from './route'
import useSettingsStore from './settings'
import useTabbarStore from './tabbar'

const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const settingsStore = useSettingsStore()
    const tabbarStore = useTabbarStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()

    const account = ref(storage.local.get('account') ?? '')
    const token = ref(storage.local.get('token') ?? '')
    const avatar = ref(storage.local.get('avatar') ?? '')
    const permissions = ref<string[]>([])
    const isLogin = computed(() => {
      if (token.value) {
        return true
      }
      return false
    })

    // 登录
    async function login(data: {
      account: string
      password: string
    }) {
      const res = await apiUser.login(data)
      if (res.status !== 1) {
        ElMessage.error({
          message: res.statusText,
        })
        return
      }
      ElMessage.success({
        message: res.statusText,
      })

      // 保存用户信息
      storage.local.set('account', res.data.nickname)
      storage.local.set('token', res.data.token)
      storage.local.set('avatar', res.data.avatar)

      // 如果接口返回了重定向路径，则保存它
      if (res.data.redirectPath) {
        storage.local.set('redirectPath', res.data.redirectPath)
      }

      account.value = res.data.nickname
      token.value = res.data.token
      avatar.value = res.data.avatar

      return res // 返回响应，以便在登录表单中可以使用
    }

    // 手动登出
    function logout(redirect = router.currentRoute.value.fullPath) {
      // 此处仅清除计算属性 isLogin 中判断登录状态过期的变量，以保证在弹出登录窗口模式下页面展示依旧正常
      storage.local.remove('token')
      token.value = ''
      router.push({
        name: 'login',
        query: {
          ...(redirect !== settingsStore.settings.home.fullPath && router.currentRoute.value.name !== 'login' && { redirect }),
        },
      }).then(logoutCleanStatus)
    }
    // 请求登出
    function requestLogout() {
      // 此处仅清除计算属性 isLogin 中判断登录状态过期的变量，以保证在弹出登录窗口模式下页面展示依旧正常
      storage.local.remove('token')
      token.value = ''
      if (settingsStore.settings.app.loginExpiredMode === 'redirect') {
        router.push({
          name: 'login',
          query: {
            ...(
              router.currentRoute.value.fullPath !== settingsStore.settings.home.fullPath
              && router.currentRoute.value.name !== 'login'
              && {
                redirect: router.currentRoute.value.fullPath,
              }
            ),
          },
        }).then(logoutCleanStatus)
      }
      else {
        eventBus.emit('global-login-again-visible')
      }
    }
    // 登出后清除状态
    function logoutCleanStatus() {
      storage.local.remove('account')
      storage.local.remove('avatar')
      account.value = ''
      avatar.value = ''
      permissions.value = []
      settingsStore.updateSettings({}, true)
      tabbarStore.clean()
      routeStore.removeRoutes()
      menuStore.setActived(0)
    }

    // 获取权限
    async function getPermissions() {
      const res = await apiUser.permission()
      permissions.value = res.data.permissions
    }

    // 修改密码
    async function editPassword(data: {
      password: string
      newPassword: string
    }) {
      await apiUser.passwordEdit(data)
    }

    // 修改个人信息和头像
    async function editInfo(data: {
      avatar: string
      nickname: string
    }) {
      const res = await apiUser.infoEdit(data)
      if (res.status !== 1) {
        toast.error(res.statusText)
        return
      }
      toast.success(res.statusText)
      avatar.value = data.avatar
      account.value = data.nickname
      storage.local.set('account', account.value)
      storage.local.set('avatar', avatar.value)
    }

    // 框架已将可提供给用户配置的选项提取出来，请勿新增其他选项，不需要的选项可以在这里注释掉
    const preferences = ref<Settings.all>({
      app: {
        themeSync: settingsDefault.app.themeSync,
        colorScheme: settingsDefault.app.colorScheme,
        lightTheme: settingsDefault.app.lightTheme,
        darkTheme: settingsDefault.app.darkTheme,
        radius: settingsDefault.app.radius,
        enableColorAmblyopiaMode: settingsDefault.app.enableColorAmblyopiaMode,
        enableProgress: settingsDefault.app.enableProgress,
        defaultLang: settingsDefault.app.defaultLang,
      },
      menu: {
        mode: settingsDefault.menu.mode,
        style: settingsDefault.menu.style,
        mainMenuClickMode: settingsDefault.menu.mainMenuClickMode,
        subMenuUniqueOpened: settingsDefault.menu.subMenuUniqueOpened,
        subMenuCollapse: settingsDefault.menu.subMenuCollapse,
        subMenuAutoCollapse: settingsDefault.menu.subMenuAutoCollapse,
        enableSubMenuCollapseButton: settingsDefault.menu.enableSubMenuCollapseButton,
      },
      layout: {
        widthMode: settingsDefault.layout.widthMode,
      },
      mainPage: {
        enableTransition: settingsDefault.mainPage.enableTransition,
        transitionMode: settingsDefault.mainPage.transitionMode,
      },
      topbar: {
        mode: settingsDefault.topbar.mode,
        switchTabbarAndToolbar: settingsDefault.topbar.switchTabbarAndToolbar,
      },
      tabbar: {
        style: settingsDefault.tabbar.style,
        enableIcon: settingsDefault.tabbar.enableIcon,
        dblclickAction: settingsDefault.tabbar.dblclickAction,
        enableMemory: settingsDefault.tabbar.enableMemory,
      },
      toolbar: {
        breadcrumb: settingsDefault.toolbar.breadcrumb,
        navSearch: settingsDefault.toolbar.navSearch,
        fullscreen: settingsDefault.toolbar.fullscreen,
        pageReload: settingsDefault.toolbar.pageReload,
        colorScheme: settingsDefault.toolbar.colorScheme,
        layout: settingsDefault.toolbar.layout,
      },
      breadcrumb: {
        style: settingsDefault.breadcrumb.style,
        enableMainMenu: settingsDefault.breadcrumb.enableMainMenu,
      },
    })
    // isPreferencesUpdating 用于防止循环更新
    let isPreferencesUpdating = false
    watch(() => settingsStore.settings, (val) => {
      if (!settingsStore.settings.userPreferences.enable) {
        return
      }
      if (!isPreferencesUpdating) {
        isPreferencesUpdating = true
        preferences.value = mergeWithoutUndefinedProps(val, preferences.value)
      }
      else {
        isPreferencesUpdating = false
      }
    }, {
      deep: true,
    })
    watch(preferences, (val) => {
      if (!settingsStore.settings.userPreferences.enable) {
        return
      }
      if (!isPreferencesUpdating) {
        isPreferencesUpdating = true
        settingsStore.updateSettings(cloneDeep(val))
      }
      else {
        isPreferencesUpdating = false
      }
      updatePreferences(cloneDeep(val))
    }, {
      deep: true,
    })
    // isPreferencesInited 用于防止初始化时触发更新
    let isPreferencesInited = false
    // 获取偏好设置
    async function getPreferences() {
      let data: Settings.all = {}
      if (settingsStore.settings.userPreferences.storageTo === 'local') {
        if (storage.local.has('userPreferences')) {
          data = JSON.parse(storage.local.get('userPreferences') as string)[account.value] || {}
        }
      }
      else if (settingsStore.settings.userPreferences.storageTo === 'server') {
        const res = await apiUser.preferences()
        data = JSON.parse(res.data.preferences || '{}') as Settings.all
      }
      preferences.value = mergeWithoutUndefinedProps(data, preferences.value)
    }
    // 更新偏好设置
    async function updatePreferences(data: Settings.all = {}) {
      if (!isPreferencesInited) {
        isPreferencesInited = true
        return
      }
      if (!isLogin.value) {
        return
      }
      data = diffTwoObj(settingsDefault, data)
      if (settingsStore.settings.userPreferences.storageTo === 'local') {
        const userPreferencesData = storage.local.has('userPreferences') ? JSON.parse(storage.local.get('userPreferences') as string) : {}
        userPreferencesData[account.value] = data
        storage.local.set('userPreferences', JSON.stringify(userPreferencesData))
      }
      else if (settingsStore.settings.userPreferences.storageTo === 'server') {
        await apiUser.preferencesEdit(JSON.stringify(data))
      }
    }

    return {
      account,
      token,
      avatar,
      permissions,
      isLogin,
      login,
      logout,
      requestLogout,
      logoutCleanStatus,
      getPermissions,
      editPassword,
      editInfo,
      preferences,
      getPreferences,
      updatePreferences,
    }
  },
)

export default useUserStore
