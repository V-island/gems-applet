// component/FMViewModeControl/FMViewModeControl.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 2、3D状态
    is3D: {
      type: Boolean,
      value: true,
      observer: function (newVal, oldVal) {
        // console.log("is allLayer")
        this.setData({
          viewMode: newVal ? '3D' : '2D'
        })
      }
    }

  },

  /**
   * 组件的初始数据
   */
  data: {
    btnUrl: './image/',
    viewMode: '3D',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 切换2、3D状态
    changeMode() {
      this.triggerEvent('changeMode');
    }
  }
})
