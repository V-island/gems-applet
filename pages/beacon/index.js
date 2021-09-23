// pages/beacon/index.js
Page({
    data: {
        iBeacon: []
    },
    onLoad: function (options) {
        var that = this
        that.getiBeaconInfo();
    },
    onReady: function () {
        var that = this
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log("正确打开蓝牙适配器");
                //页面初次渲染完成后每个1s进行刷新
                setInterval(that.onLoad, 1000);
            },
            fail: function (res) {
                wx.showModal({
                    title: '提示',
                    content: '是否打开手机蓝牙？',
                    showCancel: true,
                    cancelText: '否',
                    cancelColor: 'black',
                    confirmText: '是',
                    confirmColor: '#44ADE2',
                    success: function (res) {
                        if (res.cancel) {
                            wx.showModal({
                                title: '提示',
                                content: '请前往手机设置打开蓝牙',
                            });
                            //页面初次渲染完成后每个1s进行刷新
                            setInterval(that.onLoad, 1000);
                        }
                    },

                })
            }
        })
    },
    // 获取Beacon信息
    getiBeaconInfo: function () {
        var that = this;
        //是否正确打开蓝牙
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log("正常打开蓝牙适配器！");
                //开始搜索附近的蓝牙设备
                wx.startBluetoothDevicesDiscovery({
                    success: function (res) {
                        //获取在蓝牙模块生效期间所有已发现的蓝牙设备
                        wx.getBluetoothDevices({
                            success: function (res) {
                                //j是表示获取到的Beacon个数
                                var j = 0;
                                //定义一个对象数组来接收Beacon的信息
                                var arrayIBeaconInfo = [];
                                //定义一个对象来存储Beacon的信息，其中ids是存储Beacon的deviceId，rssis是存储Beacon的RSSI
                                var objectIBeaconInfo = {
                                    ids: '',
                                    rssis: 0
                                };
                                for (var i = 0; i < res.devices.length; i++) {
                                    //获取特定的八个Beaon，其中这些具体的deviceId可以在智石提供的软件BrightBeacon中的获取，在BrightBeacon中，deviceId是对应的MAC
                                    if (res.devices[i].deviceId == '30:EB:1F:1A:56:5C' ||res.devices[i].deviceId == '30:EB:1F:1A:56:63' || res.devices[i].deviceId == '30:EB:1F:1A:56:62' || res.devices[i].deviceId == '30:EB:1F:1A:56:5F' || res.devices[i].deviceId == '30:EB:1F:1A:56:61') {
                                        objectIBeaconInfo = {
                                            ids: res.devices[i].deviceId,
                                            rssis: res.devices[i].RSSI
                                        };
                                        //将对象加入到Beacon数组中
                                        arrayIBeaconInfo.push(objectIBeaconInfo);
                                        j++;
                                        console.log(res.devices[i])
                                    }
                                }
                                //冒泡算法，将rssi值在arrayIBeaconInfo中从大到小进行排列
                                //temp为中间值
                                var temp;
                                for (var i = 0; i < arrayIBeaconInfo.length; i++) {
                                    for (var j = i + 1; j < arrayIBeaconInfo.length; j++) {
                                        // console.log("正在执行冒泡算法");
                                        if (Math.abs(arrayIBeaconInfo[j].rssis) <= Math.abs(arrayIBeaconInfo[i].rssis)) {
                                            temp = arrayIBeaconInfo[i];
                                            arrayIBeaconInfo[i] = arrayIBeaconInfo[j];
                                            arrayIBeaconInfo[j] = temp;
                                        }
                                    }

                                }
                                //将对象存入data中的全局变量Beacon中
                                that.setData({
                                    Beacon: arrayIBeaconInfo,
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
            fail: function (res) {
                console.log("没有打开蓝牙适配器");
            },
            complete: function (res) {
                //complete
            }
        })
    },
})