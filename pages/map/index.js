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
    deviceList: [],
    deviceInfo: {},
    deviceCount: 1,
    mapLoaded: false, //地图是否加载完成
    focusGroupID: 1,
    mapGroupIDs: [],
    expand: true, //展开控件
    enableExpand: true, //是否允许展开控件操作
    distance: 0,
    minutes: 0,
    seconds: 0,
    prompt: '',
    naviStoped: false,  //导航是否结束
    markerInfo: {},
    is3D: false,
    isAllLayer: false,
    isOpenBluetooth: false,
    isPopupShow: false,
    isPopupOverlay: false,
    hasMarker: true,
    isNaviRoute: false,
    isStartNavi: false
  },
  // 定义全局map变量
  fmap: null,
  location: null,
  //定义定位点marker
  locationMarker: null,
  // 定义路径规划对象
  naviAnalyser: null,
  // 判断起点是否是同一处坐标
  firstCoord: null,
  lastCoord: null,
  // 起终点坐标
  coords: [],
  // 定义markert图层数组
  layers: [],
  // 导航
  // 导航前地图缩放比例
  startNaviScaleLevel: 20,
  // 导航过程中地图缩放比例
  naviScaleLevel: 22,
  // 导航对象
  navi: null,
  // 导航开关
  naviSwitch: true,
  // 距离终点的最大距离，结束导航 单位：米
  maxEndDistance: 5,
  // 路径偏移的最大距离，单位：米
  maxOffsetDis: 15,
  // 路径偏移的最小距离，在最小距离以内坐标点自动约束到路径线上
  minOffsetDis: 3,
  // 路径线真实坐标点数据
  coordsData: [],
  //定位点下标
  coordIndex: 0,
  // 当前定位点原始坐标
  currentCoord: null,
  // 导航请求定位点定时器
  naviInt: null,
  // 初始化定时对象
  setTime: null,
  getTime: null,
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
    if(this.setTime)
      clearInterval(this.setTime)
    if(this.getTime)
      clearInterval(this.getTime)
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

          //加载楼层切换控件
          this.initFloorControl();

          // 显示指北针
          this.showCompass();

          // 加载设备marker
          this.addDevicesMarker();
          
          if(!this.getTime)
            this.getTime = setInterval(this.getLocationMarker, 1000);
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
              if(this.coords.length == 2 && this.firstCoord && this.lastCoord){
                //重置路径规划
                this.resetNaviRoute();
                this.coords = []
              }
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
          if(!that.setTime)
            that.setTime = setInterval(that.getDevicesDiscovery, 200);
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
            let deviceInfo = that.data.deviceInfo,
                deviceCount = that.data.deviceCount
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
                deviceCount: deviceCount++,
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
      console.log('location', location)
      if(location == null) return;
      that.addOrMoveLocationMarker(location)
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

    //添加终点imageMarker
    this.initNaviRoute(this.data.markerInfo, true);
  },
  onCloseRoute: function() {
    this.setData({ isNaviRoute: false, isNaviRoute: true });
  },
  initNaviRoute: function(coord, last) {
    if(!this.firstCoord && !last){
      //记录点击坐标
      this.firstCoord = coord;
      //设置起点坐标
      this.coords[0] = coord;
      //添加起点imageMarker
      this.addImageMarker(coord, 'start');
    }else if(!this.lastCoord){
      //记录点击坐标
      this.lastCoord = coord;
      //设置终点坐标
      this.coords[1] = coord;
      //添加终点imageMarker
      this.addImageMarker(coord, 'end');
    }
    // //设置完起始点后，调用此方法画出导航线
    if(this.coords.length == 2 && this.firstCoord && this.lastCoord){
      this.createNavi(this.coords);
    }
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
          to: res.direction,
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
  // 添加设备Devices Marker
  addDevicesMarker() {
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
  // 画导航线
  drawNaviLine() {
    //根据已加载的fengmap.FMMap导航分析，判断路径规划是否成功
    const analyzeNaviResult = this.naviAnalyser.analyzeNavi(this.coords[0].groupID, this.coords[0], this.coords[1].groupID, this.coords[1], fengmap.FMNaviMode.MODULE_SHORTEST);
    console.log(analyzeNaviResult, fengmap.FMRouteCalcuResult.ROUTE_SUCCESS)
    if (fengmap.FMRouteCalcuResult.ROUTE_SUCCESS != analyzeNaviResult) {
      return;
    }
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
  //导航回调事件(start)
  //////////////////////////////////////////////
  /**
   * 创建导航
   * fengmap.FMNavigation 导航相关的控制类,封装了自动设置起始点标注，路径分析，模拟导航，导航动画的功能。
   */
  createNavi(coords) {
    if (!this.navi) {
      //初始化导航对象
      this.navi = new fengmap.FMNavigation({
        //地图对象
        map: this.fmap,
        //导航结果文字描述内容的语言类型参数, 目前支持中英文。参考FMLanguaeType。
        naviLanguage: fengmap.FMLanguageType.ZH,
        //导航中路径规划模式, 支持最短路径、最优路径两种。默认为MODULE_SHORTEST, 最短路径。
        naviMode: fengmap.FMNaviMode.MODULE_SHORTEST,
        //导航中的路线规划梯类优先级, 默认为PRIORITY_DEFAULT, 详情参考FMNaviPriority。
        naviPriority: fengmap.FMNaviPriority.PRIORITY_DEFAULT,
        //调用drawNaviLine绘制导航线时, 是否清除上次调用drawNaviLine绘制的导航线, 默认为true
        autoClearNaviLine: true,
        //导航线与楼层之间的高度偏移设置。默认是1。
        lineMarkerHeight: 1.5,
        // 设置导航线的样式
        lineStyle: {
          // 导航线样式
          lineType: fengmap.FMLineType.FMARROW,
          // 设置线的宽度
          lineWidth: 6,
          //设置线动画,false为动画
          noAnimate: true
        }
      });
    }

    //添加起点
    this.navi.setStartPoint({
      x: coords[0].x,
      y: coords[0].y,
      groupID: coords[0].groupID,
      url: '../../images/start.png',
      size: 32,
      height: 4
    });

    //添加终点
    this.navi.setEndPoint({
      x: coords[1].x,
      y: coords[1].y,
      groupID: coords[1].groupID,
      url: '../../images/end.png',
      size: 32,
      height: 4
    });

    // 画出导航线
    this.navi.drawNaviLine();

    //解析定位点数据
    // this.analyseLocationData(0);

    //监听导航事件
    this.navi.on('walking', (data) => {

      /**
       * 当定位点偏离路径线大于约定的最大偏移距离时，进行路径重新规划
       */
      if (data.distance > this.minOffsetDis) {
        //在最小和最大偏移距离之间，坐标点用原始定位坐标
        data.point = this.currentCoord;
      }

      //更新导航信息
      this.setNaviDescriptions(data);

      //更新定位图标的位置及旋转角度
      this.setLocationMakerPosition(data.point, data.angle);
      if (data.distance > this.maxOffsetDis) {
        console.log('路径偏移，重新规划路线');
        clearTimeout(this.naviInt);
        //重新设置起终点坐标，画路径线，重新开始导航
        this.resetNaviRoute(data.point);
        return;
      }

      /**
       * 当剩余距离小于设置的距离终点的最小距离时，自动结束导航
       */
      if (data.remain < this.maxEndDistance || data.remain == 0) {
        console.log('距离小于设置的距离终点的最小距离，导航自动结束');
        //结束导航
        this.stopNavi();
        this.setData({
          naviStoped: true
        })
        return;
      }
    });
  },

  /**
   * 定位点数据解析，模拟数据点
   * 真实项目中应该通过定位接口进行实时定位
   * firstRoute:路径偏移前定位点集合
   * seconedRoute:路径偏移后重新路径规划定位点集合
   */
  analyseLocationData(type) {
    if (type === 0) {
      //第一条路径线模拟坐标点
      this.coordsData = locationCoords['firstRoute'];
    } else {
      //重新规划后路径线模拟坐标点
      this.coordsData = locationCoords['seconedRoute'];
    }
  },

  /**
   * 定位真实导航坐标
   */
  changeCoord() {
    clearTimeout(this.naviInt);
    //定时器
    this.naviInt = setTimeout(() => {
      if (!this.fmap || !this.navi) return;

      if (this.coordIndex >= this.coordsData.length || this.data.naviStoped) {
        this.stopNavi();
        return;
      }
      this.currentCoord = this.coordsData[this.coordIndex];

      /**
       * 1.用于真实导航，设置定位系统所返回的真实定位坐标，内部自动路径约束，同时触发walking事件
       * 返回如下结果： {remain: 到终点的剩余距离, walk: 已经走过的距离, distanceToNext: 是下一个转角处的距离,
       * angle: 当前路线与正北方向的角度, index: 当前路段的索引, point: 路径约束后的点, groupID, 当前的楼层id}
       */
      this.navi.locate(this.currentCoord);

      /**
       * 2.用于真实导航，设置定位系统所返回的真实定位坐标，内部无路径约束，同时触发walking事件，
       * 返回如下结果： {remain: 到终点的剩余距离, walk: 已经走过的距离, distanceToNext: 是下一个转角处的距离,
       * angle: 当前路线与正北方向的角度, index: 当前路段的索引, point: 路径约束后的点, groupID, 当前的楼层id}
       * 此方法与locate的区别为内部不在内部自动计算约束
       */
      /*this.navi.locateNoConstraint(this.currentCoord);*/

      this.coordIndex++;
      this.changeCoord();
    }, 500);
  },

  /**
   * 路径偏移，进行路径重新规划
   */
  resetNaviRoute(coordItem) {

    if (!this.navi) {
      return;
    }

    //重置导航参数
    this.coordIndex = 0;

    //更新起点坐标
    this.navi.setStartPoint({
      x: coordItem.x,
      y: coordItem.y,
      groupID: coordItem.groupID,
      url: '../../images/start.png',
      size: 32
    });

    //更新终点坐标
    this.navi.setEndPoint({
      x: naviRealPoints[1].x,
      y: naviRealPoints[1].y,
      groupID: naviRealPoints[1].groupID,
      url: '../../images/end.png',
      size: 32
    });

    //画路径线
    this.navi.drawNaviLine();

    //初始化第二段路径线的起点
    this.analyseLocationData(1);

    //导航开始
    this.changeCoord();
  },

  /**
   * 开始导航
   */
  startNavi() {

    if (!this.naviSwitch) {
      return;
    }

    //导航结束之后再次点击开始导航，需重新进行路线规划及模拟定位点
    if (this.data.naviStoped) {
      this.createNavi(naviRealPoints);
      this.setData({
        naviStoped: false
      })
    }

    //导航开关为true且已经加载完locationMarker是可进行导航操作
    if (this.naviSwitch && this.locationMarker) {
      this.naviSwitch = false;
      this.coordIndex = 0;
      //切换聚焦楼层为起点开始楼层
      if (this.navi.startMarker.groupID !== this.fmap.focusGroupID) {
        this.switchGroup(null, this.navi.startMarker.groupID)
      }
      //将定位点定位到起点楼层
      if (this.locationMarker.groupID != this.navi.startMarker.groupID) {
        //设置locationMarker的位置
        this.locationMarker.setPosition({
          //设置定位点的x坐标
          x: this.navi.startMarker.x,
          //设置定位点的y坐标
          y: this.navi.startMarker.y,
          //设置定位点所在楼层
          groupID: this.navi.startMarker.groupID
        });
      }
      //获取地图开始导航前地图缩放比例
      this.startNaviScaleLevel = this.fmap.mapScaleLevel;
      //放大导航地图
      this.fmap.mapScaleLevel = {
        level: this.naviScaleLevel,
        duration: 0.5,
        callback: function () { }
      };
      //禁用楼层切换控件
      this.setData({
        expand: false,
        enableExpand: false
      })
      //将地图的倾斜角度缓动至
      this.fmap.tiltTo({
        to: 80,
        duration: 1
      });
      //导航开始
      this.changeCoord();

    }
  },

  /**
   * 结束导航，重置导航开关参数
   */
  stopNavi() {
    //修改导航状态
    this.naviSwitch = true;
    this.setData({
      naviStoped: true,
      enableExpand: true
    })
    //还原导航前地图缩放比例
    this.fmap.mapScaleLevel = {
      level: this.startNaviScaleLevel,
      duration: 0.5,
      callback: function () { }
    };
    clearTimeout(this.naviInt);
  },

  /**
   * 距离、时间信息展示
   */
  setNaviDescriptions(data) {
    //距终点的距离
    let distance = data.remain;
    //路线提示信息
    let prompt = this.navi.naviDescriptions[data.index];
    if (distance < this.maxEndDistance) {
      // 导航结束
      this.stopNavi();
      this.setData({
        naviStoped: true
      })
      return;
    }
    //普通人每分钟走80米。
    let time = distance / 80;
    let m = parseInt(time);
    let s = Math.floor((time % 1) * 60);

    //距离终点距离、时间信息展示
    this.setData({
      naviStoped: false,
      distance: distance.toFixed(1),
      minutes: m,
      seconds: s,
      prompt: prompt,
    })
  },
  ///////////////////////////////////////////////
  //导航回调事件(end)
  //////////////////////////////////////////////

  ///////////////////////////////////////////////
  //楼层控件回调事件(start)
  //////////////////////////////////////////////
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
  // 切换楼层
  switchGroup(e, groupID) {
    if (this.fmap) {
      let focusGroupID = groupID !== undefined ? groupID : e.detail
      this.fmap.focusGroupID = focusGroupID;
      this.setData({
        focusGroupID: focusGroupID
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