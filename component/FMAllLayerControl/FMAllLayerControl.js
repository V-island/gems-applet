// component/FMAllLayerControl/FMAllLayerControl.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    allLayer: {
      type: Boolean,
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    btnUrl: './image/',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换单多层
    switchLayers: function () {
      this.triggerEvent('switchLayers');
    },
  }
})
