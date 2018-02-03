---
title: "js 异步进化史之Generator"
date: 
categories: 异步
tags: 
- Generator
---

在介绍 Generator 和异步的关系之前，我们先分析下 Generator。看看它给我们带来了什么惊奇的表现。
<!-- more -->
![图片](https://ws2.sinaimg.cn/large/006tKfTcgy1fo38ppgt76j30s20dsdyc.jpg)

下文将会按照这个顺序逐步解析 Genenrator:

1. 什么是 Generator?
2. Generator 和 iterator
3. Generator 和 异步

相信看完下文后，再回过头来看上图 yield 是多么贴切😊

### 什么是 Generator?

------

在 Generator 之前，js 的函数是一个最小执行单位，一旦开始运行，就会运行到结束，期间不会有其他代码能够打断并插入其间。

```javascript
let a = 1;
function foo() {
  console.log(a);
  // 想在这里暂停一下，先对 a 执行一下其他算数操作，再进行下一步
  console.log(a);
}

function main() {
  // 要么提前对 a 操作
  foo();
  // 要么延迟对 a 操作
}
```

像上面这样的普通函数，我们是没有办法对其进行中断的，foo 函数打印的两个 a 始终会一样。

虽然很容易通过其他方式实现上述需求，但是我就是这么任性，就要在两个 console 之间暂停，怎么办呢？

Generator 犹如周星驰上赌场，风流潇洒的进入了我们的视野～

```javascript
let a = 1;
function *foo() {
  console.log(a);
  yield; // 在这里暂停
  console.log(a);
}

function main() {
  // 构造一个 iterator 控制整个 generator
  let it = foo();
  it.next();
  a ++;
  it.next();
}

main(); // 输出 1, 2
```

细心的同学可能发现了 foo 函数的一些变化（发现的不了的是有多粗的心呀～

foo 函数前面多了一个 * 符号，并且两个 console 语句之间多了一个 yield 语句。main 中 foo 的执行也有了很大改变。不急我们从 main 函数的执行开始一步一步来分析：

1. it = foo()，并没有执行生成器 *foo()，而是构造了一个 iterator，由这个 iterator 控制生成器的执行；
2. 第一条 it.next() 语句启动生成器 *foo()，并执行第一条 console.log(a) 语句，此时 a = 1；
3. 生成器 *foo() 遇到 yield 语句停止，并且在这点上，第一条 it.next 语句停止。此时 *foo() 仍在运行并且是活跃的，但处于暂停状态；
4. 执行语句 a ++，此时 a = 2；
5. 执行第二条 it.next() 语句，*foo() 生成器从暂停恢复执行，执行第二条 console.log(a) 此时输出 2；

因此可以看出 Generator 函数是一类特殊的函数，可以在一处或多处暂停，并且不一定要执行完。

注：Generator 函数有三种写法：function *foo()、function\* foo()、 function\*foo()。喜欢那种都没有关系，坚持一种风格就可以了，下文将采用第一种。

#### 输入与输出

我我我...

我什么我，直接看代码

```javascript
function *foo() {
  const x = yield;
  console.log(x);
}

const it = foo();
it.next(); // 运行到 yield 语句暂停
it.next(2); // console 将输出 2

```

可以通过 next() 方法向 Generator 函数内部传递值。

> 注意第一个 next() 不接受任何参数，即使传参数进去也会被忽略，因为没有相应的  yield 受理

再看看输出

```javascript
function *foo() {
  const x = yield 1;
  console.log(x); // 2
}

const it = foo();
console.log(it.next()); // {value: 1, done: false}
console.log(it.next(2)); // {value: undefined, done: true}
```

可以看出 next 方法返回一个对象，包含 value、done 两个字段

* value: iterator 返回的任意 javascript 值
* done: 表示是否遍历到 iterator 的末端，是的话 done 为 true, 否则 false

那么第二个 it.next() 语句的 value 为什么是 undefined? 因为最后一个 next 的 value 值为函数的返回值（return），默认返回值 undefined

#### 错误处理

真正健壮的代码是需要完善的错误处理机制的，Generator 也不例外：

```javascript
function *foo() {
  try {
    const x = yield 1;
    console.log(x);
  } catch(err) {
    console.log(err); // 不会执行
  }
}

const it = foo();
try {
  it.throw('generator Erorr')
} catch(err) {
  console.log(err + ' outer'); // 执行
}
```

因为 *foo() hai 没有启动，就抛出错误，只能从函数外部进行错误捕获。

```javascript
function *foo() {
  try {
    const x = yield 1;
    console.log(x);
  } catch(err) {
    console.log(err); // 执行
  }
}

const it = foo();

it.next();
try {
  it.throw('generator Erorr')
} catch(err) {
  console.log(err + ' outer'); // 不执行
}

/*
+++++++++++++++++++++++++++++++++++++++++++++++++++
*/

function *foo() {
  try {
    const x = yield 1;
    console.log(x);
  } catch(err) {
    console.log(err); // request error
  }
}
const it = foo();
it.next();

function request() {
  ajax('http://example.com', function(err, data) {
    it.throw('request error');
  })
}

```

抛入 Generator 里面的错误，可以由内部捕获，异步也一样

```javascript
function *foo() {
  const x = yield 1;
  console.log(x);
}

const it = foo();

it.next();
try {
  it.throw('generator Erorr')
} catch(err) {
  console.log(err + ' outer'); // 执行 generator 没有捕获的往外抛出
}
```

#### 多个 iterator

不知道各位同学有没有注意到上文的一个细节，我写 Generator 都是用大写（ js 编程习惯，类首字母大写）。因为我们 Generator 也跟类类似，每生成一个 iterator 相当于生成一个该 Generator 的实例。来玩一个好玩的：

```javascript
let a = 1;
let b = 1;
function *foo() {
  a++;
  yield;
  b = a + b;
  yield;
  b *=b;
  yield;
  
  console.log(a, b);
  return 0;
}

const it1 = foo();
const it2 = foo();

it1.next(); // a = 2; b = 1;
it1.next(); // a = 2; b = 3;
it1.next(); // a = 2; b = 9;
it1.next(); // 2, 9;

it2.next(); // a = 3; b = 9;
it2.next(); // a = 3; b = 12;
it2.next(); // a = 3; b = 144;
it2.next(); // 3, 144
```

好了， 到目前没什么问题，让我们换换顺序：

```javascript
it1.next(); // a = 2; b = 1;
it2.next(); // a = 3; b = 1;

it1.next(); // a = 3; b = 4;
it2.next(); // a = 3; b = 7;

it1.next(); // a = 3; b = 49
it2.next(); // a = 3; b = 49 * 49

it1.next(); // 3, 49
it2.next(); // 3, 49 * 49 
```

只要安排的合理，换换执行顺序就能得到不同的值。这还是只有两个实例，更多实例呢？*foo() 设计的更巧妙呢？把输入，输出加上去呢？ 不止一个 Generator 共享数据呢？感觉可以出个脑力游戏了，哈哈

那到底 iterator 是怎么一个机制呢？下面一起来看看

### Generator 和 iterator

------

iterator 是 ES6 提出来的一个新概念，定义了 iterator 的 Object 可以被 for…of 循环使用。

现在有一个要求，要你打印斐波那契数列（前面两位数相加，作为第三位数 1,1,2,3,5,8…..），你很可能很快写出下列代码

```javascript
const func = (function() {
  let val1 = 0;
  let val2 = 0;
  return function () {
    if (val1 === 0 && val2 === 0)  {
      val2 = 1;
      return 1;
    }
    let result = val1 + val2;
    val1 = val2;
    val2 = result;
    return result;
  }
})();

console.log(func()); // 1
console.log(func()); // 1
console.log(func()); // 2
console.log(func()); // 3
console.log(func()); // 5
console.log(func()); // 8
```

要一个一个执行有点麻烦呀，我们来改改：

```javascript
const func = (function() {
  let val1 = 0;
  let val2 = 0;
  return {
    [Symbol.iterator]: function() {return this;},
    next: function() {
      if (val1 === 0 && val2 === 0)  {
        val2 = 1;
        return {
          value: 1,
          done: false
        };
      }
      let result = val1 + val2;
      val1 = val2;
      val2 = result;
      return {
        value: result,
        done: false
      };
    }
  }
})();

for(let v of func) {
  console.log(v);
  if (v > 50) {
    break;
  }
} // 1, 1, 2, 3, 5, 8, 13, 21, 34, 55

```

for…of 循环会每次去调用 next()，直到 done 为 true。上面的代码其实就是一个 iterator，因为它的接口中有一个 next 方法。

既然我们生成器也是返回的也是 iterator ，我们再来改改上面的代码：

```javascript
function *func() {
  let val1 = 0;
  let val2 = 0;
  while(true) {
    if (val1 === 0 && val2 === 0)  {
        val2 = 1;
        yield val2;
      }
      let result = val1 + val2;
      val1 = val2;
      val2 = result;
      yield result;
  }
}

for(let v of func()) {
  console.log(v);
  if (v > 50) {
    break;
  }
} // 1, 1, 2, 3, 5, 8, 13, 21, 34, 55
```

是不是优雅很多 😊

但是像上面的代码 while(true)，我们是不是没有办法停止 Generator 了？

有，我们一起来看看

#### 停止 Generator

上面的例子中 break 之后，iterator 貌似就处于永远挂起状态了。实际上，for…of 循环发生“异常结束”（提前终止），通常由 break、return 或者未捕获异常引起，会向 Generator 的 iterator 发送一个信号使其终止。

可以这样用：

```javascript
const it = func();
for(let v of it {
  console.log(v);
  if (v > 50) {
    it.return('hello world');
  }
} 
```

如果在 Generator 内有 try…finally 语句，它将总是运行，即使生成器外部结束。如果需要清理资源的话（数据库连接等），这一点非常有用

```javascript
function *func() {
  try {
    let val1 = 0;
    let val2 = 0;
    while(true) {
      if (val1 === 0 && val2 === 0)  {
          val2 = 1;
          yield val2;
        }
        let result = val1 + val2;
        val1 = val2;
        val2 = result;
        yield result;
    }
  } finally {
    // 做清理工作
  }
}
```

 不是说好我们今天的主题是 Generator 和异步嘛？怎么看了半天，异步的影子都没见着？

不急不急，磨刀不误砍柴工嘛。

action!



### Generator 和 异步

------

其实我们上面已经稍微提到了 Generator 和 异步。

过去半个世纪了谁还记得呀？哼！

好吧～，我的锅

```javascript
function *foo() {
  try {
    const text = yeild;
    console.log(text);
  } catch(err) {
    console.log(err);
  }
}

const it = foo();
it.next();

ajax('http://example.com', function(err, data) {
  if (err) {
    it.throw(err);
  } else {
    it.next(data);
  }
})
```

前面介绍 Generator 错误处理的时候，已经说明了可以 Generator 捕获异步异常是不是很棒？

还有，仔细看看前面对的代码，看似同步执行，实际上却可以异步，是不是更加棒棒？

#### Generator 和 Promise

既然 Promise 能够解决回调的信任的问题，不清楚建议先看看[js 异步进化史之Promise](https://winixt.me/js%E5%BC%82%E6%AD%A5%E8%BF%9B%E5%8C%96%E5%8F%B2%E4%B9%8BPromise/)，我们将 Generator 与 Promise 结合起来看看

```javascript
function request(url) {
  return new Promise(function(resolve, reject) {
    ajax(url, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  })
}

function *foo(url) {
  try {
    const text = yeild request(url);
    console.log(text);
  } catch(err) {
    console.log(err);
  }
}

const it = foo();

it.next().value    
  .then(function(data) {
    it.next(data);
  }, function(err) {
    it.throw(err);
  })

```

是不是优雅了很多？不仅解决了 Promise 处理错误的问题，还以更同步的方式编写异步代码。

但是还有个小小的遗憾，then 还是要我们手动调用。如果有什么能够自动处理 then 就好了。

还真有，请看这个缩小版：

```javascript
function run(gen) {
  let args = [].slice.call(arguments, 1);
  let it = gen.apply(this, args);
  return Promise.resolve().then(function handleNext(value) {
    let next = it.next(value);
    return (function handleResult(next) {
      if (next.done) {
        return next.value;
      } else {
        return Promise.resolve(next.value)
               .then(handleNext, function handleError(err) {
                 return Promise.resolve(it.throw(err))
                        .then(handleResult);
               })
      }
    })(next);
  })
}
```

然后我们的代码就变成了

```javascript
function *foo(url) {
  try {
    const text = yeild request(url);
    console.log(text);
  } catch(err) {
    console.log(err);
  }
}

run(foo, 'http://example.com');
```

简直逆天了～，异步代码同步写呀

如果你用 co 库，那么上面的代码你会非常熟悉

#### Generator 委托

至今为止，我们还没有试过在 Generator 里面调用 Generator，如果调用会发生什么呢？

```javascript
function *foo(url) {
  let r1 = request('http://example.com?index1');
  let r2 = request('http://example.com?index2');
  return r2;
}

function *bar() {
  let r2 = run(foo);
  let r3 = request('http://example.com?index3');
  console.log(r2);
}

run(bar);
```

你可能会问真的需要使用两次 run 函数吗？不能像普通函数一样，直接一个调用另外一个吗？

可以的，小伙子你很聪明

```javascript
function *foo() {
  yield 'B';
  yield 'C';
  return 'D';
}

function *bar() {
  yield 'A';
  let result = yield *foo();
  console.log(result + ' return to bar');
  yield 'E';
  return 'F';
}

const it = bar();

console.log(it.next().value); // A
console.log(it.next().value); // B   此处 it 已经委托到 foo
console.log(it.next().value); // C
console.log(it.next().value); // E 
// D return to bar
console.log(it.next().value); // F
```

上面这种 iterator 的转换称为 Generator 委托。

事件也可以委托，🆒

```javascript
function *foo() {
  try {
    yield 'B';
  } catch(err) {
    console.log(err); // foo error
  }
  yield 'C';
  return 'D';
}

function *bar() {
  yield 'A';
  let result = yield *foo();
  console.log(result + ' return to bar');
  yield 'E';
  return 'F';
}

const it = bar();

console.log(it.next().value); // A
console.log(it.next().value); // B   此处 it 已经委托到 foo
it.throw('foo error'); 
```



然后我们刚开始的代码就可以改为只需要使用一次 run：

```javascript
function *foo(url) {
  let r1 = request('http://example.com?index1');
  let r2 = request('http://example.com?index2');
  return r2;
}

function *bar() {
  let r2 = *foo();
  let r3 = request('http://example.com?index3');
  console.log(r2);
}

run(bar);
```



### 总结

------

Generator 已经可以让我们实现以同步的方式编写异步代码了，但是有个小小遗憾，就是要额外引入 Generator 库，例如 co：

```javascript
const co = require('co');
co(function* (){
    let text = yield requst('http://example.com')
    console.log(text);
}).catch(err => {
    console.log(err);
});
```

而且还多了 co～

很好有极致的编程思维

ES 工作组的大佬们也早已洞察到了这一点，于是在 ES7 上添加了更为强大的异步工具

**async/await**

请看下一篇：js异步进化史之async