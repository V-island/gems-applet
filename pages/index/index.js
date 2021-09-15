// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    active: 0,
    activeNames: ['1'],
    projectList: [
      {
        id: 202108261730,
        name: "园区",
        child: [
          {
            id: 2108261728,
            name: "星火源",
            icon: ""
          }
        ]
      }
    ]
  },
  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
  },
  onClick(event) {
    wx.navigateTo({url: event.detail})
  },
});