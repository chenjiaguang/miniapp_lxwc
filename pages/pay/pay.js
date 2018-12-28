// pages/pay/pay.js
import util from '../../utils/util.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    canUseVoucher: 0,
    selectedVoucher: null,
    userVouchers: [],
    canUseRedpacket: 0,
    userRedpackets: [],
    total: '',
    ignore: '',
    actual: '',
    paying: false // 是否正在付款，禁止多次点击
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (options.id) {
      this.setData({
        shopid: options.id
      })
      this.getUserDiscountInfo(options.id)
    }
    if (options.title) {
      wx.setNavigationBarTitle({
        title: options.title
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  getUserDiscountInfo: function(shopid) { // 获取用户支付相关的优惠信息
    shopid = shopid || this.data.shopid
    util.request('/pay/show', {
      shopid
    }).then(res => {
      console.log('支付优惠数据', res)
      if (res && res.data && !res.msg) { // 获取成功
        let {
          balance,
          huodong,
          name,
          shopid
        } = res.data
        let userVouchers = []
        if (huodong && huodong[0]) {
          userVouchers = huodong.filter(item => item.type.toString() === '1') // type为1的表示满减优惠券
          if (userVouchers && userVouchers[0]) {
            userVouchers.forEach(item => {
              item.shopname = name
            })
          }
        }
        if (name) {
          wx.setNavigationBarTitle({
            title: name
          })
        }
        this.setData({
          balance,
          userVouchers,
          name,
          shopid
        })
      }
    }).catch(err => {
      console.log('err', err)
    })
  },

  calFullCutAct: function(total, ignore) { // 计算满减活动为止的应付金额
    total = parseFloat(total || 0)
    ignore = parseFloat(ignore || 0)
    return total - ignore
  },

  calActual: function (total, ignore, userVouchers) {
    total = parseFloat(total || 0)
    ignore = parseFloat(ignore || 0)
    let before = this.calFullCutAct(total, ignore)
    let actual = 0
    let voucherDiscount = 0
    if (before >= 0.01) { // 原始需支付大于最低支付金额
      if (userVouchers && userVouchers.length) {
        userVouchers.forEach(item => {
          if (item.useful && item.selected && item.value > voucherDiscount) {
            voucherDiscount = item.value
          }
        })
      }
    }
    actual = (before - voucherDiscount + ignore).toFixed(2)
    return actual
  },

  getUseableVoucher: function(total, ignore) { // 计算可用优惠券张数
    total = parseFloat(total || 0)
    ignore = parseFloat(ignore || 0)
    let {
      userVouchers
    } = this.data
    let before = this.calFullCutAct(total, ignore)
    console.log('getUseableVoucher', total, ignore, before)
    let _userVouchers = [].concat(userVouchers)
    if (before < 0.01) {
      if (_userVouchers || _userVouchers[0]) { // 存在优惠券
        _userVouchers = _userVouchers.map(item => {
          let useful = (before >= item.cond_count) && (before - item.value >= 0.01)
          return Object.assign({}, item, { useful: useful, selected: item.selected && useful})
        })
        this.setData({
          selectedVoucher: null,
          userVouchers: _userVouchers,
          canUseVoucher: 0,
          actual: this.calActual(total, ignore, _userVouchers)
        })
      }
      return 0
    }
    if (!_userVouchers || (_userVouchers && !_userVouchers[0])) { // 不存在优惠券
      this.setData({
        selectedVoucher: null,
        canUseVoucher: 0,
        actual: this.calActual(total, ignore, _userVouchers)
      })
      return 0
    }
    if (_userVouchers && _userVouchers[0]) { // 存在优惠券
      let canUseVoucher = 0
      _userVouchers = _userVouchers.map(item => {
        if (before >= item.cond_count && before - item.value >= 0.01) {
          canUseVoucher += 1
        }
        let useful = (before >= item.cond_count) && (before - item.value >= 0.01)
        console.log(before, item.value)
        return Object.assign({}, item, { useful: useful, selected: item.selected && useful })
      })
      this.setData({
        selectedVoucher: canUseVoucher ? this.data.selectedVoucher : null,
        userVouchers: _userVouchers,
        canUseVoucher: canUseVoucher,
        actual: this.calActual(total, ignore, _userVouchers)
      })
      return canUseVoucher
    }
    return 0
  },

  getUseableRedpacket: function(beforePrice) { // 传入计算可用红包之前所剩的应付金额beforePrice,未传入时将通过页面的data来计算，有点延迟，可能导致bug
    let before = parseFloat(beforePrice || 0)
    if (!before || Object.prototype.toString.call(before) !== '[object Number]') { // 如果未传入，或者不是number类型的变量，则用data数据来算

    }
    let {
      userRedpackets
    } = this.data
    if (!userRedpackets || (userRedpackets && !userRedpackets[0])) { // 不存在红包
      return 0
    }
    if (userRedpackets && userRedpackets[0]) {
      let canUseRedpackets = userRedpackets.filter(item => (before > item.cond_count && before - item.value >= 0.01))
      return canUseRedpackets.length
    }
  },

  getDiscountTitle: function(voucher) {
    let title = ''
    if (voucher.type == 1) { // 满减优惠券
      title = '满' + voucher.cond_count + '减' + voucher.value
    }
  },

  isNumber: function(input) { // 传入字符串
    const reg = /^([0]|([1-9][0-9]*)|(([0]\.\d{0,2}|[1-9][0-9]*\.\d{0,2})))$/
    const reg2 = /^[0-9]\.$/
    if (reg.test(input) || reg2.test(input)) {
      return true
    } else {
      return false
    }
  },

  totalInput: function(e) {
    let {
      value
    } = e.detail
    let {
      total,
      ignore
    } = this.data
    if (ignore && (!value || (value && this.isNumber(value) && (parseFloat(value) - parseFloat(ignore) < 0.01)))) {
      ignore = ''
    }
    if (this.isNumber(value) || value === '') { // 输入的值可作为数字时
      const canUseVoucher = this.getUseableVoucher(value || 0, ignore || 0)
      this.setData({
        total: value,
        canUseVoucher,
        ignore
      })
    } else {
      this.setData({ total, ignore})
    }
  },

  ignoreInput: function(e) {
    let {
      value
    } = e.detail
    let {
      total,
      ignore
    } = this.data
    if (total && value && this.isNumber(value) && (parseFloat(total) - parseFloat(value) < 0.01)) {
      value = ignore
    }
    if (this.isNumber(value) || value === '') { // 输入的值可作为数字时
    console.log('value', value)
      const canUseVoucher = this.getUseableVoucher(total || 0, value || 0)
      this.setData({
        ignore: value,
        canUseVoucher
      })
    } else {
      this.setData({ ignore })
    }
  },

  updateVoucher: function (userVouchers) {
    let selectedVoucher = userVouchers.filter(item => item.selected)[0]
    this.setData({ selectedVoucher: selectedVoucher || null, userVouchers }, () => {
      const {total, ignore} = this.data
      this.getUseableVoucher(total || 0, ignore || 0)
    })
  },

  getUserVouchers: function () {
    return this.data.userVouchers
  },

  chooseVoucher: function () {
    const { canUseVoucher} = this.data
    if (canUseVoucher) {
      wx.navigateTo({
        url: '/pages/choosevoucher/choosevoucher'
      })
    }
  },

  chooseRedpacket: function () { // 红包的逻辑未写
    console.log('暂未实现')
  },

  pay: function () {
    let {total, ignore, actual, shopid, selectedVoucher, paying} = this.data
    if (paying || !actual || (actual && parseFloat(actual) < 0.01)) { // 正在付款时中断
      return false
    }
    let coupon_id = selectedVoucher ? selectedVoucher.id : ''
    let rData = {
      shopid,
      total_amount: total ? parseFloat(total) : 0,
      exclude_amount: ignore ? parseFloat(ignore) : 0,
      actual_amount: actual ? parseFloat(actual): 0,
      coupon_id
    }
    this.setData({
      paying: true
    })
    util.request('/pay/request', rData, { dontToast: true}).then(res => {
      if (res && !res.error) { // 支付成功，跳转成功页面
        // console.lig('付款成功', res.data)
        let url = ''
        let {name} = this.data
        if (name) {
          url = '/pages/paysuccess/paysuccess?id=' + res.data.order_id + '&title=' + name
        } else {
          url = '/pages/paysuccess/paysuccess?id=' + res.data.order_id
        }
        wx.redirectTo({
          url: url
        })
      } else if (res && res.error) {
        if (res.error.toString() === '300') { // 协定好的余额不足错误码
          this.showRechargeDialog()
        } else {
          if (res.msg) {
            wx.showToast({
              title: res.msg,
              icon: 'none'
            })
          }
        }
      }
    }).catch(err => {
      console.log('支付失败', err)
      if (err && err.error && err.error.toString() === '300') {
        this.showRechargeDialog()
      }
    }).finally(res => {
      this.setData({
        paying: false
      })
    })
  },

  showRechargeDialog: function () {
    console.log('showRechargeDialog')
    wx.showModal({
      title: '',
      content: '余额不足，请充值！',
      confirmText: '去充值',
      confirmColor: '#108EE9',
      success: res => {
        if (res.confirm) {
          console.log('用户点击确定')
          util.showRechargeModal()
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
})