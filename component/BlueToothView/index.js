// component/BlueToothView/index.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        btnUrl: './image/',
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onLeapfrog: function() {
            this.triggerEvent('onLeapfrog');
        }
    }
})
