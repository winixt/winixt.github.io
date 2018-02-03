---
title: "js 异步进化史之回调"
date: 
categories: 异步
tags: 
- 回调
- 事件循环
---

人类在代代相传中不断进化，世间万物很多都是如此，已不断适应赖以生存的环境 。物竞天择，有些适应不了新生环境的自然就会逐渐被淘汰。编程语言也一样，大到整个编程语言的版本升级，小到语言内部一些特性的升级。今天我们就来看看 js 语言的异步进化过程。

<!-- more -->

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1fo238oic46j30dw08o763.jpg)

### 什么是异步？

------

很多人将“异步”和“并行”混淆在一起，比如：

```javascript
let data1 = ajax("http://example.com?index=1", function success(data) {
  console.log(data)
});
let data2 = ajax("http://example.com?index=2", function success(data) {
  console.log(data)
});

function func(cb) {
  cb();
  console.log('我是同步函数，会不间断运行^_^')
}
```

说这两个 ajax 请求是并行的可能是对的，因为它们可能几乎是同一时间发送出去的。

注：由于某些原因的限制，比如当采用 http/1.x 的时候，受到浏览器的最大连接数的限制。在这里我们暂且认为它们是并行的。

从另外一个视觉分析，我们单单分析第一个 ajax 请求，它不是马上得到响应的，data1 会是 undefined，success 方法也不会马上得到执行，而是过一个时间间隙后，服务器返回了数据。再对 success 方法进行调用。明显有一个时间间隔，不会像 func 一样一口气执行完。

所以，不要将“异步”和“并行”混淆在一起，并行指的是同一时间执行多个程序块，而异步是指，“现在”执行一部分，待“将来”条件满足了再执行另外一部分。“现在”和“将来”有一个时间间隙。两者概念不同。

### 为什么要异步？

------

有目的做事才有方向的嘛，那为什么要异步呢？

当客户端发起一个 ajax 请求，不采用异步的方式处理，而是采用同步等待的处理方式。因为 js 的单线程特性，同步等待会阻塞当前线程，从而导致客户端不能响应用户的其他操作，甚至页面上的小动画也停了，彷佛世界末日。

注：js 之所以采用单线程，是因为多线程编程是非常复杂的。至于为什么复杂，已是题外话，请自行 google。

所以异步就被需要需要了。当你发起 ajax 请求的时候，先把当前程序块“挂起”，客户端先处理其他用户交互，等服务器响应数据到了，在回过头来继续执行之前的“挂起”的程序块。

```javascript
ajax("http://example.com?index=1", function success(data) {
  console.log(data); // 获取到服务器响应的数据
});
```

那么异步的代码块又是如何在恰当的时候放入 js 引擎中解析执行的呢？**事件循环**



### 事件循环

------

什么是事件循环呢？我们用一段伪代码来诠释一下这个概念：

```javascript
const eventLoop =[];
while(true) {
  if (eventLoop.length > 0) {
    const event = eventLoop.shift();
    try {
      event();
    } catch(err) {
      console.log(err);
    }
  }
}
```

就是这么一个概念，不断取出队列里面的事件（如果有的话）放入 js 引擎执行。每一次循环称为，tick。

但是队列里面的事件哪里来呢？程序通常是分成很多小的块，放入事件循环队列中一个个被执行的。比如：

```javascript
setTimeout(function time() {
  console.log("嗨! 我将在 1 秒后被调用");
}, 1000)
```

在到了 1000ms 后，宿主环境就会将回调函数放入（此时异步是通过回调实现的）事件队列中。又例如，客户端发起 ajax 请求，宿主环境监听到服务器响应到来后，将回调函数放入事件队列等待执行。

但是有个问题，如果此时事件队列中有 10 个事件等待执行。那么 setTimeout 的回调函数就不会得到立即执行。这也是 setTimeout 的精确度不高的原因。

这也是下面的代码调用 setTimeout 1000 次，不会 1000 马上一起执行的原因，需要一个一个来:

```javascript
for(let i  = 0; i < 1000; i++) {
  setTimeout(function time() {
    console.log("嗨! 我又来了");
  }, 0)
}
```



### 什么是回调？

------

说了这么多，终于轮到了我们今天的主角**回调**。

