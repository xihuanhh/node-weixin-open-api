微信公众平台文档： https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140839
getProfile(openId, callback)

getMPQRCode(sceneId, (error, result) => {
  // result is a qrcode buffer
})

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


# vue前端使用如下方式

```javascript
router.beforeEach((to, from, next) => {
  // 每次在切换路由之前要看下有没有微信授权
  router.app.$getAsync('/login').then(data => {
    if (data.data.data.isLoggedIn) {
      next()
    } else {
      let backUrl = encodeURIComponent(`${Conf.frontDomain}${to.path}`)
      window.location.href = `${Conf.apiDomain}/wxAuth?backUrl=${backUrl}`
    }
  })
})
```

# 后端使用如下方式跳转

```javascript
router.get('/wxAuth', weixinSdk.auth, (req, res) => {
	let openId = req.session.openId
	let redirectUrl = req.query.backUrl
  try {
    // 做用户setup的工作
	  let {openId, nickName, headImageUrl, sex} = req.session
	  const [user, created] = await models.couponOrderUser.findOrCreate({
		  where:{
			  openId
		  }
	  })
	  req.session.userId = user.id
	  res.redirect(redirectUrl)
  } catch (e) {
	  res.redirect(redirectUrl)
  }
})
```