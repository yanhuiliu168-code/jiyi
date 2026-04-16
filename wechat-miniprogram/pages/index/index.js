Page({
  data: {
    url: 'https://jiyicard-q.vercel.app'
  },
  onLoad: function (options) {
    // 可以在这里处理传入参数
  },
  onShareAppMessage() {
    return {
      title: '记忆卡片训练',
      path: '/pages/index/index'
    }
  }
})