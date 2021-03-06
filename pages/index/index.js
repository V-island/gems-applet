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
    util.getPlaces({}, function (res) {
      _self.setData({
        placeList: res.list
      })
    })
  },
  toMap(e) {
    const {id, mapid, themeid, mapkey, name} = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/map/index?id=${id}&mapId=${mapid}&themeId=${themeid}&mapKey=${mapkey}&name=${name}`
    })
  },
});