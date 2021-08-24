/** 
 * 通用配置文件
 * 901 请求超时调用request方法失败
 * 400 图片上传失败
 */
var { hexMD5, b64Md5 } = require('/md5.js')
var contentType = 'application/x-www-form-urlencoded';
var contentTypeJson = 'application/json';

/**
 * 微信登录
 * params fn 回调函数  params传入参数 code
 * return fn 回调函数
 */
function login(fn) {
  var _self = this;

  wx.login({
    success: function (res) {
      // console.log('wx.login',res)
      if (res.code) {
        var params = {
          code: res.code
        }
        _self.request('POST', params, `wx/login`, contentType, '', function (res) {
          //存储token返回数据
          // console.log('exf.login', res, res.data)
          //请求成功
          if (res.data) {
            _self.storage('set', 'token', `Bearer ${res.data}`);
            return typeof fn == 'function' && fn({ token: `Bearer ${res.data}`, statusCode: 200 });
          }
        })
      } else {
        console.log('调用login获取code失败' + res.errMsg)
        _self.showModal(res.errMsg, false, '提示')
      }
    }
  })
}

/**
 * 检测登录状态
 * params fn 回调函数  params传入参数
 * return fn 回调函数
 */
function checkLogin(fn) {
  var _self = this;
  var token = _self.storage('get', 'token');
  //判断token是否过期
  if (token) {
    _self.userInfo(token, function (res) {
      if (res.statusCode == 200) {
        return typeof fn == 'function' && fn({ token: res.token });
      }else{
        return typeof fn == 'function' && fn({ token: token });
      }
    })
  } else {
    //token 已过期，调用login方法重新登录并查询用户绑定情况
    _self.login(function (res) {
      //请求成功
      if (res.token) {
        return typeof fn == 'function' && fn({ token: res.token });
      }
    })
  }
}

/*----------------------------------个人信息-------------------------------*/

/**
 * 我的信息
 * params fn 回调函数  params传入参数 
 * return fn 回调函数 
 */
function userInfo(token, fn) {
  var _self = this;

  _self.request('GET', '', 'wx/me', contentType, token, function (res) {
    return typeof fn == 'function' && fn(res);
  })
}

/**
 * 更新个人位置信息
 */
function userLocation(params, fn){
  var _self = this;

  //判断登录状态
  _self.checkLogin(function (res) {
    _self.request('PUT', params, 'wx/location_info', contentTypeJson, res.token, function (res) {
      return typeof fn == 'function' && fn(res);
    })
  })
}

/*----------------------------------位置点信息-------------------------------*/

/**
 * 获取物资/救援人员信息点列表
 * params fn 回调函数
 * return fn 回调函数
 */
function mapPoints(fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    _self.request('GET', '', 'wx/v1/map_points', contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res.data.content || []);
    })
  })
}

/**
 * 查询位置点简易信息
 * params fn 回调函数 id 位置点ID
 * return fn 回调函数
 */
function pointsInfo(id, fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    _self.request('GET', '', `wx/v1/map_point/${id}`, contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res.data);
    })
  })
}

/**
 * 查询位置点消防记录详情
 * params fn 回调函数 id 位置点ID
 * return fn 回调函数
 */
function pointsDetail(id, fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    _self.request('GET', '', `wx/v1/location_point/${id}`, contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res.data);
    })
  })
}

/**
 * 获取附近物资点位
 * params fn 回调函数
 * return fn 回调函数
 */
function annexPoints(params,fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    // '', `wx/v1/location_points`
    _self.request('GET', params, `wx/v1/location_point/near`, contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res.data);
    })
  })
}

/*----------------------------------物资管理-------------------------------*/

/*
 * 获取物资列表
 * params fn 回调函数
 * return fn 回调函数 
 */
function materialList(params, fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    _self.request('GET', params, 'wx/v1/items', contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res);
    })
  })
}

/*
 * 新增物资信息
 * params fn 回调函数  params传入参数
 * return fn 回调函数 
 */
