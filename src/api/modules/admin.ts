import api from '../index'

export default {
  getAllRole: (data: any) => api.post('shop/admin/getAllRole', data).then((res) => {
    return res
  }),
  getAllDepartment: (data: any) => api.post('shop/admin/getAllDepartment', data).then((res) => {
    return res
  }),
  getAllAdmin: (data: any) => api.post('shop/admin/getAllAdmin', data).then((res) => {
    return res
  }),
  getAllMerchant: (data: any) => api.post('shop/admin/getAllMerchant', data).then((res) => {
    return res
  }),
  getMyTakeoutRate: (data: any) => api.post('shop/admin/getMyTakeoutRate', data).then((res) => {
    return res
  }),
  getDashboard: (data: any) => api.post('shop/admin/getDashboard', data).then((res) => {
    return res
  }),

}
