// component/LocationInfoPopup/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean
    },
    locateInfo: {
      type: Object
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    overlay: false,
    title: '',
    content: ''
  },
  observers: {
    'locateInfo': function (info) {
      const route = info.route || {}
      const prompt = info.prompt || {}
      this.setData({
        title: route.name,
        content: `剩余${info.distance || 0}米, ${prompt.endDirection || ''}`
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭marker弹框
    onClosePopup: function () {
      this.triggerEvent('onClose');
    },
  }
})