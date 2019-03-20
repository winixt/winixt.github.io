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

扎实的基础 + 算法 + 一技之长

react + egg + koa + webpack

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

### 状态管理的一些思考

> 工具质量 = 工具节省的时间/使用工具消耗的时间


#### reducer + action 的真正作用?

1. 复用数据更改逻辑？
2. 使数据更改透明化，方便追踪 bug
3. 方便做独立测试
4. 可以扩展去表达复杂的更新逻辑

> 扩展思维
> 你真的需要知道数据是怎么变更的吗？是否可以实现一个类似 apollo-graphql 的库，你只需要通知什么时候去拉取数据，什么时候去更新数据，其他数据管理都交给数据层处理。
> 当然，apollo-graphql 也可以很好的实现数据变更的可视化。


#### reducer | action 的重新思考

action 负责改 store 以外所有事，而 reducer 负责改 store，偶尔用来做数据处理。
重新考虑这个问题，我们只有两类 action：reducer action 与 effect action。

reducer action：改变 store。
effect action：处理异步场景，能调用其他 action，不能修改 store。
同步的场景，一个 reducer 函数就能处理，只有异步场景需要 effect action 处理掉异步部分，同步部分依然交给 reducer 函数，这两种 action 职责更清晰。

#### 异步接口抽象出去，action 只处理本地 data，如何？

1. 会违反聚合原则吗？
2. 会破坏代码阅读性吗？
3. 会阻碍对代码的理解吗？


## 模块化的 state 更新机制

### 目标

1. 调用同一个 useCustomer 能够在各个组件共享状态
2. 要实现 state 共享，必须使用 context
3. 为了性能，必须在 context 的基础上实现定制化更新


### 实现方案

1. 多个 context
   1. 需要在父组件包裹多个上下文，实现起来复杂，不具备扩展性
2. hack hook 
3. 单个 context 进行分发




