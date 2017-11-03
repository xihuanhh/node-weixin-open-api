let config = require('./../conf')
let weixinSdk = require('./../index').init(config.iRobot.wx)
let fs = require('fs')

weixinSdk.getMPQRCode('ssssssssssssssssss', (error, result) => {
  // weixinSdk.media('a','b','image',result, (error, result) => {
  //   console.log(error, result)
  // })
  let fh = fs.openSync('./sss.png', 'w+')
  fs.write(fh, result, (error, data) => {
    console.log(error, data, '------')
  })
})