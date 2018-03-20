let crypto = require('crypto')

// 签名
/* 签名的东西如下，是个Obj
* {a: 1, b: 2}
*  签名过程就是按键值排序，链接起来，然后再用md5或者sha1摘要一下
* */
exports.getPaySign = (obj, key, signMethod) => {
  let params = Object.keys(obj).sort().map(key => `${key}=` + obj[key])
  console.log(params.join('&'))
  return crypto.createHash(signMethod).update(params.join('&') + `&key=${key}`).digest('hex')
}

