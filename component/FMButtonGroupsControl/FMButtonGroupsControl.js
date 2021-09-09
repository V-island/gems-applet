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
        console.log('height----', this.properties.showBtnCount * 84);
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
        console.log("focusGroupID", this.properties.focusGroupID)
        this._setFocusGroupName(this.properties.focusGroupID);
      }
    },
    // 展开控件
    expand: {
      type: Boolean,
      value: true,
      observer: function (newVal, oldVal) {
        this.setData({
          isShowList: newVal,
        })
      }
    },
    // 是否允许展开控件操作
    enableExpand: {
      type: Boolean,
      value: true,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    scrollHeight: 250,
    focusGroupName: "F1",
    isShowList: true,
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
      this._setFocusGroupName(focusId);
    },

    /**
     * 收起下拉压缩
     */
    folderGroupBtns: function () {
      if (!this.properties.enableExpand) return;
      this.setData({
        isShowList: !this.data.isShowList
      })
    },

    /**
     * 设置聚焦楼层的楼层名称
     * @param {*} gid 聚焦楼层id
     */
    _setFocusGroupName: function (gid) {
      let group = this.properties.groupIDs.find((gd) => gd.gid === gid);
      if (group) {
        this.setData({
          focusGroupName: group.gname
        })

        console.log(group.gname);
      }
    }

  }
})
