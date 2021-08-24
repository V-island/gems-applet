/**
 * 通用配置文件
 */
var util = require("utils/util.js")
var enums = require("utils/enums.js")
var common = require('utils/common.js')
var md5 = require('utils/md5.js')

//app.js
App({
  // 全局变量
  GO: {
    app_id: 'wxc3ecba15d1d95e08',  	 									/* 微信应用ID */
    config: {}, 											 								/* 系统配置信息 */
  },
  //服务器环境
  config: {
    master: {  /* 正式环境配置 */
      api: 'https://xl.5xinglm.com'
    },
    debug: {   /* 测试环境配置 */
      api: 'https://xl.5xinglm.com'
    },
    local: {   /* 本地环境配置 */
      api: ''
    }
  },
  onLaunch: function () {
    /* 根据分支自动识别为正式或者是测试版本 指向common.js   配置系统API与版本信息*/
    var branch = common.defaultBranch();
    this.GO.config.HOST = this.config[branch].api												 // 域名
    this.GO.config.api_bak = this.config[branch].api + "/api/"					 // API地址
    this.GO.config.AppKey = ""					                                 // 加密信息 未定
    this.GO.config.version = "v0.1.0"																		 // 小程序版本
    this.GO.config.Fenv = branch																				 // 当前环境
    this.GO.config.share = "E走水，每天不一样"														  // 描述信息

    //初始化部分信息
    this.GO.util = util																// 获取功能库
    this.GO.enums = enums															// 获取通用类型库
    this.GO.util.GO = this.GO 												// 让util存在GO的所有信息

    //提示升级微信
    if (!wx.pageScrollTo) {
      util.showModal('当前微信版本过低，无法使用部分功能，请升级到最新微信版本后再使用。', false)
    }
  }
})