function createMaterial(params, fn) {
  var _self = this;

  _self.checkLogin(function (res) {
    _self.request('POST', params, 'wx/v1/item', contentTypeJson, res.token, function (res) {
      return typeof fn == 'function' && fn(res);
    })
  })
}

/*----------------------------------证件管理-------------------------------*/

/**
 * 查询证件信息列表
 * params fn 回调函数
 * return fn 回调函数
 */
function credentialsList(fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    _self.request('GET', '', 'wx/v1/certificates', contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res);
    })
  })
}

/**
 * 新增救援证件
 * params fn 回调函数  params传入参数
 * return fn 回调函数
 */
function createRescue(params, fn){
  var _self = this;

  _self.checkLogin(function (res) {
    _self.request('POST', params, 'wx/v1/certificate', contentTypeJson, res.token, function (res) {
      return typeof fn == 'function' && fn(res);
    })
  })
}

/**
 * 获取救援证详情
 * params fn 回调函数 id 救援证ID
 * return fn 回调函数
 */
function rescueDetail(id, fn) {
  var _self = this;
  _self.checkLogin(function (res) {
    _self.request('GET', '', `wx/v1/certificate/${id}`, contentType, res.token, function (res) {
      return typeof fn == 'function' && fn(res);
    })
  })
}



/*----------------------------------图片上传接口-------------------------------*/

/**
 * 获取阿里云OSS上传凭证
 * params fn 回调函数 files图片数组
 * return fn 回调函数 
 */
function uploadImage(file, fn) {
  var _self = this
  var params = { dir: 'exf-test' }

  //显示加载动画
  _self.showToast()

  //判断登录状态
  _self.checkLogin(function (res) {
    _self.request('GET', params, `image/policy`, contentType, res.token, function (res) {
      //获取policy信息成功
      var now = Date.now().toString()
      var random = Math.random().toString().split('.')[1]

      var _file = file.split('.')[0]    //文件名
      var _ext = file.split('.')[1]     //文件类型
      var key = `${res.data.dir}/${hexMD5(_file) + now + random}.${_ext}` //md5转码后的新文件名

      var formData = {
        key: key,
        policy: res.data.policy,
        OSSAccessKeyId: res.data.accessId,
        signature: res.data.signature
      }
      
      _self.uptoaliyun(res.data.host, file, formData, function(){
        //关闭加载动画
        _self.hideToast()

        return typeof fn == 'function' && fn({ url: `${res.data.imageHost}/${key}`})
      })
    })
  })
}

/**
*  阿里云上传
*  params fn 回调函数 url地址 files图片数组 formData其他额外的参数
*  return fn 回调函数
*/

function uptoaliyun(url, file, formData, fn) {
  wx.uploadFile({
    url: url,
    filePath: file,
    name: 'file',
    formData: formData,
    success: function (e) {
      if (e.statusCode == 204) {
        return typeof fn == 'function' && fn();
      }
    },
    fail: function (err) {
      _self.showToast('网络不给力...', 'loading', 1500)
    }
  })
}

/*----------------------------------公用方法-------------------------------*/

/**
 * request请求
 * params fn 回调函数  params 传入参数    urlName 接口调用标识   token身份验证：1.空 2.不为空
 * return fn 回调函数 
 */
