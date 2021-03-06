// components/merchantoverview/merchantoverview.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    merchant: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    actIconSize: {
      width: 80,
      height: 36
    },
    // active: [],
    colorObj: {
      platnew: '#F8C300',
      shopnew: '#33CC33',
      shopyouhui: '#FF0000',
      getcoupon: '#CC3366',
      shopzeng: '#00ccff',
      sale: '#cc3399',
      fanquan: '#009933',
      backcash: '#6699ff',
    },
    textObj: {
      platnew : '首单',
      shopnew : '新客',
      shopyouhui: '满减',
      getcoupon: '领券',
      shopzeng: '满赠',
      sale: '折扣',
      fanquan: '返券',
      backcash: '返现',
    },
  },
  ready: function(){
    // console.log(this.properties.merchant);
  },
  /**
   * 组件的方法列表
   */
  methods: {
    merchantTap: function (e) {
      const {id} = e.currentTarget.dataset
      wx.navigateTo({
        url: '/pages/merchantdetail/merchantdetail?id=' + id
      })
    },
  }
})
