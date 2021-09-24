// pages/map/index.js

import {
  fengmap
} from '../../utils/fengmap.miniprogram.min.js';
import LocSDK from '../../utils/locSDK';

Page({
  data: {
    mapLoaded: false, //地图是否加载完成
    focusGroupID: 1,
    mapGroupIDs: [],
    mapCenter: {
      x: 114,
      y: 22
    },
    is3D: true,
    isAllLayer: false,
    isOpenBluetooth: false,
  },
  // 定义全局map变量
  fmap: null,
  location: null,
  //定义定位点marker
  locationMarker: null,
  // 定位sdk实例
  locSDK: null,
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
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
        //开始搜索附近的蓝牙设备
        that.getDevicesDiscovery();
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
    if (this.locSDK) {
      this.locSDK.stopUpdateLocation();
    }
  },
  // 初始化蜂鸟地图
  initFengMap: function () {
    // 获取canvas
    wx.createSelectorQuery().select('#fengMap').node().exec((res) => {
      const canvas = res[0].node;
      this.canvas = canvas

      wx.createSelectorQuery().select("#temp").node().exec((tempRes) => {
        const tmpCanvas = tempRes[0].node;

        const fmapID = "1428635104853151746";

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
          appName: '星火源',
          // 地图应用密钥
          key: '75165ff8c8231fdedc78c2b82447806a',
        };

        //初始化地图对象
        this.fmap = new fengmap.FMMap(mapOptions);

        //打开Fengmap服务器的地图数据和主题
        this.fmap.openMapById(fmapID, function (error) {
          //打印错误信息
          // console.log(error);
        });

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
          console.log(event);
          if (!event.nodeType) {
            if (this.selectedModel) {
              this.selectedModel.selected = false;
            }
          }
          //地图模型
          const target = event.target;
          if (!target) {
            return;
          }

          let info = '';

          //筛选点击类型,打印拾取信息
          switch (target.nodeType) {
            //地面模型
            case fengmap.FMNodeType.FLOOR:
              if (this.clickedPOI && event.eventInfo.eventID === this.eventID) return;
              info = `地图位置坐标：x:${event.eventInfo.coord.x}，y:${event.eventInfo.coord.y}`;
              if (this.selectedModel) {
                this.selectedModel.selected = false;
              }
              //弹出信息框
              wx.showModal({
                title: '拾取对象类型：地图',
                content: info,
                showCancel: false,
              })
              break;

              //model模型
            case fengmap.FMNodeType.MODEL:
              if (this.clickedPOI && event.eventInfo.eventID === this.eventID) {
                this.clickedPOI = false;
                return;
              }
              //过滤类型为墙的model
              if (target.typeID === 300000) {
                //其他操作
                return;
              }
              info = `FID：${target.FID}
                model中心点坐标：x: ${target.mapCoord.x}，y:${target.mapCoord.y}
                地图位置坐标：x: ${event.eventInfo.coord.x}，y:${event.eventInfo.coord.y}`

              //模型高亮
              if (this.selectedModel && this.selectedModel.FID != target.FID) {
                this.selectedModel.selected = false;
              }
              target.selected = true;
              this.selectedModel = target;

              //弹出信息框
              wx.showModal({
                title: '拾取对象类型：模型',
                content: info,
                showCancel: false,
              })
              break;

              //公共设施、图片标注模型
            case fengmap.FMNodeType.FACILITY:
            case fengmap.FMNodeType.IMAGE_MARKER:
              this.clickedPOI = true;
              this.eventID = event.eventInfo.eventID;
              info = `地图位置坐标：x: ${event.eventInfo.coord.x}，y: ${event.eventInfo.coord.y}`;
              if (this.selectedModel) {
                this.selectedModel.selected = false;
              }
              //弹出信息框
              wx.showModal({
                title: '拾取对象类型：公共设施',
                content: info,
                showCancel: false,
              })
              break;
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

    // 初始化定位sdk
    this.locSDK = new LocSDK();
    // 实时定位
    this.locSDK.updateLocation((data) => {
      if (this.data.mapLoaded) {
        this.addOrMoveLocationMarker(data)
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
  // 添加本地定位Marker
  addOrMoveLocationMarker(data) {
    if (!this.locationMarker) {
      /**
       * fengmap.FMLocationMarker 自定义图片标注对象，为自定义图层
       */
      this.locationMarker = new fengmap.FMLocationMarker(this.fmap, {
        //x坐标值
        x: data.x,
        //y坐标值
        y: data.y,
        //图片地址
        url: '../../images/location.png',
        //楼层id
        groupID: 1,
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
        to: data.angle,
        duration: 1
      });
      //移动locationMarker
      this.locationMarker.moveTo({
        x: data.x,
        y: data.y,
        groupID: 1
      });
    }
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
    wx.startBluetoothDevicesDiscovery({
      success: function (res) {
        //获取在蓝牙模块生效期间所有已发现的蓝牙设备
        wx.getBluetoothDevices({
          success: function (res) {
            //定义一个对象数组来接收Beacon的信息
            var arrayIBeaconInfo = [];
            for (var i = 0; i < res.devices.length; i++) {
              //在BrightBeacon中，deviceId是对应的MAC
              if (res.devices[i].deviceId == '30:ER:1F:1A:56:62' || res.devices[i].deviceId == '30:ER:1F:1A:56:61' || res.devices[i].deviceId == 'AC:23:3F:20:D3:81' || res.devices[i].deviceId == 'AC:23:3F:20:D3:81' || res.devices[i].deviceId == 'AC:23:3F:20:D3:81') {
                //将对象加入到Beacon数组中
                arrayIBeaconInfo.push(`${res.devices[i].deviceId},${res.devices[i].RSSI}`);
              }
            }
            //将对象存入data中的全局变量Beacon中
            that.setData({
              Beacon: arrayIBeaconInfo.join(';'),
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
  ///////////////////////////////////////////////
  //楼层控件回调事件(end)
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
})