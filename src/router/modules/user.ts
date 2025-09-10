import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw[] = [
  {
    path: '/user',
    component: Layout,
    redirect: '/user/userList',
    name: 'user',
    meta: {
      title: '用户管理',
      icon: 'i-ri:user-line',
      auth: 'user',
      alwaysOpened: true,
    },
    children: [
      {
        path: 'userList',
        name: 'userList',
        component: () => import('@/views/user/user/list.vue'),
        meta: {
          title: '用户管理',
          auth: 'userList.browse',
        },
      },
      {
        path: 'userRechargeList',
        name: 'userRechargeList',
        component: () => import('@/views/user/recharge/list.vue'),
        meta: {
          title: '充值管理',
          auth: 'userRechargeList.browse',
        },
      },
      {
        path: 'userWithdrawList',
        name: 'userWithdrawList',
        component: () => import('@/views/user/withdraw/list.vue'),
        meta: {
          title: '提现管理',
          auth: 'userWithdrawList.browse',
        },
      },
    ],
  },
]

export default routes
