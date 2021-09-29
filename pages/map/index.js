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
    isNaviRoute: false,
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
            if(this.data.isNaviRoute){
              this.initNaviRoute(coord)
            }else{
              this.setData({ markerInfo: coord, isPopupShow: true });
              this.deleteMarker()
              this.addImageMarker(coord);
            }
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
    this.setData({
      isNaviRoute: true,
      isPopupShow: false
    })
    this.deleteMarker()
    this.addImageMarker(this.data.markerInfo, 'end')
  },
  initNaviRoute: function(coord) {
    //第一次点击
    if (this.clickCount === 0) {
      //记录点击坐标
      this.lastCoord = coord;
      //设置起点坐标
      this.coords[0] = coord;

      //添加起点imageMarker
      this.addImageMarker(coord, 'start');
    } else if (this.clickCount === 1) {
      //第二次点击，添加终点并画路线
      //判断起点和终点是否相同
      if (this.lastCoord.x === coord.x && this.lastCoord.y === coord.y) {
        return;
      }
      //设置终点坐标
      this.coords[1] = coord;
      //添加终点imageMarker
      this.addImageMarker(coord, 'end');
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
      this.addImageMarker(coord, 'start');
    }
    this.clickCount++;
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
  addImageMarker(coord, type) {
    //获取目标点层
    let group = this.fmap.getFMGroup(coord.groupID);
    //创建marker，返回当前层中第一个imageMarkerLayer,如果没有，则自动创建
    let layer = group.getOrCreateLayer('imageMarker');
    //判断该楼层layer是否存在，清除marker时需要将所有楼层marker都清除
    let isExistLayer = this.layers.some(function (item, index, array) {
      return item.groupID === coord.groupID;
    });
    if (!isExistLayer) {
      this.layers.push(layer);
    }
    let markerUrl = '';
    switch (type) {
      case 'start':
        markerUrl = '../../images/start.png';
        break;
      case 'end':
        markerUrl = '../../images/end.png';
        break;
      default:
        markerUrl = '../../images/blueImageMarker.png';
        break;
    }
    //图标标注对象，默认位置为该楼层中心点
    let im = new fengmap.FMImageMarker(this.fmap, {
      x: coord.x,
      y: coord.y,
      //设置图片路径
      url: markerUrl,
      //设置图片显示尺寸
      size: 32,
      //marker标注高度
      height: 4
    });
    //添加imageMarker
    layer.addMarker(im);
  },
  // 画导航线
  drawNaviLine() {
    //根据已加载的fengmap.FMMap导航分析，判断路径规划是否成功
    const analyzeNaviResult = this.naviAnalyser.analyzeNavi(this.coords[0].groupID, this.coords[0], this.coords[1].groupID, this.coords[1], fengmap.FMNaviMode.MODULE_SHORTEST);
    if (fengmap.FMRouteCalcuResult.ROUTE_SUCCESS != analyzeNaviResult) {
      return;
    }
    console.log('this.coords', this.coords)
    //获取路径分析结果对象，所有路线集合
    let results = this.naviAnalyser.getNaviResults();
    //初始化线图层
    let line = new fengmap.FMLineMarker();
    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      //楼层id
      let gid = result.groupId;
      //路径线点集合
      let points = result.getPointList();

      let points3d = [];
      points.forEach(function (point) {
        points3d.push({
          //x坐标点
          'x': point.x,
          //y坐标点
          'y': point.y,
          //线标注高度
          'z': 1
        });
      });

      /**
       * fengmap.FMSegment点集，一个点集代表一条折线
       */
      let seg = new fengmap.FMSegment();
      seg.groupId = gid;
      seg.points = points3d;
      line.addSegment(seg);
    }
    //配置线型、线宽、透明度等
    let lineStyle = {
      //设置线的宽度
      lineWidth: 6,
      //设置线的透明度
      alpha: 0.8,
      //设置线的类型为导航线
      lineType: fengmap.FMLineType.FMARROW,
      //设置线动画,false为动画
      noAnimate: true
    };
    //画线
    this.fmap.drawLineMark(line, lineStyle);
  },
  // 重置路径规划
  resetNaviRoute() {
    //清空导航线
    this.clearNaviLine();
    //清空起点、终点marker
    this.deleteMarker();
    //重置地图点击次数
    this.clickCount = 0;
    //重置上一次点击坐标对象
    this.lastCoord = null;
  },
  // 清空导航线
  clearNaviLine() {
    //清空导航线
    this.fmap.clearLineMark();
  },
  // 清空图片marker事件
  deleteMarker() {
    //删除layer上所有Marker
    this.layers.forEach(function (layer, index) {
      if (layer) {
        layer.removeAll();
      }
    });
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