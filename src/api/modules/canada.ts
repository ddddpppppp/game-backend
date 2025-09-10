import api from '../index'

export default {
  // 后端获取路由数据
  routeList: () => api.get('app/route/list', {
    baseURL: '/mock/',
  }),

  // 基于文件系统路由模式下，后端获取导航菜单数据
  menuList: () => api.get('app/menu/list', {
    baseURL: '/mock/',
  }),

  // 获取加拿大28玩法列表
  getBetTypesList: () => api.post('shop/Canada/getBetTypesList'),

  // 更新玩法配置
  updateBetType: (data: any) => api.post('shop/Canada/updateBetType', { form: data }),

  // 批量更新状态
  batchUpdateStatus: (data: any) => api.post('shop/Canada/batchUpdateStatus', { form: data }),
}
