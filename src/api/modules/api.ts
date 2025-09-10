import api from '../index'

export default {
  getVerificationCode: (data: any) => api.post('shop/api/getVerificationCode', data).then((res) => {
    return res
  }),

}
