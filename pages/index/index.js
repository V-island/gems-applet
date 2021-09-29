// index.js
// 获取应用实例
const app = getApp()
var util = app.GO.util

Page({
  data: {
    placeList: []
  },
  onLoad: function (options) {
    var _self = this;
    // 加载项目列表
    // util.getPlaces({}, function (res) {
    //   _self.setData({
    //     placeList: res.list
    //   })
    // })
    wx.navigateTo({
      url: `/pages/map/index?id=12&mapId=1428635104853151746&name=星火源`
    })
  },
  toMap(e) {
    const {id, mapid, name} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/map/index?id=${id}&mapId=${mapid}&name=${name}`
    })
  },
});