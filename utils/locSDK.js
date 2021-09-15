// 模拟坐标
const _mockdata = [
    { x: 12675399.812, y: 2583617.64, angle: 0 },
    { x: 12675399.85, y: 2583617.64, angle: 0 },
    { x: 12675399.845, y: 2583621.941, angle: 0 },
    { x: 12675399.845, y: 2583636.735, angle: -90 },
    { x: 12675319.604, y: 2583636.735, angle: -90 },
    { x: 12675324.922, y: 2583636.735, angle: -60 },
    { x: 12675339.241, y: 2583641.487, angle: -60 },
    { x: 12675352.482, y: 2583645.055, angle: -60 },
    { x: 12675367.156, y: 2583650.198, angle: -90 },
    { x: 12675344.931, y: 2583650.198, angle: -90 },
    { x: 12675337.982, y: 2583650.198, angle: -90 },
    { x: 12675325.436, y: 2583650.198, angle: -90 },
    { x: 12675332.715, y: 2583650.198, angle: -90 },
    { x: 12675341.638, y: 2583650.198, angle: -90 },
    { x: 12675345.618, y: 2583650.198, angle: 0 },
    { x: 12675345.618, y: 2583661.696, angle: 0 },
    { x: 12675354.36, y: 2583671.82, angle: -90 }
];

/**
 * 这是一个模拟的定位sdk，用来定期返回位置更新,仅用作参考。
 */
export default class LocSDK {
    constructor() {
        this._freq = 800;  //定时器间隔时间
        this._index = 0;  //记录当前_mockdata的index值
        this._timer = null;
    }

    /**
     * 返回当前的位置信息
     */
    _getMockdata() {
        let _data;
        if (this._index > _mockdata.length - 1) {
            this._index = 0;
        }
        _data = _mockdata[this._index];
        this._index++;
        return _data
    }

    /**
     * 模拟更新位置，按照时间间隔更新位置信息。
     * @param {*} 回调函数
     */
    updateLocation(cb) {
        this._timer = setInterval(()=>cb(this._getMockdata()), this._freq)
    }

    /**
     * 停止位置更新
     */
    stopUpdateLocation() {
        if(this._timer){
            clearInterval(this._timer);
            this._timer = null;
        }
        console.log('update stoped.');
    }

}