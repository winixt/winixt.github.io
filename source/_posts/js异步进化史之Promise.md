---
title: "js 异步进化史之Promise"
date: 
categories: 异步
tags: 
- Promise
---

在上一篇 [js 异步进化史之回调](https://winixt.me/js%E5%BC%82%E6%AD%A5%E8%BF%9B%E5%8C%96%E5%8F%B2%E4%B9%8B%E5%9B%9E%E8%B0%83/) 我们了解到基于回调处理异步问题存在一些缺陷。那么 Promise 是什么？能够解决回调造成的问题吗？又会不会引入新的问题？下面我们一起来分析一下。

<!-- more -->

![Promise](https://ws3.sinaimg.cn/large/006tKfTcgy1fo2arjy216j31jk0vzn1j.jpg)

### 什么是 Promise?

------

Promise 英文意思：承诺。嗯，一看就觉得靠谱！

Promise 只有三种状态：未决议、resolve、reject，并且一旦决议，状态不可在更改。只能由未决议 > resolve，或 未决议 > reject，两条状态转换路线，不能逆转，resolve 也不能转为 reject。如图：

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1fo2c2khvv8j30oo0dwt9c.jpg)

小时候有玩过鞭炮的小朋友可以会想到，未决议状态不就像点燃鞭炮一样吗？要么成功爆炸(resolve)，要么是哑炮(reject)。

没错，就是这样，但是我还是不明白 Promise 是什么？

好吧，我们继续，你会明白的~

I promise!



### 理解 Promise

------

我们先放下对 Promise 概念的纠结，首先想想这两个问题：

1. es6 提供的 Promise 基于底层实现的那些改变，能否通过回调等其他机制进行模拟？
2. Promise 是为了解决什么问题而出现的？

不急，我们一个一个问题来处理～

#### es6 之任务队列

在 es6 中新增了一个名为**任务队列**的概念，该队列建立于事件循环队列之上。而 Promise 的异步特性正是基于任务队列。事件循环队列我们在[js 异步进化史之回调](https://winixt.me/js%E5%BC%82%E6%AD%A5%E8%BF%9B%E5%8C%96%E5%8F%B2%E4%B9%8B%E5%9B%9E%E8%B0%83/)已经介绍过，这里不在赘述，我们来详细分析下任务队列。

大家来看看这段代码输出顺序是什么？（先有自己的答案再往下看）

```javascript
setTimeout(function() {
  console.log('A');
}, 0);

Promise.resolve(1).then(function() {
  console.log('B');
  Promise.resolve(1).then(function() {
    console.log('C');
  });
});

console.log('D');
```

正确顺序是 D > B > C > A

为什么？因为任务队列是建立在事件循环队列上的队列，也就是说….算了我也说不清，上图上图

![图片](https://ws3.sinaimg.cn/large/006tKfTcgy1fo2hg2scibj310e0pe763.jpg)

也就是说，js 引擎会优先处理任务队列的任务，直到任务任务队列为空才转而执行事件循环队列的事件。所以理论上说，任务循环可能会导致无限循环，进而导致程序饿死，无法转移到下一个事件循环 tick。

注：这里主要为了方便理解，真实情况不是这样的，其实一个浏览器环境只能有一个事件循环，而一个事件循环可以多个任务队列，每个任务都有一个任务源）。相同任务源的任务，只能放到一个任务队列中。不同任务源的任务，可以放到不同任务队列中。

是不是有种 vip 通道的感觉？【滑稽】

#### Promise 与 任务队列

为什么 Promise 要基于任务队列呢？这样能解决什么问题？

这是为了满足一些低延迟的异步操作。比如：

```
Promise.resolve(2).then(function(data) {
  console.log(data)
});
```

这种可以直接同步运行，但是又不得不异步运行的代码，你不希望它排一个长长的事件队列再执行吧？

为什么说可以同步运行，但又不得不异步运行呢？

请看：

```javascript
let a = 0;

function boo() {
  console.log(a);
}

request('http://example.com', boo);

a++;

```

请问这里打印 0 还是 1？要看情况而定。如果 request 是同步的那么打印 0，如果是异步则打印 1。在真实的开发环境中遇到这种不确定因素会造成极大的麻烦。

怎么办呢？有轻功

```javascript
let a = 0;

function boo() {
  console.log(a);
}

function func() {
  return new Promise(function(resolve, reject) {
    request('http://example.com', resolve);
  })
}

func().then(boo);

a++;

```

这样可以永远保证 console 输出为 1

#### Promise 之并发

想必大多数前端工程师都遇到过下面类似的情况吧？

```javascript
let data1, data2;

ajax('http://example.com?index=1', function (data) {
  data1 = data;
  if (data1 && data2) {
    console.log(data1 + data2); // console 依赖于异步结果 data1 和 data2
  }
});

ajax('http://example.com?index=2', function (data) {
  data2 = data;
  if (data1 && data2) {
    console.log(data1 + data2); // console 依赖于异步结果 data1 和 data2
  }
});
```

这代码虽然没什么问题，但是看起来总不太优雅，语句 if (data1 && data2) 存在于两个地方，如有改动，需要两个地方都改。让我们用 Promise 试试：

```javascript
function request(url) {
  return new Promise(function(resolve, reject) {
    ajax(url, function(err, data) {
      if (!err) {
        resolve(data);
      } else {
        reject(err);
      }
    })
  })
}

const p1 = request('http://example.com?index=1');
const p2 = request('http://example.com?index=2');

Promise.all([p1, p2]).then(function(data) {
  console.log(...data);
});
```

是不是优雅很多😊

#### Promise 与回调

我们在上一篇[js 异步进化史之回调](https://winixt.me/js%E5%BC%82%E6%AD%A5%E8%BF%9B%E5%8C%96%E5%8F%B2%E4%B9%8B%E5%9B%9E%E8%B0%83/)中提到过这么一句话：

回调相当于将代码扔进一个黑盒，发生什么你无从得知。当黑盒运行完了它的代码，自动会调用你的回调函数。

而 Promise 却反过来"监听"黑盒的运行情况，"监听"到黑盒运行完了，就马上调用相应的函数。

呃，有点难懂！

好吧，上代码：

```javascript
// 第三方 API（thirdAPI)，结束运行后，调用 func
function func(err, data) {
  // do somethind
}

// 第三方 API
thirdAPI(func)
```

以上是回调存在的一个信任的问题，我们无法保证第三方 API，在什么环境下调用我们的函数 func，出了错误我们也无法监听，等等一系列问题。（也就是把我们的代码扔进了黑盒）

首先想想我们为什么不能在自己的环境下调用 func 呢？因为我们不知道 thirdAPI 什么时候能够运行完呀，因此不知道该什么时候调用 func 才好。

既然这样，如果我们能够监听到 thirdAPI 运行完，岂不是可以在监听到 thirdAPI 运行完就可以调用我们的 func 了？就像：

```javascript
function fulfilled() {
  // do something
}

function rejected() {
  // do something
}

// 第三方 API
function thirdAPI() {
  ajax(url, function(err, data) {
    if (err) {
      listener.emit('rejected', err)
    } else {
      listener.emit('fulfilled', data)
    }
  });
  return listener;
}
let listener = thirdAPI();

listener.on('fulfilled', fulfilled);
listener.on('rejected', rejected);
```

这就非常类似我们的"监听"黑盒功能了，但是要手动实现一个发布订阅模式 listener。

改用 Promise 后：

```javascript
function fulfilled() {
  // do something
}

function rejected() {
  // do something
}

// 第三方 API
function thirdAPI() {
  return new Promise(function(resolve, reject) {
    ajax(url, function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve
      }
    });
  })
}

// nice
thirdAPI().then(fulfilled, rejected);

```

#### Promise 链式流

Promise 出来这么久了，即使没有直接用过 Promise，相信也间接用过不少。例如，Fetch 就是基于 Promise 封装的，这块代码你应该很熟悉：

```javascript
fetch('http://example.com?index=1')
  .then(function(res) {
    if (res.ok) {
      return res.json();
    }
    throw "Request Error";
  }).then(function(data) {
    console.log(data);
  }).catch(function(err) {
    console.error(err);
  });
```

上面的 then … then … catch 就是 Promise 的链式流。catch 稍后我们在介绍，这里先说下 then。

运行 then 之后会发生什么呢？为什么可以一直 then 下去？

运行 then 之后，会返回一个 Promise。具体来说是 Promise.resolve(/*then 的返回值*/)

Promise.resolve 的作用:  返回一个以给定值解析后的Promise对象。但如果这个值是个thenable（即带有then方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态（指resolved/rejected/pending/settled）；否则以该值为成功状态返回promise对象。

这里有个问题，虽然貌似部分解决跟踪回调时，脑子跳来跳去的问题，但是我想说的是 then 也烦呀，虽然没回调烦～。

#### Promise 错误处理

Promise 的错误处理，可以将函数放在 then 的第二个参数上，也可以用 catch 捕获：

```javascript
Promise.resolve(1).then(function fulfilled() {
  // success
}, function rejected() {
  // error
})

// 或者
Promise.resolve(1).then(function fulfilled() {
  // success
}).catch(function(err) {
  // error
})

// then 的两个参数有默认值
Promise.resolve(1).then(function (value) {
  return value; // 默认将 value 直接返回
}，function (err) {
  throw err; // 默认直接将 err 抛出
})

```

但是如果 catch 中也发生错误呢？由谁来捕获？所以这也算是 Promise 的一个缺陷。

#### Promise 适配版

当在不支持 Promise 的浏览器器中使用 Promise 时，可以使用相关的适配版，其定义了 Promise 及它的所有相关特性，例如，Native PromiseA。

### Promise API 概览

------

上文已经零零散散展示了一些 Promise API 的用法，下面我们来总结一下。

#### new Promise(...) 构造器

Promise 构造函数接受一个函数作为参数。这个函数是同步调用的，并且接受两个参数（resolve 和 reject）作为回调，由 js 引擎提供，用以 Promise 决议。

```javascript
new Promise(function(resolve, reject) {
  console.log('A');
  resolve();
  console.log('B')
}).then(function() {
  console.log('C');
})
console.log('D');
```

输出顺序为：A > B > D > C

reject 就是拒绝这个 promise，当发生错误或者其他异常的时候，就会调用 reject。

resolve 可能是完成 promise，也可能是拒绝 promise。要视传入的参数而定，当传入的参数为非 promise、非tenable 的立即值，这个 promise 就会用这个值完成。

但是，如果传给 resolve 的值是 promise 或 thenable，这个值将会被递归展开，并且 promise 将取其最终决议值或状态。例如：

```javascript
const errP = new Promise(function(resolve, reject) {
  throw 'Error Promise';
})

new Promise(function(resolve, reject) {
  resolve(errP);
}).then(function() {
  console.log('完成Promise'); // 不会执行
}, function(err) {
  console.log(err) // Error Promsise
})
```

#### Promise.reject(…) 和 Promise.resolve(…)

Promise.reject 用来创建一个被拒绝的 promise。不管传入什么参数 thenable 也好、promise 也好不会对其进行展开，最终决议都是拒绝。例如：

```javascript
const p1 = new Promise(function(resolve, reject) {
  reject('some thing');
});

const p2 = Promise.reject('some thing');// p1 和 p2 等价
```

Promise.resolve 用来创建一个已完成的 promise。与 Promise.reject 不同，如果传入值是thenable，会对值进行展开。最终的决议值可能是完成，也可能是拒绝。

```javascript
const errP = new Promise(function(resolve, reject) {
  throw 'Error Promise';
})

Promise.resolve(errP).then(function() {
  console.log('完成Promise'); // 不会执行
}, function(err) {
  console.log(err) // Error Promsise
})

Promise.resolve(3).then(function(data) {
  console.log(data); // 3
})
```

注：如果传入的值是真正的 promise，Promise.resolve 会直接将这个值返回，不会做其他操作。

#### then(…) 和 catch(...)

每个 Promise 实例都会有 then 和 catch 方法，通过这两个方法可以为 promise 注册完成或拒绝函数。promise 决议之后会调用其中一个函数，完成 或 拒绝。但是不会两个方法都调用，只能调用其中一个，且只调用一次。自然也都是异步的。

then 接受两个函数作为参数，第一个用于完成，第二个用于拒绝。也都有默认值，如果有哪个参数没有传或者传入非函数值都会被默认函数取代。默认完成函数只是简单的将值返回，默认拒绝函数会简单的将出错原因抛出。

```javascript
// then 的两个参数有默认值
Promise.resolve(1).then(function (value) {
  return value; // 默认将 value 直接返回
}，function (err) {
  throw err; // 默认直接将 err 抛出
})
```

catch 只接受一个拒绝函数作为参数，并自动默认替换回调。

```javascript
const p = new Promise(function(resolve, reject) {
  resolve(2);
})

p.then(null, function(err) {
  console.log(err);
})
// catch 和 then(null, function) 等价
p.catch(function(err) {
  console.log(err);
})
```

then(…) 和 catch(…) 都会创建并返回的一个新的 promise，这个 promise 可用于实现 promise 的链式流控制。如果完成或拒绝回调中抛出异常，那么返回的 promise 是拒绝的。如果任意一个回调返回 非 promise、非 thenable 的立即值，那么这个值会当作返回 promise 的完成值。如果处理函数返回一个 promise 或 thenable，那么这个值将会被展开，并作为返回 promise 的决议值。

#### Promise.all([…]) 和 Promise.race([...])

Promise.all([…]) he Promise.race([…]) 都会创建一个 promise 作为返回值，其决议值由传入的 promise 数组决定。

Promise.all([…])，只有传入的所有 promise 都完成，返回的 promise 才能完成。如果有任何一个的 promise 被拒绝，那么返回的 promise 就立刻被拒绝，并且抛弃其他 promise 的值。如果完成，会得到一个数组，其中包含所有 promise 的完成值。如果拒绝，只会得到第一个被拒绝的 promise 的决绝值。

Promise.race([…])，只要第一个 promise （完成或拒绝），那么返回的 promise 立即（完成或拒绝），并将第一个完成的 promise 的决议值，作为返回 promise 的决议值。

```javascript
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.reject('error');

Promise.race([p3, p2, p1]).then(function() {
  console.log(data);
}).catch(function(err) {
  console.log(err)； // error
})
```

注：若 Promise.all([…]) 传入空数组，它会立即完成。但 Promise.race([…]) 会挂，永远不会决议。

ES6 Promise API 非常直观。至少足以处理最基本的一些异步情况，但也有它的局限性，下面我们来讨论一下。



### Promise 局限

------

首先是处理错误的顺序，前文我们已经讨论过了，可以翻回去看看。

其次我觉的 then(…) then(…) then(…) 的很烦。虽然它部分解决了回调地狱的问题～

还有其他比较细微的问题，我没有相应的实践不太好说，推荐各位看

**《你不知道的 javascript 中卷》**



至于上面的小问题怎么解决呢？请看下篇

js异步进化史之 Generator