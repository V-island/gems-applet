// pages/map/index.js
import { fengmap } from '../../utils/fengmap.miniprogram.min.js';
import {
  locationCoords
} from '../../utils/coordinates.js';
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

// 获取应用实例
const app = getApp()
var util = app.GO.util

Page({
  data: {
    placeId: '',
    fmapID: '',
    appName: '',
    deviceList: [],
    deviceInfo: {},
    deviceCount: 1,
    mapLoaded: false, // 地图是否加载完成
    focusGroupID: 1,
    mapGroupIDs: [],
    expand: true, // 展开控件
    enableExpand: true, // 是否允许展开控件操作
    distance: 0,
    minutes: 0,
    seconds: 0,
    prompt: '',
    naviStoped: false,  // 导航是否结束

    markerInfo: {}, // marker信息
    coords: [], // marker信息组
    locateInfo: {}, // 导航进度信息
    naviRouteInfo: {}, // 导航路径信息
    is3D: false,
    isAllLayer: false,
    isOpenBluetooth: false,
    isPopupShow: false, // 是否开始弹框
    isMarkerInfoShow: false, // 是否显示marker信息窗口
    isSelectNaviShow: false,  // 是否显示导航选择弹框
    isLocationInfoShow: false // 是否显示导航进度窗口
  },
   /** ===================  定义全局map变量 ====================== */
  // map对象
  fmap: null,
  // 导航对象
  navi: null,
  // 定义路径规划对象
  naviAnalyser: null,
  // 起止点导航配置
  routeOpiton: {},
  // 当前定位
  location: null,
  //定义定位点marker
  locationMarker: null,
  // 起终点坐标
  coords: [],
  // 定义markert图层数组
  layers: [],
  /** =================== 实时导航参数 ====================== */
  // 初始化定时对象
  setTime: null,
  getTime: null,
  updateLocation: null,
  getSeconds: 1000,
  // 生命周期函数--监听页面加载
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
  // 生命周期函数--监听页面卸载
  onUnload: function () {
    if (this.fmap) {
      this.fmap.dispose();
      this.fmap = null;
    }
    if(this.setTime)
      clearInterval(this.setTime)
    if(this.getTime)
      clearInterval(this.getTime)
  },
  /** =================== 初始化事件 ====================== */
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
          // 初始二维/三维状态,默认3D显示
          defaultViewMode: this.data.is3D ? fengmap.FMViewMode.MODE_3D : fengmap.FMViewMode.MODE_2D,
          // 设置初始指南针的偏移量
          compassOffset: [40, 40],
          // 设置指南针大小
          compassSize: 36,
          // 地图应用名称p
          appName: this.data.appName,
          // 地图应用密钥
          key: '75165ff8c8231fdedc78c2b82447806a',
          // 主题ID
          themeID: '1428639529554505729',
        };
        //初始化地图对象
        this.fmap = new fengmap.FMMap(mapOptions);
        //打开Fengmap服务器的地图数据和主题
        this.fmap.openMapById(this.data.fmapID, function (error) {
          //打印错误信息
          console.log(error);
        });
        // fengmap.FMNaviAnalyser 是可分析最短路径、最快路径并返回分析结果的路径类
        this.naviAnalyser = new fengmap.FMNaviAnalyser(this.fmap);
        //地图加载完成事件
        this.fmap.on('loadComplete', () => {
          console.log('地图加载完成');
          this.setData({
            mapLoaded: true
          })
          //加载楼层切换控件
          this.initFloorControl();
          // 显示指北针
          this.initShowCompass();
          // 加载设备marker
          this.initDevicesMarker();
          // 开始获取实时地址
          if(!this.getTime)
            this.getTime = setInterval(this.getLocationMarker, this.getSeconds);
        });
        // 地图点击事件
        // 通过点击地图，获取位置坐标
        this.fmap.on('mapClickNode', (event) => {
          if(this.data.coords.length == 2) return false;
          if (event.target && event.target.nodeType == fengmap.FMNodeType.MODEL && this.naviAnalyser) {
            //封装点击坐标，模型中心点坐标
            const coord = {
              x: event.target.mapCoord.x,
              y: event.target.mapCoord.y,
              name: event.target.name,
              groupID: event.target ? event.target.groupID : 1
            };
            
            if(this.data.isSelectNaviShow){
              Dialog.confirm({
                title: '提示',
                message: `确定选择 ${coord.name} 为起点？`,
              }).then(() => {
                const coords = this.data.coords
                coords.push(coord)
                this.setData({ coords: coords });
                this.deleteMarker();
                // 创建路径条
                this.createDrawNaviLine(coords);
              }).catch(() => {
                // on cancel
              });
            }else{
              this.setData({ markerInfo: coord, isMarkerInfoShow: true, isPopupShow: true});
              this.deleteMarker();
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
          if(!that.setTime)
            that.setTime = setInterval(that.getDevicesDiscovery, 500);
        })
      }
    })
  },
  // 设置楼层数据
  initFloorControl() {
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
  // 显示指北针
  initShowCompass() {
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
  // 添加设备Devices Marker
  initDevicesMarker() {
    this.data.deviceList.forEach(coord => {
      //获取目标点层
      let group = this.fmap.getFMGroup(parseInt(coord.floor));
      //创建marker，返回当前层中第一个imageMarkerLayer,如果没有，则自动创建
      let layer = group.getOrCreateLayer('imageMarker');
      //图标标注对象，默认位置为该楼层中心点
      let im = new fengmap.FMImageMarker(this.fmap, {
        x: coord.xaxis,
        y: coord.yaxis,
        //设置图片路径
        url: '../../images/redImageMarker.png',
        //设置图片显示尺寸
        size: 32,
        //marker标注高度
        height: 4
      });
      //添加imageMarker
      layer.addMarker(im);
    });
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
  // 清空图片marker事件
  deleteMarker() {
    //删除layer上所有Marker
    this.layers.forEach(function (layer, index) {
      if (layer) {
        layer.removeAll();
      }
    });
  },
  // 画出导航轨迹线
  createDrawNaviLine() {
    const coords = this.data.coords;

    if (!this.navi) {
      //初始化导航对象
      this.navi = new fengmap.FMNavigation({
        //地图对象
        map: this.fmap,
        analyser: this.naviAnalyser,
        speed: 3,
        //导航结果文字描述内容的语言类型参数, 目前支持中英文。参考FMLanguaeType。
        naviLanguage: fengmap.FMLanguageType.ZH,
        //导航中路径规划模式, 支持最短路径、最优路径两种。默认为MODULE_SHORTEST, 最短路径。
        naviMode: fengmap.FMNaviMode.MODULE_SHORTEST,
        //导航中的路线规划梯类优先级, 默认为PRIORITY_DEFAULT, 详情参考FMNaviPriority。
        naviPriority: fengmap.FMNaviPriority.PRIORITY_DEFAULT,
        //调用drawNaviLine绘制导航线时, 是否清除上次调用drawNaviLine绘制的导航线, 默认为true
        autoClearNaviLine: true,
        followAngle: true,
        locationMarkerUrl: '../../images/pointer.png',
        locationMarkerSize: 28,
        locationMarkerHeight: 7,
        //导航线与楼层之间的高度偏移设置。默认是1。
        lineMarkerHeight: 6,
        // 设置导航线的样式
        lineStyle: {
          // 导航线样式
          lineType: fengmap.FMLineType.FMARROW,
          // 设置线的宽度
          lineWidth: 6,
          //设置线动画,false为动画
          noAnimate: false
        }
      });
    }
    // 赋值导航配置
    this.routeOpiton = {
      start: {
        x: coords[1].x,
        y: coords[1].y,
        groupID: coords[1].groupID,
        url: '../../images/start.png',
        size: 32,
        height: 4
      },
      end: {
        x: coords[0].x,
        y: coords[0].y,
        groupID: coords[0].groupID,
        url: '../../images/end.png',
        size: 32,
        height: 4
      },
      mode: fengmap.FMNaviMode.MODULE_SHORTEST,
      priority: fengmap.FMNaviPriority.PRIORITY_DEFAULT
    }
    //添加起点
    this.navi.setStartPoint(this.routeOpiton.start);
    //添加终点
    this.navi.setEndPoint(this.routeOpiton.end);
    // 画出导航线
    this.navi.drawNaviLine();

    //距终点的距离
    let distance = this.navi.naviDistance;
    //普通人每分钟走80米。
    let _time = distance / 80;
    let minutes = parseInt(_time);
    let seconds = Math.floor((_time % 1) * 60);
    this.setData({
      naviRouteInfo: {
        distance: `${distance.toFixed(1)}米`,
        time: `${minutes}分钟${seconds}秒`,
      }
    });
  },
  /** =================== 系统功能事件 ====================== */
  // 搜索附近的蓝牙设备
  getDevicesDiscovery: function () {
    var that = this;
    wx.startBluetoothDevicesDiscovery({
      success: function (res) {
        //获取在蓝牙模块生效期间所有已发现的蓝牙设备
        wx.getBluetoothDevices({
          success: function (res) {
            let deviceInfo = that.data.deviceInfo,
                deviceCount = that.data.deviceCount+1
            //定义一个对象数组来接收Beacon的信息
            let arrayIBeaconInfo = res.devices.filter(devices => that.data.deviceList.some(item => devices.deviceId === item.mac));

            arrayIBeaconInfo.forEach(item => {
              if(deviceInfo.hasOwnProperty(item.deviceId))
                deviceInfo[item.deviceId].push(item.RSSI)
              else
                deviceInfo[item.deviceId] = [item.RSSI]
            });
            if(deviceCount > 5){
              console.log('deviceInfo', deviceInfo)
              util.setLocation(deviceInfo, function () {
                that.setData({
                  deviceInfo: {},
                  deviceCount: 1,
                })
              })
            }else{
              that.setData({
                deviceInfo: deviceInfo,
                deviceCount: deviceCount,
              })
            }
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
  // 获取当前实时定位
  getLocationMarker: function () {
    var that = this;
    util.getLocation(function (location) {
      if(location == null) return;

      that.location = {
        x: location.xaxis,
        y: location.yaxis,
        groupID: location.floor
      };
      if(!that.data.isLocationInfoShow)
        that.addOrMoveLocationMarker(location);
    })
  },
  // 添加本地定位Marker
  // fengmap.FMLocationMarker 自定义图片标注对象，为自定义图层
  addOrMoveLocationMarker({xaxis, yaxis, floor}) {
    var that = this
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
      wx.onCompassChange((res)=>{
        that.locationMarker.rotateTo({
          to: -res.direction,
          duration: 1
        });
      })
      //移动locationMarker
      this.locationMarker.moveTo({
        x: xaxis,
        y: yaxis,
        groupID: floor
      });
    }
  },
  // 是否跳过蓝牙验证
  onLeapfrog: function() {
    this.setData({
      isOpenBluetooth: true
    })
    // 初始化地图
    this.initFengMap();
  },
  /** =================== 系统滑动事件 ====================== */
  // 手指触摸动作开始
  handleTouchStart(e) {
    this.canvas.dispatchTouchEvent({
      ...e,
      type: 'touchstart'
    })
  },
  // 手指触摸后移动
  handleTouchMove(e) {
    this.canvas.dispatchTouchEvent({
      ...e,
      type: 'touchmove'
    })
  },
  // 手指触摸动作结束
  handleTouchEnd(e) {
    this.canvas.dispatchTouchEvent({
      ...e,
      type: 'touchend'
    })
  },
  /** =================== 蜂鸟控件事件 ====================== */
  // 切换楼层
  handleSwitchGroup(e, groupID) {
    if (this.fmap) {
      let focusGroupID = groupID !== undefined ? groupID : e.detail
      this.fmap.focusGroupID = focusGroupID;
      this.setData({
        focusGroupID: focusGroupID
      })
    }
  },
  // 切换单、多层
  handleSwitchLayers() {
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
  /** =================== 模拟导航 ====================== */
  // 模拟导航事件
  onSimulationNavi() {
    const that = this;

    this.navi.simulate();
    this.navi.on('walking', function(info) {
      //距终点的距离
      let distance = info.remain;
      //路线提示信息
      let prompt = that.navi.naviDescriptionsData[info.index];
      //普通人每分钟走80米。
      let time = distance / 80;
      let minutes = parseInt(time);
      let seconds = Math.floor((time % 1) * 60);

      that.setData({
        locateInfo: {
          distance: distance.toFixed(0),
          minutes: minutes,
          seconds: seconds,
          prompt: prompt,
          route: that.data.markerInfo
        }
      });

      // 当剩余距离小于设置的距离终点的最小距离时，自动结束导航
      if(distance < 3){
        that.navi.pause();
        const info = that.data.naviRouteInfo
        Dialog.alert({
          message: `本次行程距离${info.distance},历时${info.time}`,
          theme: 'round-button',
          selector: '#round-dialog',
          showCancelButton: false
        }).then(() => {
          that.onCloseLocationInfoPopup()
        });
      }
    });
  },
  /** =================== 实时导航 ====================== */
  // 实时导航事件
  onRealTimeNavi() {
    const that = this;
    //定时器
    this.onUpdateLocation(()=>{
      this.navi.locate(this.location)
    });
    this.navi.on('walking', function(info) {
      let point = that.location || info.point;
      // 定位点的路线偏移距离
      let distance = info.distance;
      // 距终点的距离
      let remain = info.remain;
      // 路线提示信息
      let prompt = that.navi.naviDescriptionsData[info.index];
      // 普通人每分钟走80米。
      let time = remain / 80;
      let minutes = parseInt(time);
      let seconds = Math.floor((time % 1) * 60);

      that.setData({
        locateInfo: {
          remain: remain.toFixed(0),
          minutes: minutes,
          seconds: seconds,
          prompt: prompt,
          route: that.data.markerInfo
        }
      });
      
      // 更新定位图标的位置及旋转角度
      that.setLocationMakerPosition(that, point, info.angle);

      // 当路线偏移距离大于设置的路径偏移的最大距离时，自动结束导航
      // 路径偏移的最大距离，单位：米
      if (distance > 13) {
        console.log('路径偏移，重新规划路线');
        // 清除循环
        that.stopUpdateLocation();
        // 重新绘制导航线
        that.resetRealTimeNavi(that, point);
      }
      // 当剩余距离小于设置的距离终点的最小距离时，自动结束导航
      // 单位：米
      if(remain < 3){
        // 清除循环
        that.stopUpdateLocation();
        that.navi.pause();
        const info = that.data.naviRouteInfo
        Dialog.alert({
          message: `本次行程历时${info.time}`,
          theme: 'round-button',
          selector: '#round-dialog',
          showCancelButton: false
        }).then(() => {
          that.onCloseLocationInfoPopup()
        });
      }
    });
  },
  // 设置定位标注点位置信息
  setLocationMakerPosition(that, coord, angle){
    if (angle) {
      // 定位点方向始终与路径线保持平行
      that.locationMarker.rotateTo({
        to: -angle,
        duration: 0.5
      });
      // 第一人称需旋转地图角度
      that.fmap.rotateTo({
        to: angle,
        duration: 0.5,
      })
    }
    // 不同楼层
    var groupID = that.locationMarker.groupID;
    if (groupID !== coord.groupID) {
      // 重新设置聚焦楼层
      that.fmap.changeFocusToGroup({
        duration: 1,
        gid: coord.groupID,
      })
      // 删除定位点marker
      that.fmap.removeLocationMarker(that.locationMarker);
      // fengmap.FMLocationMarker 自定义图片标注对象，为自定义图层
      that.locationMarker = new fengmap.FMLocationMarker(that.fmap, {
        x: coord.x,  
        y: coord.y,  
        url: '../../images/location.png',
        groupID: coord.groupID, 
        size: 30,   
        height: 3,
      });
      // 添加定位点marker
      that.fmap.addLocationMarker(that.locationMarker);
    }

    //移动locationMarker
    that.locationMarker.moveTo({
      x: coord.x,
      y: coord.y,
      groupID: coord.groupID
    });
  },
  // 路径偏移，进行路径重新规划
  resetRealTimeNavi(that, coords) {
    //添加起点
    that.navi.setStartPoint({
      x: coords.x,
      y: coords.y,
      groupID: coords.groupID,
      url: '../../images/start.png',
      size: 32,
      height: 4
    });

    that.navi.clearNaviLine();
    that.navi.drawNaviLine();
    that.onRealTimeNavi();
  },
  // 更新实时导航位置更新
  onUpdateLocation(callback){
    this.updateLocation = setInterval(callback, this.getSeconds);
  },
  // 停止实时导航位置更新
  stopUpdateLocation() {
    clearInterval(this.updateLocation);
    this.updateLocation = null;
  },
  /** =================== 通用事件 ====================== */
  // 路线选择
  onSelectNavi: function() {
    const coords = [this.data.markerInfo]
    this.setData({
      isSelectNaviShow: true,
      isMarkerInfoShow: false,
      coords: coords
    })
    this.deleteMarker();

    //添加终点imageMarker
    this.addImageMarker(this.data.markerInfo, 'end');
  },
  // 关闭marker弹框
  onCloseMarkerPopup: function() {
    this.setData({ 
      markerInfo: {},
      isPopupShow: false,
      isMarkerInfoShow: false
    });
    this.deleteMarker();
    this.initDevicesMarker();
  },
  // 关闭选择导航弹框
  onCloseSelectNaviPopup: function() {
    if(this.data.coords.length == 2) this.navi.clearAll()

    this.setData({
      isSelectNaviShow: false,
      isMarkerInfoShow: true,
      coords: []
    });
    this.deleteMarker();
    //添加imageMarker
    this.addImageMarker(this.data.markerInfo);
  },
  // 关闭导航信息弹框
  onCloseLocationInfoPopup: function() {
    const coords = [this.data.markerInfo]
    this.setData({
      isLocationInfoShow: false,
      isSelectNaviShow: true,
      coords: coords
    });
    // 清除循环
    if(this.updateLocation) this.stopUpdateLocation();

    this.navi.stop();
    this.navi.clearAll();
    //添加终点imageMarker
    this.addImageMarker(this.data.markerInfo, 'end');
  },
  // 开始实时导航
  handleRealTimeNavi: function() {
    this.onRealTimeNavi();
    this.setData({
      isLocationInfoShow: true,
      isSelectNaviShow: false,
    });
  },
  // 开始模拟导航
  handleSimulationNavi: function() {
    this.onSimulationNavi();
    this.setData({
      isLocationInfoShow: true,
      isSelectNaviShow: false,
    });
  },
  // 跳转
  onGoToPage(){
    wx.navigateTo({
      url: '/pages/mapnav/mapnav',
    })
  },
})