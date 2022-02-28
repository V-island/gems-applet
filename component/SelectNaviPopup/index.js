// component/NavigationModel/index.js
Component({
  properties: {
    show: {
      type: Boolean
    },
    markers: {
      type: Array,
      value: []
    },
    naviInfo: {
      type: Object
    }
  },
  data: {
    overlay: false,
    title: ''
  },
  observers: {
    'naviInfo': function(info) {
      let title = '请点击地图选择起点'
      if(info.time && info.distance)
        title = `${info.time},${info.distance}`

      this.setData({
        title: title
      });
    }
  },
  methods: {
    // 关闭marker弹框
    onClosePopup: function() {
      this.triggerEvent('onClose');
    },
    onRealTimeNavi: function() {
      this.triggerEvent('onRealTimeNavi');
    },
    onSimulationNavi: function() {
      this.triggerEvent('onSimulationNavi');
    },
  }
})
