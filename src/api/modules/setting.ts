import api from '../index'

export default {
  getRoleList: (data: any) => api.post('shop/setting/getRoleList', data).then((res) => {
    return res
  }),
  getRole: (data: any) => api.post('shop/setting/getRole', data).then((res) => {
    return res
  }),
  editRole: (data: any) => api.post('shop/setting/editRole', data).then((res) => {
    return res
  }),
  delRole: (data: any) => api.post('shop/setting/delRole', data).then((res) => {
    return res
  }),

  getAdminList: (data: any) => api.post('shop/setting/getAdminList', data).then((res) => {
    return res
  }),
  getAdmin: (data: any) => api.post('shop/setting/getAdmin', data).then((res) => {
    return res
  }),
  editAdmin: (data: any) => api.post('shop/setting/editAdmin', data).then((res) => {
    return res
  }),
  delAdmin: (data: any) => api.post('shop/setting/delAdmin', data).then((res) => {
    return res
  }),
  recoveryAdmin: (data: any) => api.post('shop/setting/recoveryAdmin', data).then((res) => {
    return res
  }),

  getMerchantList: (data: any) => api.post('shop/setting/getMerchantList', data).then((res) => {
    return res
  }),
  getMerchant: (data: any) => api.post('shop/setting/getMerchant', data).then((res) => {
    return res
  }),
  editMerchant: (data: any) => api.post('shop/setting/editMerchant', data).then((res) => {
    return res
  }),
  delMerchant: (data: any) => api.post('shop/setting/delMerchant', data).then((res) => {
    return res
  }),
  recoveryMerchant: (data: any) => api.post('shop/setting/recoveryMerchant', data).then((res) => {
    return res
  }),
  getPaymentChannelList: (data: any) => api.post('shop/setting/getPaymentChannelList', data).then((res) => {
    return res
  }),
  getPaymentChannel: (data: any) => api.post('shop/setting/getPaymentChannel', data).then((res) => {
    return res
  }),
  disablePaymentChannel: (data: any) => api.post('shop/setting/disablePaymentChannel', data).then((res) => {
    return res
  }),
  enablePaymentChannel: (data: any) => api.post('shop/setting/enablePaymentChannel', data).then((res) => {
    return res
  }),
  editPaymentChannel: (data: any) => api.post('shop/setting/editPaymentChannel', data).then((res) => {
    return res
  }),
  setPaymentChannel: (data: any) => api.post('shop/setting/setPaymentChannel', data).then((res) => {
    return res
  }),

  getOperationLogList: (data: any) => api.post('shop/setting/getOperationLogList', data).then((res) => {
    return res
  }),

  // 系统设置管理接口
  getSystemSettingList: (data: any) => api.post('shop/setting/getSystemSettingList', data).then((res) => {
    return res
  }),
  getSystemSetting: (data: any) => api.post('shop/setting/getSystemSetting', data).then((res) => {
    return res
  }),
  editSystemSetting: (data: any) => api.post('shop/setting/editSystemSetting', data).then((res) => {
    return res
  }),

}
