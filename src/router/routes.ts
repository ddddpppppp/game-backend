import type { Route } from '#/global'
import type { RouteRecordRaw } from 'vue-router'
// import pinia from '@/store'
// import useSettingsStore from '@/store/modules/settings'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:meta-layouts'
import { $t } from '@/locales'
import storage from '@/utils/storage.ts'
import BackendManage from './modules/backend_manage.ts'
import Canada28 from './modules/canada.ts'
import User from './modules/user.ts'
// import MultilevelMenuExample from './modules/multilevel.menu.example'
// 固定路由（默认路由）
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue'),
    meta: {
      whiteList: true,
      title: $t('app.route.login'),
    },
  },
  {
    path: '/:all(.*)*',
    name: 'notFound',
    component: () => import('@/views/[...all].vue'),
    meta: {
      title: '找不到页面',
    },
  },
]

// 系统路由
const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      return storage.local.get('redirectPath') || '/backend_manage/merchant'
    },
    component: () => import('@/layouts/index.vue'),
    meta: {
      breadcrumb: false,
    },
    children: [
      {
        path: 'reload',
        name: 'reload',
        component: () => import('@/views/reload.vue'),
        meta: {
          title: $t('app.route.reload'),
          breadcrumb: false,
        },
      },
    ],
  },
]

// 动态路由（异步路由、导航栏路由）
const asyncRoutes: Route.recordMainRaw[] = [
  {
    meta: {
      title: '用户',
      icon: 'i-ri:user-line',
    },
    children: [
      ...User,
    ],
  },
  {
    meta: {
      title: '加拿大28',
      icon: 'i-ri:function-line',
    },
    children: [
      ...Canada28,
    ],
  },
  {
    meta: {
      title: '管理',
      icon: 'i-uim:box',
    },
    children: [
      ...BackendManage,
    ],
  },
]

const constantRoutesByFilesystem = generatedRoutes.filter((item) => {
  return item.meta?.enabled !== false && item.meta?.constant === true
})

const asyncRoutesByFilesystem = setupLayouts(generatedRoutes.filter((item) => {
  return item.meta?.enabled !== false && item.meta?.constant !== true && item.meta?.layout !== false
}))

export {
  asyncRoutes,
  asyncRoutesByFilesystem,
  constantRoutes,
  constantRoutesByFilesystem,
  systemRoutes,
}
