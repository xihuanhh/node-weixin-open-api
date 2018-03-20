# 企业付款文档
https://pay.weixin.qq.com/wiki/doc/api/tools/mch_pay.php?chapter=14_2

## 关于证书
证书下载地址： 微信商户平台(pay.weixin.qq.com) --> 账户设置 --> API安全 --> 证书下载
证书密码默认为您的商户ID

## 在请求中附带证书
 
request({
		url: "https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers",
		method: 'POST',
		body: util.buildXML(opts),
		agentOptions: {
			pfx: this.options.pfx,
			passphrase: this.options.mch_id
		}
	}, function(err, response, body){
		util.parseXML(body, fn);
	})
	
mch_appid,
mchid,
nonce_str,
partner_trade_no,
openid,
check_name,
amount,
desc,
spbill_create_ip


微信支付接口调试工具（签名校验）
https://pay.weixin.qq.com/wiki/tools/signverify/



微信公众平台文档： https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140839
getProfile(openId, callback)

输入： openId
输出：
```javascript
{
   "subscribe": 1, 
   "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M", 
   "nickname": "Band", 
   "sex": 1, 
   "language": "zh_CN", 
   "city": "广州", 
   "province": "广东", 
   "country": "中国", 
   "headimgurl":  "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4
eMsv84eavHiaiceqxibJxCfHe/0",
  "subscribe_time": 1382694957,
  "unionid": " o6_bmasdasdsad6_2sgVt7hMZOPfL"
  "remark": "",
  "groupid": 0,
  "tagid_list":[128,2]
}

```

微信 JS 接口签名校验工具

https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=jsapisign