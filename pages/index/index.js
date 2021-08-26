// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    activeNames: ['1'],
    projectList: [
      {
        id: 202108261727,
        name: "医院",
        items: [
          {
            id: 2108261728,
            name: "深圳南方医科大学",
            icon: ""
          },{
            id: 2108261729,
            name: "广东省人民医院",
            icon: ""
          },{
            id: 2108261730,
            name: "浙江省省人民医院",
            icon: ""
          }
        ]
      },{
        id: 202108261730,
        name: "大型园区",
        items: [
          {
            id: 2108261728,
            name: "星火源",
            icon: ""
          }
        ]
      },{
        id: 202108261735,
        name: "博物馆",
        items: []
      }
    ]
  },
  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
  },
});