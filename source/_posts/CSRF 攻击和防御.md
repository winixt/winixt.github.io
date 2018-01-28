---
title: "CSRF 攻击和防御"
date: 
categories: web安全
tags: 
- CSRF
---

### CSRF 介绍

CSRF（Cross Site Request Forgery，跨站请求伪造），顾名思义就是攻击者盗用（利用）你的身份凭证，进行未经用户许可的恶意操作。与 XSS 不同的是，CSRF 直接利用用户当前的身份凭证，而 XSS 主要是窃取用户的身份凭证。

<!-- more -->

### CSRF 危害

CSRF 盗用受害者身份，完成受害者未经过授权的操作，能做的非常多：

* 银行非法转账
* 非法添加管理
* 利用用户发送电子邮电
* 修改用户密码
* …..

### CSRF 原理

我们结合一个简单的 demo 和下图分析一下

![图片](https://ws2.sinaimg.cn/large/006tKfTcly1fnrs4cfe12j30t80ghjvw.jpg)

1. 浏览并登录收信任的网站 A，这里我们假设是（//127.0.0.1:3000/login)，并且是一个银行网站，如下图：

![图片](https://ws3.sinaimg.cn/large/006tKfTcly1fnrsm4b2wxj31fk0qu42m.jpg)

2. 通过验证，在用户的浏览器上种植下 Cookie，如上图所示，sessionID 记录了用户的登录状态，可以看到可以转账成功了

   ![图片](https://ws3.sinaimg.cn/large/006tKfTcly1fnrsr3c1awj31go0bcju3.jpg)

3. 用户在没有登出 A 网站的情况下，访问网站 B，这里我们假设是（//127.0.0.1:8888），可以看到 hacker 已经在“点击这里有惊喜”种下攻击代码了

   ![图片](https://ws1.sinaimg.cn/large/006tNc79ly1fnrtakdu9lj31b807qmzm.jpg)

   ​

   ​

4. B 要求访问第三方网站 A（//127.0.0.1:3000)，当用户经不住诱惑或者不小心点了带攻击的链接，就会对第三方网站 A 发起转账的请求。

5. 根据第 4 步的请求，浏览器带着第 1 步种植的 cookie，向 A 网站发起转账请求，A 网站检验到是合法用户（因为带的 cookie 是合法的），于是同意转账，攻击完成。

   ![图片](https://ws3.sinaimg.cn/large/006tNc79ly1fnrtbafdijj30r807qjsu.jpg)

6. [其他案例](https://cloud.tencent.com/developer/article/1004943)


### CSRF 理解

通过上面的分析，我们可以发现实现一个 CSRF 攻击，需要由四部分组成：

1. 有一个无需后台验证的前端或后台数据修改或新增的漏洞存在，或者有可以欺骗后台验证的前端或后台数据修改或新增的漏洞存在；
2. 如果需要认证，还需要用户当前缓存的认证信息有效。
3. 伪造数据操作请求的恶意链接或者页面；
4. 诱惑用户主动访问或登录恶意链接，出发非法操作；

主要存在于用户密码修改、购物地址的修改或后台管理账户的新增等等操作过程。

### CSRF 利用方式

利用 CSRF 攻击，主要包含两种方式，一种是基于 GET 请求的利用，就如上面例子介绍的那样，直接构造攻击 url，另一种是基于 POST 请求方式的利用。

POST 也没什么，一个 form 表单搞定：

```
<script>
$(function() {
    $('#CSRF_forCSRFm').trigger('submit');
});
</script>
<form action="http://a.com/user/grant_super_user" id="CSRF_form" method="post">
    <input name="uid" value="121" type="hidden">
</form>
```

注意：form 表单是不存在跨域问题的，提交 form 表单会带上 cookie。不要老怪 CORS，因为 form 表单跨域提交，会跳转页面，原页面脚本无法获取新页面的内容，因此浏览器认为是安全的，可以理解为 a 标签的跳转；CORS 主要是用来防止第三方脚本|代码在当前页面运行。通过其他方式发起请求，CORS 就很有作用了。

### CSRF防范

既然 CSRF 攻击的核心是利用登录用户的认证信息，而手段大多是从第三方网站发起，我们可以从以下三个方案进行防范：

* referer 验证
* 验证机制
* token

###### referer 验证

HTTP 协议里面定义了一个 referer 字段，记录了访问来源，所以我们可以判断 referer，非收信任的 referer 拒绝访问。但是容易绕过，真正到了需要验证的时候，作用不大。

######  验证机制

当用户进行敏感信息修改，财产等严重问题时，可以加一层验证机制：

* 输入当前用户密码，防止未授权用户
* 验证码验证
* 第二个密码，比如支付密码等

虽然会牺牲一部分用户体验，但是为了用户信息财产安全，有些地方使用还是有必要的。

###### token

添加基于当前用户身份的有效 tokens 随机验证机制，即在向后端提交数据操作请求时，添加基于当前用户的随机 token 校验值，此种方法但前使用的比较多。





