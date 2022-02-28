// component/MarkerInfoPopup/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean
    },
    markerInfo: {
      type: Object
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    overlay: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClose: function() {
      this.triggerEvent('onClose');
    },
    onSelectNavi: function() {
      this.triggerEvent('onSelectNavi');
    },
  }
})