import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw[] = [
  {
    path: '/canada28',
    component: Layout,
    redirect: '/canada28/canada28Dashboard',
    name: 'canada28',
    meta: {
      title: '加拿大28',
      icon: 'i-ri:game-line',
      auth: 'canada28Dashboard',
      alwaysOpened: true,
    },
    children: [
      {
        path: 'canada28Dashboard',
        name: 'canada28Dashboard',
        component: () => import('@/views/canada28/dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          auth: 'canada28Dashboard.browse',
        },
      },
      {
        path: 'canada28ProductSetting',
        name: 'canada28ProductSetting',
        component: () => import('@/views/canada28/product_setting/index.vue'),
        meta: {
          title: '玩法设置',
          auth: 'canada28ProductSetting.browse',
        },
      },
      {
        path: 'canada28OrderList',
        name: 'canada28OrderList',
        component: () => import('@/views/canada28/order/list.vue'),
        meta: {
          title: '投注记录',
          auth: 'canada28OrderList.browse',
        },
      },
      {
        path: 'canada28CrawList',
        name: 'canada28CrawList',
        component: () => import('@/views/canada28/craw/list.vue'),
        meta: {
          title: '开奖记录',
          auth: 'canada28CrawList.browse',
        },
      },
    ],
  },
]

export default routes
