// pages/map/index.js
import {
  fengmap
} from '../../utils/fengmap.miniprogram.min.js';

// 获取应用实例
const app = getApp()
var util = app.GO.util

Page({
  data: {
    placeId: '',
    fmapID: '',
    appName: '',
    deviceList: '',
    mapLoaded: false, //地图是否加载完成
    focusGroupID: 1,
    mapGroupIDs: [],
    markerInfo: {},
    is3D: true,
    isAllLayer: false,
    isOpenBluetooth: false,
    isPopupShow: false,
    isPopupOverlay: false,
    hasMarker: true,
  },
  // 定义全局map变量
  fmap: null,
  location: null,
  //定义定位点marker
  locationMarker: null,
  // 定义路径规划对象
  naviAnalyser: null,
  // 定义点击次数变量
  clickCount: 0,
  // 判断起点是否是同一处坐标
  lastCoord: null,
  // 起终点坐标
  coords: [],
  // 定义markert图层数组
  layers: [],
  // 定义导航marker
  layer: null,
  onLoad: function (options) {
    const { id, mapId, name } = options
    this.setData({
      placeId: id,
      fmapID: mapId,
      appName: name
    })
    var that = this;
    //是否正确打开蓝牙
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log("正常打开蓝牙适配器！");
        that.setData({
          isOpenBluetooth: true
        })
        // 初始化地图
        that.initFengMap();
      },
      fail: function (res) {
        console.info('没有打开蓝牙适配器');
        that.setData({
          isOpenBluetooth: false
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.fmap) {
      this.fmap.dispose();
      this.fmap = null;
    }
  },
  // 初始化蜂鸟地图
  initFengMap: function () {
    var that = this;
    // 获取canvas
    wx.createSelectorQuery().select('#fengMap').node().exec((res) => {
      const canvas = res[0].node;
      this.canvas = canvas
      wx.createSelectorQuery().select("#temp").node().exec((tempRes) => {
        const tmpCanvas = tempRes[0].node;
        const mapOptions = {
          //必要，地图容器
          canvas: canvas,
          // 必要，2d画布
          tempCanvas: tmpCanvas,
          // 地图默认旋转角度
          defaultControlsPose: 90,
          // 初始二维/三维状态,默认3D显示
          defaultViewMode: this.data.is3D ? fengmap.FMViewMode.MODE_3D : fengmap.FMViewMode.MODE_2D,
          // 设置初始指南针的偏移量
          compassOffset: [40, 40],
          // 设置指南针大小
          compassSize: 36,
          // 初始化地图中心点坐标
          // defaultViewCenter: {x:12961580.734922647,y:4861883.567717729},
          // 地图应用名称p
          appName: this.data.appName,
          // 地图应用密钥
          key: '75165ff8c8231fdedc78c2b82447806a',
        };

        //初始化地图对象
        this.fmap = new fengmap.FMMap(mapOptions);

        //打开Fengmap服务器的地图数据和主题
        this.fmap.openMapById(this.data.fmapID, function (error) {
          //打印错误信息
          // console.log(error);
        });

        // fengmap.FMNaviAnalyser 是可分析最短路径、最快路径并返回分析结果的路径类
        this.naviAnalyser = new fengmap.FMNaviAnalyser(this.fmap);

        //地图加载完成事件
        this.fmap.on('loadComplete', () => {
          console.log('地图加载完成');

          this.setData({
            mapLoaded: true
          })

          // 设置楼层数据
          this.loadScrollFloorCtrl();

          // 显示指北针
          this.showCompass();
        })

        /**
         * 地图点击事件
         * 通过点击地图，获取位置坐标
         * */
        this.fmap.on('mapClickNode', (event) => {
          if (event.target && event.target.nodeType == fengmap.FMNodeType.MODEL && this.naviAnalyser) {
            //封装点击坐标，模型中心点坐标
            const coord = {
              x: event.target.mapCoord.x,
              y: event.target.mapCoord.y,
              name: event.target.name,
              groupID: event.target ? event.target.groupID : 1
            };
            console.log(coord)
            this.setData({ markerInfo: coord, isPopupShow: true });
            this.addImageMarker(coord);
            return
            //第一次点击
            if (this.clickCount === 0) {
              //记录点击坐标
              this.lastCoord = coord;
              //设置起点坐标
              this.coords[0] = coord;

              //添加起点imageMarker
              this.addMarker(coord, 'start');
            } else if (this.clickCount === 1) {
              //第二次点击，添加终点并画路线
              //判断起点和终点是否相同
              if (this.lastCoord.x === coord.x && this.lastCoord.y === coord.y) {
                return;
              }

              //设置终点坐标
              this.coords[1] = coord;
              //添加终点imageMarker
              this.addMarker(coord, 'end');

              //设置完起始点后，调用此方法画出导航线
              this.drawNaviLine();
            } else {
              //第三次点击，重新开始选点进行路径规划
              //重置路径规划
              this.resetNaviRoute();

              //记录点击坐标
              this.lastCoord = coord;
              //设置起点坐标
              this.coords[0] = coord;
              //添加起点imageMarker
              this.addMarker(coord, 'start');
            }
            this.clickCount++;
          }
        })

        //过滤是否可触发点击事件mapClickNode方法的地图元素，返回true为可触发
        this.fmap.pickFilterFunction = function (event) {
          //如设置点击墙模型时不高亮
          if (event.typeID === 300000) {
            return false;
          }
          return true;
        };
      })
    })
    // 通过蓝牙获取实时定位
    wx.openBluetoothAdapter({
      success: function (res) {
        // 项目相关设备列表
        util.getDevices(that.data.placeId, function (res) {
          that.setData({
            deviceList: res || []
          })
          //开始搜索附近的蓝牙设备
          setInterval(that.getDevicesDiscovery, 1000);
        })
      }
    })
  },
  // 手指触摸动作开始
  touchStart(e) {
    this.canvas.dispatchTouchEvent({
      ...e,
      type: 'touchstart'
    })
  },
  // 手指触摸后移动
  touchMove(e) {
    this.canvas.dispatchTouchEvent({
      ...e,
      type: 'touchmove'
    })
  },
  // 手指触摸动作结束
  touchEnd(e) {
    this.canvas.dispatchTouchEvent({
      ...e,
      type: 'touchend'
    })
  },
  // 显示指北针
  showCompass() {
    this.fmap.compass.setBgImage('../../images/compass_bg.png'); //设置背景图片
    this.fmap.compass.setFgImage('../../images/compass_fg.png'); //设置前景图片
    this.fmap.showCompass = true;

    // 点击指北针事件, 使角度归0
    this.fmap.on('mapClickCompass', () => {
      this.fmap.rotateTo({
        //设置角度
        to: 0,
        //动画持续时间，默认为。3秒
        duration: 0.3,
        callback: function () { //回调函数
          console.log('rotateTo complete!');
        }
      })
    });
  },
  ///////////////////////////////////////////////
  //系统统一回调事件(start)
  //////////////////////////////////////////////
  // 搜索附近的蓝牙设备
  getDevicesDiscovery: function () {
    var that = this;
    wx.startBluetoothDevicesDiscovery({
      success: function (res) {
        //获取在蓝牙模块生效期间所有已发现的蓝牙设备
        wx.getBluetoothDevices({
          success: function (res) {
            //定义一个对象数组来接收Beacon的信息
            let arrayIBeaconInfo = res.devices.filter(devices => that.data.deviceList.some(item => devices.deviceId === item));
            let iBeaconInfo = arrayIBeaconInfo.map(item => {
              return `${item.deviceId},${item.RSSI}`
            })
            if(iBeaconInfo.length > 0)
              util.getLocation(iBeaconInfo.join(';'), function (location) {
                wx.onCompassChange((res)=>{
                  that.addOrMoveLocationMarker({...location, angle: res.direction})
                })
              })
          },
          fail: function (res) {
            console.log("获取蓝牙设备失败！");
          }
        })
      },
      fail: function (res) {
        console.log("搜索附近蓝牙失败！");
      }
    })
  },
  // 是否跳过蓝牙验证
  onLeapfrog: function() {
    this.setData({
      isOpenBluetooth: true
    })
    // 初始化地图
    this.initFengMap();
  },
  // 关闭marker弹框
  onClosePopup: function() {
    this.setData({ markerInfo: {}, isPopupShow: false });
  },
  // 初始化导航
  onShowRoute: function() {
    
  },
  // 添加本地定位Marker
  // fengmap.FMLocationMarker 自定义图片标注对象，为自定义图层
  addOrMoveLocationMarker({xaxis, yaxis, floor, angle}) {
    if (!this.locationMarker) {
      // fengmap.FMLocationMarker 自定义图片标注对象，为自定义图层
      this.locationMarker = new fengmap.FMLocationMarker(this.fmap, {
        //x坐标值
        x: xaxis,
        //y坐标值
        y: yaxis,
        //图片地址
        url: '../../images/location.png',
        //楼层id
        groupID: floor,
        //图片尺寸
        size: 30,
        //marker标注高度
        height: 3,
        callback: function () {
          //回调函数
          console.log('定位点marker加载完成！');
        }
      });
      //添加定位点marker
      this.fmap.addLocationMarker(this.locationMarker);
    } else {
      //旋转locationMarker
      this.locationMarker.rotateTo({
        to: angle,
        duration: 1
      });
      //移动locationMarker
      this.locationMarker.moveTo({
        x: xaxis,
        y: yaxis,
        groupID: floor
      });
    }
  },
  // fengmap.FMImageMarker 自定义图片标注对象，为自定义图层
  addImageMarker(coord) {
    if (this.layer) {
      this.layer.removeAll();
    }

    //获取当前聚焦楼层
    const group = this.fmap.getFMGroup(this.fmap.focusGroupID);
    this.layer = group.getOrCreateLayer('imageMarker');
    this.im = new fengmap.FMImageMarker(this.fmap, {
      //标注x坐标点
      x: coord.x,
      //标注y坐标点
      y: coord.y,
      //设置图片路径
      url: '../../images/blueImageMarker.png',
      //设置图片显示尺寸
      size: 32,
      //标注高度，大于model的高度
      height: 4
    });
    // imageMarker添加自定义属性
    this.im.selfAttr = '当前选中位置';

    this.layer.addMarker(this.im);
  },
  ///////////////////////////////////////////////
  //系统统一回调事件(end)
  //////////////////////////////////////////////

  ///////////////////////////////////////////////
  //楼层控件回调事件(start)
  //////////////////////////////////////////////
  // 设置楼层数据
  loadScrollFloorCtrl: function () {
    // 获取楼层id
    let groupIDs = [];
    this.fmap.listGroups.map((ls) => {
      let obj = {
        alias: ls.alias,
        gid: ls.gid,
        gname: ls.gname
      }
      groupIDs.push(obj);
      return obj;
    });

    this.setData({
      mapGroupIDs: groupIDs.reverse(),
      focusGroupID: this.fmap.focusGroupID
    })

  },
  // 切换楼层
  switchGroup(e) {
    if (this.fmap) {
      this.fmap.focusGroupID = e.detail;
      this.setData({
        focusGroupID: e.detail
      })
    }
  },
  // 切换单、多层
  switchLayers() {
    if (this.fmap) {
      if (!this.data.isAllLayer) {
        this.fmap.visibleGroupIDs = this.fmap.groupIDs;
      } else {
        this.fmap.visibleGroupIDs = [this.fmap.focusGroupID];
      }
    }
    //更改状态
    this.setData({
      isAllLayer: !this.data.isAllLayer
    })
  },
  ///////////////////////////////////////////////
  //楼层控件回调事件(end)
  //////////////////////////////////////////////
  // 跳转
  goToPage(){
    wx.navigateTo({
      url: '/pages/mapnav/mapnav',
    })
  },
})