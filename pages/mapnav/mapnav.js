// pages/mapnav/mapnav.js
const INIT_POIS = [{
  id:'9848980772511932930',
  title:'日月元科技（深圳）有限公司',
  address:'广东省深圳市宝安区建富愉盛工业园5栋',
  location:{
    lat:22.598631,
    lng:113.864662
  }
},{
  id:'72202640772511932930',
  title:'润东晟工业园',
  address:'广东省深圳市宝安区西乡街道107国道西乡',
  location:{
    lat:22.598856,
    lng:113.864942
  }
},{
  id:'172512760772511932930',
  title:'深圳金环怡投资有限公司',
  address:'广东省深圳市宝安区107国道固戍路口愉盛工业园10栋1号南',
  location:{
    lat:22.59986,
    lng:113.866111
  }
},{
  id:'172512760772511932905',
  title:'新雅庭酒店（置富广场）',
  address:'广东省深圳市宝安区西乡街道固戍一路固戍华庭一层',
  location:{
    lat:22.601716,
    lng:113.862167
  }
},{
  id:'17251276077251192150',
  title:'固戍村',
  address:'广东省深圳市宝安区',
  location:{
    lat:22.601665,
    lng:113.866076
  }
},{
  id:'172512760772511980733',
  title:'广汽传祺（宝安松兴店）',
  address:'广东省深圳市宝安区西乡润东晟工业园12栋1楼',
  location:{
    lat:22.599057,
    lng:113.866633
  }
},];
const INIT_MARKER = {
	callout: {
		content: '当前位置',
		padding: 10,
		borderRadius: 2,
		display: 'ALWAYS'
	},
	latitude: 22.599111,
	longitude: 113.86522,
	iconPath: '/images/blueImageMarker.png',
	width: '34px',
	height: '34px',
	rotate: 0,
	alpha: 1
};

Page({

  /**
   * 页面的初始数据
   */
  data: {
    setting: { // 使用setting配置，方便统一还原
			rotate: 0,
			skew: 0,
			enableRotate: true,
		},
		location: {
			latitude: 22.599111,
			longitude: 113.86522
		},
		scale: 15,
		isOverLooking: false,
    isGuGong: true,
    isShowPoi:true,
		is3D: true,
		minScale: 3,
    maxScale: 20,
    pois:[
      ...INIT_POIS
    ],
    markers: [{
			...INIT_MARKER
    }],
    currentIndex:-1,
    currentItem:{},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const _self = this;
    wx.serviceMarket.invokeService({
			service: 'wxc1c68623b7bdea7b',
			api: 'rgeoc',
			data: {
        location:_self.data.location,
        get_poi:1,
        poi_options:'policy=5'
      }
		}).then(res => {
      const result = (typeof res.data) === 'string' ? JSON.parse(res.data).result : res.data.result;

      console.log(result.pois);

      _self.setData({
        pois: result.pois
      });
    }).catch(err => {
			console.error(err);
		});
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  tapPoi(e){
    var position = e.currentTarget.dataset.index;
    var poi = e.currentTarget.dataset.poi;
    // console.log(poi);

    const MARKER = {
      callout: {
        content: poi.title,
        padding: 10,
        borderRadius: 2,
        display: 'ALWAYS'
      },
      latitude: poi.location.lat,
      longitude: poi.location.lng,
      iconPath: '/images/blueImageMarker.png',
      width: '34px',
      height: '34px',
      rotate: 0,
      alpha: 1
    }
    const item = {
      latitude: poi.location.lat,
      longitude: poi.location.lng,
      scale:18,
    }
    this.setData({
      markers: [{
        ...MARKER
      }],
      currentIndex:position,
      currentItem:item,
    })
  },
  startNav(){
    const _self = this;
    // console.log(_self.data.currentItem);
    wx.openLocation(_self.data.currentItem);
  },
})