js 最原始的执行异步的操作即是：回调。也就是说，将需要异步执行的代码，封装进一个函数中，待到执行的时机成熟，将此函数放入事件循环中。此函数就叫：异步回调函数。

其他的我们就不管了，为了简单，这里将异步回调函数，简称：回调。

你懂了没？

反正我是有点云里雾里😔

直接上代码吧：

```javascript
// success 是一个回调
ajax("http://example.com?index=1", function success(data) {
  console.log(data);
});

// func 是一个回调
setTimeout(function func() {
  console.log('hello')
}, 1000)

// clickEvent 是一个回调
$.on('click', function clickEvent() {
  console.log('click');
}, false)
```



### 回调问题之回调地狱

------

上面的代码挺好的看起来没什么问题呀？

那我们来看看这个：

```javascript
// 假设有这么个依赖关系的 api 请求
function request() {
  ajax("http://example.com", function cb1(index) {
    ajax("http://example.com?index=" + index, function cb2(data) {
      ajax("http://example.com?data=" + data, function cb3() {
        console.log('ok');
      })
    })
  })
}
```

这就形成了社区人闻风而逃的回调地狱。
这只是一个简单的模拟，真实情况下，各个函数内部还会包含各种各种的业务逻辑代码。如果中间有什错误调试也极其困难。因为我们的大脑分析事物是按顺序一个个进行的，而分析这种代码，我们的大脑需要跳来跳去，理解难度增大。

有人不服了，把它们拆分出来不久行了嘛？

好！

```javascript
// 假设有这么个依赖关系的 api 请求
function request() {
  getIndex();
}

function getIndex() {
  ajax("http://example.com", function cb1(index) {
    getData(index);
  })
}

function getData(index) {
  ajax("http://example.com?index=" + index, function cb2(data) {
      generatorResult(data)
  })
}

function generatorResult(data) {
  ajax("http://example.com?data=" + data, function cb3() {
     console.log('ok');
  })
}
```

虽然看起来是顺序了点，但是本质问题还是没有改变，现实中的代码也不可能这样干净，还会有很多其他业务代码参杂在里面，你有时候甚至不知道这是异步调用还是同步调用。

借用 Kyle Simpson 大神的一段代码：

```
doA(function() {
  doB();
  doC(function() {
    doD();
  });
  doE();
});
doF();
```

你能一眼看出这段代码的执行顺序嘛？

### 回调问题之信任问题

------

回调还有信任问题？

当然，如果你跟第三方接口合作过的话，例如：

```javascript
function callback() {
	// do something
}

thirdAPI(callback)
```

然后我问你，callback 什么时候会执行？

不知道～

callback 会出现什么异常吗？

不知道～

callback 会被调用吗？

不知道～

….

相当于把代码扔进了一个黑盒，发生什么你无法知道，也无法控制（或者说难以控制，因为你不知第三方会给你一个怎么样的运行环境，难以作出相应的应对策略）。直到有天老板找上门，为什么有客户举报说：购买了我们一次服务，我们扣了客户 5 次钱。然后又是一个凌晨四点钟的夜晚。

第三方的有问题，那自己写的就保证没问题吗？

还真不一定：

```javascript
const res = [];
ajax("http://example.com?index=0", function success(data) {
  res.push(data);
});

ajax("http://example.com?index=1", function success(data) {
  res.push(data);
});
```

你能保证 res[0] 存的一定是 index=0 的结果吗？如果 index=1 先响应呢？

这还不简单吗，改成这样不就完事了？

```javascript
const res = [];
ajax("http://example.com?index=0", function success(data) {
  res[0] = data;
});

ajax("http://example.com?index=1", function success(data) {
  res[1] = data;
});
```

好，现在是解决了顺序问题，那么我怎么判断两个 ajax 都回来了呢？

res[0] && res[1] ?

如果我原本 res 有初始值呢？

好了，这并不是一个优雅的方案。总的来说会有以下 6 个问题：

* 调用过早
* 调用过晚
* 回调未调用
* 调用次数过多或过少
* 未能传递参数/环境值
* 吞掉错误或异常



### 总结

------

采用回调处理异步，会有两个问题：

* 会造成回调地狱，不适合我们大脑的工作方式
* 会有信任问题

那么如何解决呢？

请看下回分析：js异步进化史之Promise