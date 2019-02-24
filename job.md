

## 遗忘的小知识点

* 多次 bind，只有第一次 bind 会生效
* [] == ![] 结果为 true
* 或运算取整:位运算只对整数有效，遇到小数时，会将小数部分舍去，只保留整数部分。所以，将一个小数与0进行或运算，等同于对该数去除小数部分，即取整数位。 

## 对象拷贝

### 浅拷贝

* `Object.assign({}, obj)`
* `{ ...obj }`

### 深拷贝

1. `JSON.parse(JSON.stringify(obj))`
   会有以下四个问题
   * 会忽略 undefined
   * 会忽略 symbol
   * 不能序列化函数
   * 不能解决循环引用问题

2. 使用 messageChannel (也不能解决函数问题)
```js
    function deepCopy(obj) {
        return new Promise((resolve) => {
            const {port1, port2} = new MessageChannel();
            port2.onmessage = ev => resolve(ev.data);
            port1.postMessage(obj);
        })
    }

    const obj = {};
    async function foo(data) {
        const dataCopy = await deepCopy(data);
    }
```

手动实现 call
```js
Function.prototype.myCall = function(ctx) {
    ctx = ctx || window;
    ctx.fn = this;
    const args = [...arguments].slice(1);
    const result = ctx.fn(...args);
    delete ctx.fn;
    return result;
}

// 手动实现 bind
Function.prototype.myBind = function(ctx) {
    const _this = this;
    const args = [...arguments].slice(1);
    return function F() {
        if (this instanceof F) {
            return new _this(...args, ...arguments);
        }
        return _this.apply(ctx, args.concat(arguments));
    }
}
```

