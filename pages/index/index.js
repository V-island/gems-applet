//index.js
//获取应用实例
const app = getApp()
var util = app.GO.util

Page({
  data: {
    userInfo: {},
    latitude: 23.099994,
    longitude: 113.324520,
    markers: [],
    markItem:{},
    hideBottom:true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    var _self = this;
    
    // 获取定位功能
    wx.getSetting({
      success(res) {
        //地理位置
        if (res.authSetting['scope.userLocation']) {
          _self.setMapCenter();
        } else {
          console.info('未授权获取位置');
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              _self.setData({
                homeData: res.data
              })
              _self.setMapCenter();
            }
          })
        }
      }
    })
    // 加载首页数据
    _self.loadHome()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function (e) {
    this.mapCtx = wx.createMapContext('myMap')
    // this.locationTimer()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.loadHome()
  },
  /**
   * 加载首页数据
   */
  loadHome: function () {
    var _self = this;

    //加载定位地图描点--物资
    util.mapPoints(function (res) {
      _self.setMarkData(res);
    });
  },
  markertap: function (e) {
    const _self = this
    const markerId = e.markerId

    util.pointsInfo(markerId, function(res){
      if(!res.url){
        switch (res.type) {
          case '救援人员':
            res.url = '/images/avatar-person.png'
            break;
          default:
            res.url = '/images/avatar-device.png'
        }
      }
      _self.setData({
        markItem: res,
        hideBottom: false
      })
    })
  },
  resetMaptip: function () {
    this.setData({
      hideBottom: true
    })
  },
  setMapCenter: function (init = true){
    var _self = this;
    wx.getLocation({
      // type: 'wgs84',
      type: 'gcj02',
      success(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        var params = {
          lat: latitude,
          lng: longitude
        }

        util.userLocation(params, function(res){
          if (init){
            _self.setData({
              latitude: latitude,
              longitude: longitude
            })
          }
        })
      }
    })
  },
  // 定时器
  locationTimer: function(){
    const _self = this
    const timer = setInterval(()=>{
      _self.setMapCenter(false)
    }, 360000)
  },
  //初始化marker数据
  setMarkData: function (markers){
    markers.forEach((item)=>{
      switch (item.type) {
        case '救援人员':
          Object.assign(item, {
            iconPath: '/images/person.png',
            latitude: item.lat,
            longitude: item.lng,
            width: 30,
            height: 30
          });
          break;
        default:
          Object.assign(item, {
            iconPath: '/images/device.png',
            latitude: item.lat,
            longitude: item.lng,
            width: 30,
            height: 30
          });
      }
    })

    markers.push({
      iconPath: '/images/location.png',
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      width: 40,
      height: 40
    })

    this.setData({
      markers: markers
    })
  },
  //搜索定位
  chooseLocation: function (e) {
    var _self = this;
    wx.chooseLocation({
      // type: 'wgs84',
      type: 'gcj02',
      success(res) {
        let latitude = res.latitude
        let longitude = res.longitude
        let name = res.name
        let address = res.address

        _self.setData({
          latitude,
          longitude
        })
        _self.mapCtx.moveToLocation({
          latitude,
          longitude
        })
      }
    })
  },
  goUser:function(){
    wx.navigateTo({
      url: '/pages/user/user',
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  },
  goFireEntry:function(){
    wx.navigateTo({
      url: '/pages/fire-entry/entry',
      success: function(res){},
      fail: function(res){},
      complete: function(res){},
    })
  },
  goPointsDetail: function (e) {
    var {id} = this.data.markItem;

    wx.navigateTo({
      url: `/pages/points/detail?id=${id}`,
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },
  // 导航
  startNav: function (e) {
    var data = this.data.markItem;
    var params = {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lng),
      name: data.name,
      address: data.description,
      scale: 18
    }

    wx.openLocation(params)
  },
  listView:function(){
    wx.navigateTo({
      url: `/pages/points/list?lat=${this.data.latitude}&lng=${this.data.longitude}`,
      success: function (res) { },
      fail: function (res) { },
      complete: function (res) { },
    })
  },
})
