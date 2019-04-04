// components/rechargeBox/rechargeBox.js
import util from '../../utils/util.js'

Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        rechargeBox: false,
        rechargeData: {
            ad: '',
            rechargeList: []
        },
        rechargeCurrent: 1,
        fetching: false,
        submitting: false
    },
    ready: function() {
        this.getRechargeData()
    },

    /**
     * 组件的方法列表
     */
    methods: {
        changeCurrentRecharge: function(e) {
            this.setData({
                rechargeCurrent: e.currentTarget.dataset.idx + 1
            })
        },

        getRechargeData: function() { // 获取充值数据
            let { fetching } = this.data
            if (fetching) {
                return false
            }
            this.setData({
                fetching: true
            })
            util.request('/pay/type').then(res => {
                console.log('获取充值数据', res)
                if (res && res.data && !res.msg) { // 获取数据成功
                    this.setData({
                        'rechargeData.rechargeList': res.data.list,
                        'rechargeData.ad': res.data.background
                    })
                }
            }).catch(err => {
                console.log('获取数据失败', err)
            }).finally(res => {
                this.setData({
                    fetching: false
                })
            })
        },

        rechargeSubmit: function() {
            let { rechargeData: { rechargeList }, rechargeCurrent, submitting, requestPayment } = this.data
            if (submitting || requestPayment) { // 正在请求 或 正在支付，中断当前请求
                return false
            }
            if (!rechargeList || (rechargeList && !rechargeList[0])) { // 无相关数据
                return false
            }
            console.log('rechargeList', rechargeList)
            console.log('rechargeCurrent', rechargeCurrent)
            console.log('submit', rechargeList[rechargeCurrent-1])
            let rData = rechargeList[rechargeCurrent-1]
                // let rData = {sale: 0.01, value: 0.02}
            this.setData({
                submitting: true
            })
            util.request('/pay/recharge', rData).then(res => {
                if (res && res.msg && res.error) {
                    wx.showToast({
                        title: res.msg,
                        icon: 'none'
                    })
                }
                if (res && res.data && !res.error) { // 请求获取支付数据成功
                    console.log('请求获取支付数据成功', res.data)
                    let { timeStamp, nonceStr, signType, paySign, out_trade_no } = res.data
                    this.setData({
                        requestPayment: true
                    })
                    wx.requestPayment({
                        timeStamp,
                        nonceStr,
                        package: res.data.package,
                        signType,
                        paySign,
                        success: res => {
                            console.log('支付成功', res)
                            this.hideRechargeBox()
                            // this.rechargeSuccess()
                            // 新版本不做回调处理，直接跳转个人中心页面，故注释了上面的语句，使用了下面的语句
                            wx.switchTab({
                              url: '/pages/usercenter/usercenter'
                            })
                        },
                        fail: res => {
                            console.log('支付失败', res)
                        },
                        complete: res => {
                            console.log('支付结束')
                            this.setData({
                                requestPayment: false
                            })
                        }
                    })
                }
            }).catch(err => {
                console.log('请求获取支付数据失败', err)
            }).finally(res => {
                this.setData({
                    submitting: false
                })
            })
        },

        stopPropagation: function() {
            console.log('阻止冒泡')
        },

        hideRechargeBox: function() {
            this.setData({
                rechargeBox: false
            })
            if (this.rechargeClose) {
              this.rechargeClose()
            }
        },

        showRechargeBox: function(options) { // 如果没有充值数据，则不弹出，并且尝试重新获取数据

            let { rechargeData: { rechargeList } } = this.data
            if (!rechargeList || (rechargeList && !rechargeList[0])) {
                this.getRechargeData()
                return false
            }
            if (options && options.successCallback) { // 如果传入了callback
              this.rechargeSuccess = options.successCallback
            }
            if (options && options.closeCallback) {
              this.rechargeClose = options.closeCallback
            }
            this.setData({
                rechargeBox: true
            })
        },

        rechargeSuccess: function() {
            let currentPages = getCurrentPages()
            let currentPage = currentPages[currentPages.length - 1]
            if (currentPage && currentPage.refreshPage) { // refreshPage是在页面上的方法，刷新页面数据，如果页面上有该方法，则充值成功后调用该方法刷新数据
                currentPage.refreshPage()
            }
        },

        rechargeClose: function () {
          console.log('rechargeClose')
        }
    }
})