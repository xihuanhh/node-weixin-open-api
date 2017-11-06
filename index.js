// let _ = require('lodash')
let crypto = require('crypto')
let http = require('request')
let async = require('async')
let moment = require('moment')
let parseString = require('xml2js').parseString


let sdk = {

}

//返回 timeStamp
let getTimeStamp = function () {
  return moment().format('X')
}

// private: 构造nonceStr
let getNonceStr = function(){
  var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var maxPos = $chars.length
  var noceStr = ""
  for (var i = 0; i < 32; i++) {
    noceStr += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return noceStr
}

// private: 参数签名
let generateSign = (obj) => {
  let params = Object.keys(obj).sort().map(key => `${key}=` + obj[key])
  return crypto.createHash('sha1').update(params.join('&')).digest('hex')
}

// private: 刷新token
let getAccessToken = function (fn) {
  if (new Date().getTime() > sdk.expressTime) {
    // 如果token超时，或者没有token(expressTime 初始值为0)
    // 则开始获取token
    let url = `${sdk.domain}/cgi-bin/token?grant_type=client_credential&appid=${sdk.appId}&secret=${sdk.appSecret}`
    http.get(url, {json: true}, (error, response, body) => {
      if (error) {
        console.log('ERROR: accessToken generate error: %s', error)
        fn('accessTokenError', null)
      } else {
        sdk.accessToken = body.access_token
        sdk.expressTime = new Date().getTime() + body.expires_in * 1000
        fn(null, sdk.accessToken)
      }
    })
  } else {
    fn(null, sdk.accessToken)
  }
}

let getJsApiTicket = (fn) => {
  if(new Date().getTime() > sdk.expressTime || sdk.jsApiTicket == ''){
    //如果超时了，或者还没刷新过
    async.series([
      getAccessToken,
      (cb) => {
        let url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${sdk.accessToken}&type=jsapi`
        http.get(url, {json: true}, (error, response, body) => {
          if(error){
            cb(error, null)
          }else{
            if (body.errcode) {
              // TODO: 核实一下 有没有这个errmsg
              cb(body.errmsg, null)
            } else {
              cb(null, body.ticket)
            }
          }
        })
      }
    ], (error, result) => {
      if(error){
        console.log('jsApiTicket Error %s', error)
        fn(error, null)
      }else{
        sdk.jsApiTicket = result[1]
        fn(null, sdk.jsApiTicket)
      }
    })
  } else {
    // 如果没有过期
    fn(null, sdk.jsApiTicket)
  }
}


exports.init = (wxConfig) => {

  sdk = {
    token: wxConfig.token,
    appId: wxConfig.appId,
    appSecret: wxConfig.appSecret,
    accessToken: '',
    expressTime: 0,
    jsApiTicket: '',
    domain: wxConfig.domain
  }

  sdk.parseXml = (xmlString, fn) => {
    parseString(xmlString, {
      explicitArray: false
    }, (error, json) => {
      if (error) {
        fn(new Error('xmlParseError'), null)
      } else {
        fn(null, json)
      }
    })
  }

  // 检查签名是否正确
  sdk.checkSign = (signature, timestamp, nonce, fn) => {
    let str = [sdk.token, timestamp, nonce].sort().join('')
    let mySign = crypto.createHash('sha1').update(str).digest('hex')
    if (mySign === signature) {
      fn(null, null)
    } else {
      fn(new Error('signError'), null)
    }
  }

  sdk.text = (from, to, content) => {
    let now = +new Date()
    return `<xml><ToUserName><![CDATA[${to}]]></ToUserName><FromUserName><![CDATA[${from}]]></FromUserName><CreateTime>${now}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${content}]]></Content></xml>`
  }

  // 回复图片消息
  // 首先将图片上传到微信服务器
  // type: 图片（image）、语音（voice）、视频（video）和缩略图（thumb）
  sdk.media = (from, to, type, fileBuffer, fn) => {
      async.auto({
        getAccessToken,
        upload: ['getAccessToken', (results, cb) => {
          let url = `${wxConfig.domain}/cgi-bin/media/upload?access_token=${sdk.accessToken}&type=${type}`
          let r = http.post(url, {
            json: true
          }, (error, response, body) => {
            if (error) {
              console.log(error)
              cb(error, null)
            } else if (body.errcode) {
              console.log(body.errmsg)
              cb(body.errmsg, null)
            } else {
              cb(null, body)
            }
          })
          r.form().append('file', fileBuffer, {
            filename: 'myFile.png',
            contentType: 'image/png'
          })
        }]
      }, (error, result) => {
        let mediaInfo = `<Image><MediaId><![CDATA[${result.upload.media_id}]]></MediaId></Image>`
        let now = +new Date()
        if (error) {
          console.log(error)
        } else {
          console.log(result.upload)
        }
        fn(null, `<xml><ToUserName><![CDATA[${to}]]></ToUserName><FromUserName><![CDATA[${from}]]></FromUserName><CreateTime>${now}</CreateTime><MsgType><![CDATA[${type}]]></MsgType>${mediaInfo}</xml>`)
      })
  }

  sdk.oAuth = (code, fn) => {
    http.get(`${wxConfig.domain}/sns/oauth2/access_token`, {
      qs: {
        appid: sdk.appId,
        secret: sdk.appSecret,
        code,
        grant_type: 'authorization_code'
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        fn(error, null)
      } else {
        if (body.errcode) {
          fn(body.errcode, null)
        } else {
          fn(null, body.openid)
        }
      }
    })
  }

  sdk.getConfigParams = (url, debug, jsApiList, cb) => {
    let appId     = sdk.appId
    let noncestr  = getNonceStr()
    let timestamp = getTimeStamp()
    getJsApiTicket((error, jsApiTicket) => {
      let signature = generateSign({jsApiTicket, noncestr, timestamp, url})
      cb(error, {
        debug,
        appId,
        timestamp,
        nonceStr: noncestr,
        signature,
        jsApiList
      })
    })
  }

  // 创建菜单
  sdk.createMenu = (menuConfig, fn) => {
    async.auto({
      getAccessToken,
      createMenu: ['getAccessToken', (dummy, cb) => {
        let url = `${wxConfig.domain}/cgi-bin/menu/create?access_token=${sdk.accessToken}`
        http.post(url, {json: true, form: menuConfig}, (error, response, body) => {
          if (error) {
            cb(error, null)
          } else {
            if (body.errcode) {
              cb(body.errmsg, null)
            } else {
              cb(null, null)
            }
          }
        })
      }]
    }, fn)
  }

  // 发送客服消息--文本消息
  sdk.sendKfMsg = (form, fn) => {
    async.auto({
      getAccessToken,
      delMenu: ['getAccessToken', (dummy, cb) => {
        let url = `${wxConfig.domain}/cgi-bin/message/template/send?access_token=${sdk.accessToken}`
        http.post(url, {json: form}, (error, response, body) => {
          if (error) {
            cb(error, null)
          } else {
            if (body.errcode) {
              cb(body.errmsg, null)
            } else {
              cb(null, null)
            }
          }
        })
      }]
    }, fn)
  }

  // 删除菜单
  sdk.delMenu = (fn) => {
    async.auto({
      getAccessToken,
      delMenu: ['getAccessToken', (dummy, cb) => {
        let url = `${wxConfig.domain}/cgi-bin/menu/delete?access_token=${sdk.accessToken}`
        http.post(url, {json: true}, (error, response, body) => {
          if (error) {
            cb(error, null)
          } else {
            if (body.errcode) {
              cb(body.errmsg, null)
            } else {
              cb(null, null)
            }
          }
        })
      }]
    }, fn)
  }

  // 根据openId获取用户信息
  sdk.getProfile = (openId, fn) => {
    async.auto({
      getAccessToken,
      profile: ['getAccessToken', (dummy, cb) => {
        let url = `${wxConfig.domain}/cgi-bin/user/info?access_token=${sdk.accessToken}&openid=${openId}&lang=zh_CN`
        http.post(url, {
          json: true
        }, (error, response, body) => {
          if (error) {
            cb(error, {})
          } else {
            if (body.errcode) {
              cb(body.errmsg, {})
            } else {
              cb(null, body)
            }
          }
        })
      }]
    }, (error, result) => {
      if (error) {
        fn(error, {})
      } else {
        fn(null, result.profile)
      }
    })
  }

  // 获取带参数的二维码，返回一个buffer
  sdk.getMPQRCode = (sceneId, fn) => {
    async.auto({
      getAccessToken,
      ticket: ['getAccessToken', (dummy, cb) => {
        let url = `${wxConfig.domain}/cgi-bin/qrcode/create?access_token=${sdk.accessToken}`
        http.post(url, {
          json: {
            "action_name": "QR_LIMIT_STR_SCENE",
            "action_info": {
              "scene": {
                "scene_str": sceneId
              }
            }
          },
        }, (error, response, body) => {
          if (error) {
            cb(error, null)
          } else {
            if (body.errcode) {
              cb(body.errmsg, null)
            } else {
              console.log(encodeURIComponent(body.ticket))
              console.log((body.ticket))
              cb(null, body.ticket)
            }
          }
        })
      }],
      qrCode: ['ticket', (results, cb) => {
        // 注意：这个地方不要傻逼呵呵的用${wxConfig.domain} 这个是mp.weixin.qq.com 再说一遍，这个是 mp.weixin.qq.com
        let url = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${results.ticket}`
        console.log(url)
          http.get(url, {
            encoding: null
          }, (error, response, body) => {
            if (error) {
              cb(error, null)
            } else {
              if (body.errcode) {
                cb(body.errmsg, null)
              } else {
                cb(null, body)
              }
            }
          })
      }]
    }, (error, result) => {
      if (error) {
        // 如果报错，则生成一个空数组
        fn(error, [])
      } else {
        fn(null, result.qrCode)
      }
    })
  }
  // 发送客服消息(模板消息）
  // to: 发给谁？ openId
  // templateId: 客服模板编号
  // link: 点击模板后到达的页面
  // customData: 在指定模板中自定义的消息
  sdk.sendTemplateMsg = (to, templateId, link, customData, fn) => {
    async.auto({
      getAccessToken,
      send: ['getAccessToken', (dummy, cb) => {
        let url = `${wxConfig.domain}/cgi-bin/message/template/send?access_token=${sdk.accessToken}`
        http.post(url, {json: {
          "touser": to,
          "template_id": templateId,
          "url": link,
          "data": customData
        }}, (error, response, body) => {
          if (error) {
            cb(error, null)
          } else {
            if (body.errcode) {
              cb(body.errmsg, null)
            } else {
              cb(null, null)
            }
          }
        })
      }]
    }, fn)
  }

  return sdk
}