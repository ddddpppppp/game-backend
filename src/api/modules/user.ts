import api from '../index'

export default {
  // 登录
  login: (data: {
    account: string
    password: string
  }) => api.post('shop/index/login', data).then((res) => {
    return res
  }),

  // 获取权限
  permission: () => api.post('shop/admin/getUserInfo').then((res) => {
    return res
  }),

  // 修改密码
  passwordEdit: (data: {
    password: string
    newPassword: string
  }) => api.post('shop/admin/passwordEdit', data).then((res) => {
    return res
  }),

  // 修改信息
  infoEdit: (data: {
    avatar: string
    nickname: string
  }) => api.post('shop/admin/saveInfo', data).then((res) => {
    return res
  }),

  // 用户管理接口
  getUserList: (data: any) => api.post('shop/user/getUserList', data).then((res) => {
    return res
  }),
  getUser: (data: any) => api.post('shop/user/getUser', data).then((res) => {
    return res
  }),
  editUser: (data: any) => api.post('shop/user/editUser', data).then((res) => {
    return res
  }),
  changeUserPassword: (data: any) => api.post('shop/user/changeUserPassword', data).then((res) => {
    return res
  }),
  changeFundingPassword: (data: any) => api.post('shop/user/changeFundingPassword', data).then((res) => {
    return res
  }),
  toggleUserStatus: (data: any) => api.post('shop/user/toggleUserStatus', data).then((res) => {
    return res
  }),
  batchToggleUserStatus: (data: any) => api.post('shop/user/batchToggleUserStatus', data).then((res) => {
    return res
  }),
  resetTwoAuth: (data: any) => api.post('shop/user/resetTwoAuth', data).then((res) => {
    return res
  }),

  // 充值管理接口
  getRechargeList: (data: any) => api.post('shop/user/getRechargeList', data).then((res) => {
    return res
  }),

  // 提现管理接口
  getUserWithdrawList: (data: any) => api.post('shop/user/getWithdrawList', data).then((res) => {
    return res
  }),

  processWithdraw: (data: any) => api.post('shop/user/processWithdraw', data).then((res) => {
    return res
  }),
}
