let sdk = require('./../index')


let jsapi_ticket='a', noncestr = 'b', timestamp = 'c', url = 'd'

console.log(sdk.generateSign({jsapi_ticket, noncestr, timestamp, url}))
// 1c43f52220d638e307d6d898fffce16b29d6ece9
