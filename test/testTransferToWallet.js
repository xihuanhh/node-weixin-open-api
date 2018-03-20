let fs = require('fs')
// console.log(pfx.replace(/\n/g,''))
// pfx = pfx.replace(/\n/g,'')
// pfxKey = pfxKey.replace(/\n/g,'')

let config = {
  appId: "wx728f10424a6841cd",
  appSecret: "58e992105d2d0836f1e84d6dfcfb21f1",
  wxHost: "api.weixin.qq.com",
  wxPort: 443,
  domain: 'https://api.weixin.qq.com',
  token: "irobot",
  mchId: '1490677542',
  pfx: fs.readFileSync('./certs/apiclient_cert.pem'),
  pfxKey: fs.readFileSync('./certs/apiclient_key.pem'),
  payKey: 'dd98e72a20d07053a1f49d0g0e7c4450'
}

let sdk = require('./../index')().init(config)

sdk.transferToWallet(100, 'o7Fsh0kRm501xx2q5bXPByBTiM_c', 100, '192.168.1.1.', 'NO_CHECK', '金币转让', (error, result) => {
  console.log(error, result)
})

