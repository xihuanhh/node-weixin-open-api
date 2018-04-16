let store = ''
let fs = require('fs')
let redis = require("redis")

let accessTokenFile, jsticketTokenFile, redisClient // 用来做文件存储的文件名

exports.setFileStore = (sdk) => {
  accessTokenFile = __dirname + `/../tokens/${sdk.appId}.accessToken`
  jsticketTokenFile = __dirname + `/../tokens/${sdk.appId}.jsTicket`

  let tokenFileExists = fs.existsSync(accessTokenFile)
  if (!tokenFileExists) {
    let fh = fs.openSync(accessTokenFile, 'w')
    fs.writeFileSync(fh, JSON.stringify({expireTime: 0, accessToken: ''}))
    fs.closeSync(fh)
  }

  let jstokenFileExists = fs.existsSync(jsticketTokenFile)
  if (!jstokenFileExists) {
    let fh = fs.openSync(jsticketTokenFile, 'w')
    fs.writeFileSync(fh, JSON.stringify({expireTime: 0, jsApiTicket: ''}))
    fs.closeSync(fh)
  }

  store = 'file'
}

// redisConfig
// {host: '127.0.0.1', port: 6379}
exports.setRedisStore = (sdk) => {
  store = 'redis'
  redisClient = redis.createClient(sdk.redisConfig)
  redisClient.get('expireTimeJS', (error, reply) => {
    if (!reply) {
      redisClient.set("expireTimeJS", 0)
    }
  })
  redisClient.get('expireTime', (error, reply) => {
    if (!reply) {
      redisClient.set("expireTime", 0)
    }
  })
  redisClient.get('accessToken', (error, reply) => {
    if (!reply) {
      redisClient.set("accessToken", '')
    }
  })
  redisClient.get('jsApiTicket', (error, reply) => {
    if (!reply) {
      redisClient.set("jsApiTicket", '')
    }
  })
}

// 返回格式：{expireTime: 0, accessToken: ''}
exports.getAccessToken = (cb) => {
  if (store === 'file') {
    // file
    let fsContent = fs.readFileSync(accessTokenFile).toString()
    fsContent = JSON.parse(fsContent)
    cb(null, fsContent)
  } else {
    // redis
    let accessToken, expireTime
    redisClient.get('accessToken', (error, reply) => {
      accessToken = reply
      redisClient.get('expireTime', (error, reply) => {
        expireTime = reply
        cb(null, {accessToken, expireTime})
      })
    })
  }
}

// {expireTime: sdk.expireTimeJS, jsApiTicket: sdk.jsApiTicket}
exports.getJSTicket = (cb) => {
  if (store === 'file') {
    // file
    let fsContent = fs.readFileSync(jsticketTokenFile).toString()
    fsContent = JSON.parse(fsContent)
    cb(null, fsContent)
  } else {
    // redis
    let expireTime, jsApiTicket
    redisClient.get('jsApiTicket', (error, reply) => {
      jsApiTicket = reply
      redisClient.get('expireTimeJS', (error, reply) => {
        expireTime = reply
        cb(null, {jsApiTicket, expireTime})
      })
    })
  }
}

exports.setAccessToken = (accessToken, expireTime) => {
  // 先算一下超时时间
  expireTime = new Date().getTime() + expireTime * 1000 - 5000

  if (store === 'file') {
    // file
    let fh = fs.openSync(accessTokenFile, 'w')
    fs.writeFileSync(fh, JSON.stringify({expireTime, accessToken}))
    fs.closeSync(fh)
    return {expireTime, accessToken}
  } else {
    // redis
    redisClient.set("accessToken", accessToken)
    redisClient.set("expireTime", expireTime)
    return {expireTime, accessToken}
  }
}

// {expireTimeJS: sdk.expireTimeJS, jsApiTicket: sdk.jsApiTicket}
exports.setJSTicket = (jsApiTicket, expireTime) => {
  // 先算下超时时间
  expireTime = new Date().getTime() + expireTime * 1000 - 5000

  if (store === 'file') {
    // file
    let fh = fs.openSync(jsticketTokenFile, 'w')
    fs.writeFileSync(fh, JSON.stringify({expireTime, jsApiTicket}))
    fs.closeSync(fh)
    return {expireTime, jsApiTicket}
  } else {
    // redis
    redisClient.set("jsApiTicket", jsApiTicket)
    redisClient.set("expireTimeJS", expireTime)
    return {expireTime, jsApiTicket}
  }
}