// component/NavigationModel/index.js
Component({
  properties: {
    markerInfo: {
      type: Object
    },
    isPopupShow: {
      type: Boolean,
      value: false
    }
  },
  data: {
    isPopupOverlay: false,
  },
  methods: {
    // 关闭marker弹框
    onClosePopup: function() {
      this.triggerEvent('onClosePopup');
    },
    onShowRoute: function() {
    },
  }
})
