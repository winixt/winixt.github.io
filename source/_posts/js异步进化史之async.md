---
title: "js 异步进化史之async"
date: 
categories: 异步
tags: 
- async/await
---

我们的 js 处理的异步的方式不断进化，现在已经到了第四代，最强之 async

<!-- more -->

![图片](https://ws4.sinaimg.cn/large/006tKfTcgy1fo3j1dq8qjj30ko05fmxw.jpg)



### 什么是 async？

------

async 定义了一个异步函数，并总是返回一个 Promise。当执行到 await 表达式，async 函数会暂停执行，等待表达式中的 Promise 决议后，async 再继续执行。

上一篇 js异步进化史之Generator 代码，用同步的方式编写异步代码，要做到方便使用，需要引入额外的库，代码如下：


```javascript
const co = require('co');
co(function* (){
    let text = yield requst('http://example.com')
    console.log(text);
}).catch(err => {
    console.log(err);
});
```

现在我们用 async 改写一下

```javascript
async function foo() {
  try {
    let text = await requst('http://example.com');
  } catch(err) {
    console.log(err);
  }
}
```

是不是更逆天，不需要额外引入函数库，也没有 co 什么的，直接原生 js 支持。

哎呀，爱死 js 了，爱死 ES 工作组人员了。

### async 返回值

------

async 的定义表明，async 总是返回一个 Promise。其实就像这样

```javascript
async function foo() {
  return Promise.resolve(value);
}
```

用 Promise.resolve 包装返回结果，新建一个 Promise。不清楚 Promise 的可以看 [js 异步进化史之Promise](https://winixt.me/js%E5%BC%82%E6%AD%A5%E8%BF%9B%E5%8C%96%E5%8F%B2%E4%B9%8BPromise/)

### async 并发

------

直接上代码吧

```javascript
const p1 = requst('http://example.com?index=1');
const p2 = requst('http://example.com?index=2');
const p3 = requst('http://example.com?index=3');

async function foo() {
  try {
    let text = await Promise.all([p1, p2, p3]);
  } catch(err) {
    console.log(err);
  }
}
```

哇～

nice!

nice!

nice!



最后最后的最后

连更四篇博客 回调 > promise > generator > async 真的累呀～

而且还是写的冰山一角，可以想象一下 ES 工作组的人员花费了多少心血

ES 工作组的成员，以及参与 ES 改进的广大社区朋友们幸苦了！！！致敬