function request(method, params, urlName, contentType, token, fn) {
  var _self = this
  var apiUrl = _self.GO.config.api_bak + urlName;

  _self.getNetworkType(function (res) {
    if (res.networkType == 'none') {
      wx.hideNavigationBarLoading()
      _self.showToast('网络不给力...', 'loading', 1500)
      return false;
    } else {
      wx.request({
        url: apiUrl,
        data: params,
        method: method,
        header: { "content-type": contentType, "Authorization": token },
        success: function (res) {
          // 请求状态码
          if (res.statusCode == 200) {
            if (res.data.statusCode == 0){
              return typeof fn == 'function' && fn(res.data)
            }else{
              _self.showModal(res.data.msg, false, '提示', '刷新', function(){
                _self.login(fn)
              })
            }
          } else if (res.statusCode == 400) {
            _self.showModal('400 用户不存在或者密码错误，登录失败', false, '提示')
          } else if (res.statusCode == 403 || res.statusCode == 401) {
            _self.showModal('403 用户没有对应操作权限', false, '提示')
            _self.login(fn)
          } else if (res.statusCode == 500) {
            _self.showModal('500 服务异常，刷新页面重试', false, '提示')
          } else if (res.statusCode == 502){
            _self.showModal('502 服务器错误，请稍后刷新页面重试', false, '提示')
          } else {
            console.log('通信异常，请稍后再试' + res.errMsg)
          }
        },
        // 4xx、5xx 等 response 的异常状态不会进入fail回调，请在success回调中检查statusCode。
        // fail回调一般源于在url格式、参数类型检查、网络连接、域名解析、response编码问题等
        fail: function (res) {
          //关闭加载动画
          _self.hideToast()
          //关闭加载动画
          wx.hideNavigationBarLoading()
          _self.showModal('请求超时，请检查网络后再试', false, '提示')
        },
      })
    }
  })

}

/** 
 * 统一缓存操作入口 
 * params: action set设置/get获取/remove清空,key必须在 storegeList允许范围内,
 *          data字符串,默认sync操作
 * return: 查询操作 false/result  修改操作 true/false
 */
function storage(action, key, data, sync = true) {
  var result = false
  var error = ''

  switch (action) {
    case 'set':
      try {
        wx.setStorageSync(key, data)
        result = true
      } catch (e) {
        error = e.error
      }
      break;
    case 'get':
      try {
        result = wx.getStorageSync(key)
      } catch (e) {
        error = e.error
      }
      break;
    case 'remove':
      try {
        wx.removeStorageSync(key)
        result = true
      } catch (e) {
        error = e.error
      }
      break;
  }

  if (result === false) {
    // console.log('本次缓存操作' + action + ',不符合条件 错误值key=' + key)
  }
  if (error != '') request.systemLog(error)
  return result
}

/**
 * 统一系统提示入口 
 * params: str 描述语句 , showCancel false 无取消按钮  ,fn回调函数
 * return void
 */
function showModal(str = '', showCancel = true, title = '系统提示', text = '确定', fn) {
  if (str == '') {
    str = ''
  }
  wx.showModal({
    title: title,
    content: str,
    showCancel: showCancel,
    confirmText: text,
    confirmColor: '#17a5ff',
    success: function (res) {
      return typeof fn == 'function' && fn(res);
    },
  })
}

/**
 * 系统显示提醒
 * params string str, icon 'success'/'loading' ,duration 
 * return void
 */
function showToast(title = '加载中', icon = 'loading', duration = 60000) {
  wx.showToast({
    title: title,
    mask: true,
    icon: icon,
    duration: duration
  })
}

/**
 * 系统隐藏提醒
 * params void
 * return void
 */
function hideToast() {
  wx.hideToast()
}

/**
 * 获取当前网络状态
 * params 回调函数
 * return 回调函数
 */
function getNetworkType(fn) {
  wx.getNetworkType({
    success: function (res) {
      return typeof fn == 'function' && fn(res);
    }
  })
}

module.exports = {
  // 系统基础
  request: request,
  storage: storage,
  showModal: showModal,
  hideToast: hideToast,
  showToast: showToast,
  getNetworkType: getNetworkType,

  // 登录/判断
  login: login,
  checkLogin: checkLogin,

  // 图片上传
  uploadImage: uploadImage,
  uptoaliyun: uptoaliyun,

  // 位置点信息
  mapPoints: mapPoints,
  pointsInfo: pointsInfo,
  pointsDetail: pointsDetail,
  annexPoints: annexPoints,

  // 物资管理
  materialList: materialList,
  createMaterial: createMaterial,

  // 救援证管理
  credentialsList: credentialsList,
  createRescue: createRescue,
  rescueDetail: rescueDetail,
  
  // 个人信息
  userInfo: userInfo,
  userLocation: userLocation
}