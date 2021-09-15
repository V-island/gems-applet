// component/FMScrollGroupsControl/FMScrollGroupsControl.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //楼层数组
    groupIDs: {
      type: Array,
      value: null
    },
    //视野内显示多少个按钮，可手触上下滚动
    showBtnCount: {
      type: Number,
      value: 0,
      observer: function (newVal, oldVal) {
        // console.log('height----', this.properties.showBtnCount * 84);
        if (this.properties.showBtnCount < this.properties.groupIDs.length) {
          this.setData({
            needArrow: true,
            scrollHeight: this.properties.showBtnCount * 84
          })
        }
      }
    },
    //当前的聚焦楼层id
    focusGroupID: {
      type: Number,
      value: 1,
      observer: function (newVal, oldVal) {
        console.log("focusGroupID")
        this._setArrowBtnStatus(this.properties.focusGroupID);
      }
    },
    allLayer: {
      type: Boolean
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    btnUrl: './image/',
    scrollHeight: 180,
    isTop: false,
    isBottom: true,
    needArrow: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 切换聚焦楼层
     * @param {*} e 
     */
    switchGroup: function (e) {
      let focusId = e.currentTarget.dataset.gid;
      this.triggerEvent('switchGroup', focusId);

      this._setArrowBtnStatus(focusId);
    },

    /**
     * 设置上下箭头按钮的状态
     * @param {*} focusId 聚焦楼层id
     */
    _setArrowBtnStatus: function (focusId) {
      if (focusId === 1) {
        this.setData({
          isBottom: true
        })
      } else if (focusId === this.properties.groupIDs.length - 1) {
        this.setData({
          isTop: true
        })
      } else {
        this.setData({
          isTop: false,
          isBottom: false
        })
      }
    },

    /**
     * 切换单层多层
     */
    switchLayers: function () {
      this.triggerEvent('switchLayers');
    },

    /**
     * 向上切换楼层
     */
    goTop: function () {
      let gid = this.properties.focusGroupID + 1;
      this.triggerEvent('switchGroup', gid);
      this._setArrowBtnStatus(gid);
    },

    /**
     * 向下切换楼层
     */
    goBottom: function () {
      let gid = this.properties.focusGroupID - 1;
      this.triggerEvent('switchGroup', gid);
      this._setArrowBtnStatus(gid);
    }
  }
})
