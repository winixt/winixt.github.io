---
title: "appcache"
date: 
categories: 离线缓存
tags: 
- appcache
---

H5 离线缓存技术，介绍文档这里不在赘述，需要请自行查阅 MDN 文档。
更新流程如下，如有错误，欢迎抛砖！

<!-- more -->

![更新流程](https://ws2.sinaimg.cn/large/006tKfTcly1fte1572i42j310q10qtcg.jpg)

## 目标
主要用来缓存 html(css已经注入其中), 和公用 js 文件。图片缓存看线上表现再决定是否加入缓存 or 使用占位图片？
判断依据为：不缓存图片是否会出现页面抖动等问题。

## appcache api

### applicationCache.update
   * @无参数  “首次”进入页面会自动触发一次
   * 用于手动调起 manifest 文件更新，触发 checking 事件
   * 在发起 manifest 请求发生错误将触发 obsolete 或 error 事件，具体看下文规则。如果页面没有监听相应的函数，错误直接抛出到全局


### applicationCache.swapCache
   * @无参数
   * UPDATEREADY  后可以调用这个方法，将下载到临时缓存的内容切换到缓存中，当前打开页面引用的资源不变，在打开新子页面就会应用新的资源
  
### application.abort() 
   * 取消正在下载的缓存(已经被移除，[详情传送门](https://www.w3.org/TR/2011/WD-html5-20110525/offline.html#application-cache-api)

## appcache event
1. cached：下载完毕，并已缓存（首次下载完毕并混存完毕，首次不会触发 updateready 事件）
2. checking：检查 manifest 有无更新
3. noupdate： manifest 没有更新
4. downloading：正在下载需要缓存的资源
5. progress：下载资源的进度
6. updateready：下载完毕准备更新缓存
7. obsolete：在已发现 manifest 的前提下，再次下载出现 404, 410 触发这个错误
8. error：
   * manifest 刚开始下载（此前没有成功下载的记录）出现 404，410
   * manifest 没有改变，但是引用 manifest 的 html 没有被正确的下载
   * 在下载 manifest 列举的文件的时候发生致命错误例如 500
   * 在更新 manifest 文件过程中，manifest 文件发生改变

## manifest

1. manifest 文件必须声明为 no-cache，实现更新
2. 有文件更改的时候，必须更改 manifest 文件，（若对应的缓存文件 url 不变，可以通过修改 manifest 版本号实现），因为浏览器检测到了 manifest 更新，才会去更新缓存。
3. manifest 的 MIME 类型必须是 text/cache-manifest，防止有些平台无法识别这种文件
4. 主记录（声明 manifest 的 html 文件）不要写入缓存列表，默认自动缓存
5. 不用使用 get 参数访问缓存文件，会使浏览器直接从网络拉取资源（也不要用 html 加版本号实现缓存的实时更新，这样做会导致浏览器缓存所有 html 的版本，容易超过 appcache 的存储空间，默认是 5m，具体各个平台实现有差异）
6. 可以通过设置 manifest 404 清除所有的缓存
7. 站点中的其他页面即使没有设置manifest属性，请求的资源如果在缓存中也从缓存中访问
8. FALLBACK 中的资源必须和manifest文件同源
9. 引用 manifest 的 html 必须与 manifest 文件同源，在同一个域下

## 问题

### 跨域
1. manifest 文件中列出的资源url必须和 manifest 本身使用同样的网络协议，如果manifest文件使用的是http协议，则列表中https协议的文件就会被忽略。(如果是 https 会忽略 http)
2. 在SSL安全连接下，所有在 manifest 配置的资源列表需符合同源策略。即所有的地址都必须是相对地址。但Chrome除外，在SSL下，即使有非同源的资源，Chrome 和大部分 android 仍旧会下载至离线缓存中
3. 对于不同协议的文件，不同平台有不同的实现方式，有的直接走网络，有的走浏览器缓存。在 http 域中引用 https 资源有些平台还会直接拦截，如 iphoneX

### 超出缓存大小行为
1. 超出文件大小限制触发 error 事件，错误类型为 quota
2. 首次下载缓存时超出大小，所有资源都不会缓存，而是请求网络，应用功能正常。更新资源后超出大小，缓存不会更新，应用无法更新。
3. 对于兼容 appcache 的平台，缓存通常足够大，如果不滥用的话。
   

### 其他
1. 一个资源的加载失败会导致全部更新失败？
    答：硬伤，暂时没想到好方案
2. 二次更新问题，用户第二次访问才能获取资源的更新？
    答：硬伤，暂时没想到好的方案
3. manifest 更新时，已混存的文件会重新下载吗？
    答：浏览器会根据 manifest 描述的缓存列表全部重新拉取，存入临时缓存，用户再次进入再推入缓存
4. 更新 manifest 缓存时，如何处理已经混存的文件？
    答：浏览器会剔除【不必要】的缓存文件，例如过期的 js 文件等，但只是 get 参数不同会一直缓存着，不会被清除
5. 没有被 manifest 声明的文件不会加载?
    答：NETWORK section 加上通配符 *
6. 添加 manifest download 相关的更新事件监听脚本，需要两次更新 manifest 才能生效(首次缓存第一次就会生效)
    答：第一次更新脚本，第二次更新 manifest 文件后才会触发脚本监听的事件
7.  首次进入含有 appcache 的 html 主页面，progress 显示的缓存文件数会比实际情况少 1？
    答：首次进入页面，主 html 的缓存不会计入 progress

## 监控关注点
1. 白屏时间的改善情况？
2. 产品更新上线后，所有访问用户新版本使用情况？第一次访问用户？第 >= 2 次访问的用户？
3. 缓存失败率（sw, appcache)
4. 会不会有永远不更新的用户？
5. 统计 sw 和 appcache 占比？
