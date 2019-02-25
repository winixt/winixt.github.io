# 简历要点

STAR法则：情境(situation)、任务(task)、行动(action)、结果(result)；
所有你列出的项目，都要想好怎么说，按照 STAR 法则来整理你的思路。
对于不能很好展开的点，就不要写在简历上。
Github：https://github.com/winixt

- nginx
  - 这个项目的诞生背景是什么？要解决什么问题？项目成果是什么？

- 脚手架项目
  - 这个你仔细准备下，我们团队的面试官可能会问的比较多
  - 有没有横向比较？
  - 加粗部分好像有拼写错误

- 题库项目
  - 想下怎么描述成果？

第一份简历，是给面试官或其他看的。这份简历除了罗列任务，罗列“干了什么”之外，在重要的任务中（占比20-30%）还应说清楚“结果（result）”，即：任务取得了什么成绩？最终数据/KPI是什么？你在结果（result）起了多重要的影响等等。

第二份简历，应该是腹稿或准备好的纸质文件，将第一份简历中的各种任务，理清情境(situation)，采取行动（action），所得结果（result），甚至是更深一层的，HR或管理者常问的：“如果这个任务再做一次，你想怎么改进？”“任务中最难的一点是什么，你怎么攻克的？”

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

