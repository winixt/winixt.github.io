---
title: "H5 唤起 APP"
date: 
categories: H5
tags: 
- 唤起
---

![H5唤起APP](https://ws2.sinaimg.cn/large/006tNbRwly1fyistf68ydj30xc0m8aiv.jpg)

[<font color="grey">图片来源</font>](https://churaumi.okinawa/sc/area/the-kuroshio/kuroshio/)

为了向我们的APP导流，一些分享出去的页面和大部分的活动页我们希望能够直接由其他平台（微信、QQ、微博、浏览器）等直接唤起我们的APP。但是其他平台更多的是希望用户停留在自己平台内，进而阻止用户唤起第三方APP的操作。

两种意愿的冲突引发了平台APP和第三方APP在唤起功能中的博弈。对于我们第三方APP，如何才能在这场博弈中获得最优解呢？



## 没有银弹，只有针对各种平台的导弹

由于各个平台对唤起行为的封锁方式不同，以及我们业务高频需求场景不同，需要针对不同平台做特殊处理。

针对两个系统和4个高频平台做分析。（为了简化流程，这里我们只针对三个平台做分析，其他平台分析思维类似）
![APP唤起流程](https://ws2.sinaimg.cn/large/006tNbRwly1fyitljsbjtj314x0u01ey.jpg)



### IOS

ios >= 9.0 支持新的 Universal Links 唤起协议，这里我们简称 link 协议，不清楚的请自行 google。大部分平台也支持。

微信**禁**了 link 协议，使用 link 链接依然无法唤起 APP，但是我们可以将 link 链接对应到一个下载页，引导用户 Safari 打开，当用户点击 Safari 打开的时候直接触发 link 协议，进而直接唤起 APP。⚠️ 这里是直接唤起 APP，不需要经过 Safari 中转。

微博、QQ、Safari 都是没有禁用 link 协议的，可以直接使用。

针对默写禁用 link 协议浏览器可以尝试使用 schema 唤起协议。

有些平台不支持直接跳 App Store，需要通过 itunes 平台

https://itunes.apple.com/cn/app + url



### Anroid

android 唤起使用 schema 协议。

android 微信没有 link 协议可以使用，可以实现一个下载页，在下载页面引导用户浏览器打开，用户通过浏览器打开的时候直接触发唤起脚本。相比于 ios 微信，唤起过程中间多了一层浏览器中转（具体看浏览器实现，有些浏览器有弹窗让用户确认是否唤起 APP ）

对于禁用 schema 协议的平台来说都可以采用针对微信的方案。

没有禁用 schema 协议的直接使用 schema 协议就好。



### 其他

有些应用在微信能够直接唤起 APP，是因为这些公司与微信有深度合租关系，在微信白名单内。

有些应用在微信能通过应用宝唤起 APP，是因为在应用宝上，他们的应用满足下面四个条件之一（可以申请 APP link)

* 应用评级达到A级； 
* 应用微下载日访问量达到10W/天； 
* 项目/应用参加腾讯“双百”扶持计划； 
* 应用由腾讯投资占股。

如何您的应用符合上面四个条件之一，可以使用如下形式拼接 url:

<http://a.app.qq.com/o/simple.jsp?pkgname=com.xx.abc&android_schema=appname://a/b?url=https://www.a.com/b/c.html> 



### 为什么要使用下载页面？

可能会有同学问，上文唤起流程图，唤不起的之后的下载流程为什么走下载页，而不是直接下载。考虑到两个因素：

1. 平台差异化严重，笔者暂没找到合适的办法，判断用户是否唤起 APP 成功，如果用户唤起成功还让用户下载是非常不好的体验。（如果你们有更好的方案，欢迎下方留言）
2. 将唤起下载逻辑统一封装一个下载|唤起模块易于代码的维护和管理。

