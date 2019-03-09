---
title: "理解apply,call,bind"
date: 2019-03-04
categories: js
tags: 
- apply
- call
- bind
---

之前对 js 的 apply、call、bind 方法零零散散有过一些了解，知道它们可以改变函数运行时的 this。今天来深入理解一番。

其实很多人心想不就是绑定 this 嘛，有什么的。

好，那么这句代码何解？

```
Function.apply.bind(Math.max, null);
```

<!-- more -->

知道呀，不就是 xxxx 嘛

那么这句呢？

```
Function.bind.apply(fn, arguments)
```

知道的就可以直接关闭页面了，还不了解的请往下看	

### 首先什么是 this

------

函数被调用时，会创建一个执行上下文。执行上下文中会包含函数的参数、调用方法等信息。this 就是其中的一个属性。相当于一个指针，至于指向什么，完全取决于函数在哪里被调用。

好像有点晕，我们通过代码来分析一下：

```javascript
const obj = {
  index: 1,
  func: function() {
    console.log(this.index);
  }
}

/*
* 输出什么？
* 不用想了，没什么陷阱
* 1
*/
obj.func(); 

const funcCp = obj.func;

/*
* 输出什么？
* 也没什么难度
* undefined 
* this 指向全局了嘛
*/
funcCp();

function bar(fun) {
  fun();
}

/*
* 输出什么？
* 很多人可能曾经就犯过这个错误了，以为是 1，其实还是
* undefined 
* obj.func 对 fun 进行了隐式赋值
*/
bar(obj.func);
```



### apply

------

apply **调用一个函数**，第一个参数指定运行时 this，第二参数接受一个包含多个参数的数组。（这是与 call 方法的区别)

```javascript
function func(x, y) {
  if (typeof x === 'number') {
    console.log(this.index + x);
  } else {
    console.log(this.index);
  }
}

const obj = {
  index: 1,
}

func.apply(obj); // 1
func.apply(obj, 2); // 报错，第二个参数（如果有）必须为数组
func.apply(obj, [2]); // 3
func.apply(obj, [2], 3); // 3，后面的参数将会忽略
```

apply 经常用于“展开”数组：

```javascript
Math.max.apply(null, [1, 2, 3]); // 3
```

此种做法 es6 称为解构:

```javascript
Math.max(...[1, 2, 3]); // 3
```

#### 手动实现 apply

```javascript
if (!Function.prototype.apply) {
  Function.prototype.apply = function (ctx) {
    if (typeof this !== 'function') {
      throw new TypeError('use apply must be a function');
    }
    ctx = ctx || window;
    ctx.fn = this;
    let result;
    if (arguments[1]) {
      if (!Array.isArray(arguments[1])) throw new TypeError('apply second argument must be a array');
      result = ctx.fn(...arguments);
    } else {
      result = ctx.fn();
    }
    delete ctx.fn;
    return result;
  }
}
```


### call

------

call **调用一个函数**，第一个参数指定运行时的 this，其余参数指定参数列表。

```javascript
function func(x, y) {
  if (typeof x === 'number') {
    console.log(this.index + x);
  } else {
    console.log(this.index);
  }
}

const obj = {
  index: 1,
}

func.call(obj); // 1
func.call(obj, 2); //3

```

#### 手动实现 call

```javascript
if (!Function.prototype.call) {
  Function.prototype.call = function (context) {
    if (typeof this !== 'function') {
      throw new TypeError('use call must be a function');
    }
    context = context | window;
    context._fn = this;
    const args = [...arguments].slice(1);
    let result = context.fn(...args);
    delete context._fn;
    return result;
  }
}
```


### bind

------

bind **创建一个新的函数**，第一个参数指定运行时的 this，其余参数置于实参之前。可以理解为对 apply 方法的封装调用。

```javascript
function func(x, y) {
  if (typeof x === 'number' && typeof y === 'number' ) {
    console.log(this.index + x + y);
  } else {
    console.log(this.index);
  }
}

const obj = {
  index: 1,
}

const newFunc1 = func.bind(obj);
newFunc1(); // 1

const newFunc2 = func.bind(obj, 2);
newFunc2(3); // 6

```

bind 经常用来做柯里化：

```javascript
function func(x, y) {
  console.log(`${x} ------ ${y}`);
}

const k = func.bind(null, 1);
k(2); // 1 ------ 2
```

#### 使用 call 实现 bind

```javascript
if (!Function.prototype.bind) {
  Function.prototype.bind = function (context) {
    if (typeof this !== 'function') {
      throw new TypeError('use bind must be a function');
    }
    context = context || window;
    const _this = this;
    const args = [...arguments].slice(1);
    return function F() {
      // 因为返回的一个函数，可以用 new，所以需要判断
      if (this instanceof F) {
        return new _this(...args, ...arguments);
      }
      return _this.call(context, ...args, ...arguments);
    }
  }
}
```

#### 多次 bind 只有第一次生效

```javascript
function fun() {
  console.log(this.a);
}

const obj1 = {
  a: 1
}
const obj2 = {
  a: 2
}

fun.bind(obj1).bind(obj2)() // 1

// 相当于
// 第二次绑定，相当于绑定绑定后的结果。第一次 fun 的绑定没有影响
function boo(o) {
  return function () {
    fn.call(o, ...arguments); 
  }.call(o2, ...arguments);
}

```


### 进化

------

那么下面语句将会输出什么呢？

```javascript
const fn = function(x) {
  console.log(2 + x);
}

// 聪明的你可能已经想到了，答案为：4
// apply 指定 Function.call 的执行上下文为 fn，并传入参数 2。
// 根据 call 语法规则，call 调用 fn，并传入参数 2
Function.call.apply(fn, [null, 2]);

// 报错，记住 apply 的第二个参数必须为 数组
Function.apply.apply(fn, [null, 2]); 

// 通过, 输出：4
Function.apply.apply(fn, [null, [2]]); 

/*+++++++++++++++++++++++++++++++++++++++++++++++++++++*/
const foo = Function.apply.bind(fn, null, [2]);

// 注意，bind 的作用时生成一个新的函数
// 给 Function.apply 绑定一个 fn 的执行上下文，并将参数 2 传入 fn
foo(); // 4

/*+++++++++++++++++++++++++++++++++++++++++++++++++++++*/
const bar = Function.bind.apply(fn, [fn, 2]);

// 注意，bind 的作用时生成一个新的函数
bar(); // 4

```

