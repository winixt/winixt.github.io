---
title: "实现一个share state hook"
date: 2019-03-09
categories: react
tags: 
- hooks
---

## 现状
-----

react hooks 目前主要作用在于通过 useState 等函数实现**状态逻辑**共享，而不是状态共享。state 共享依旧需要 redux 等库去实现。redux 对于大型应用确实是一个不错的选择。但是写 action、reducers 难受呀？同意的请往下看，不同意的请摁 ⌘ + w。


<!-- more -->

### 重新思考 action | reducers

那么花费那么大功夫写 action、reducers 的目的是什么呢？它能带来那些好处呢？我认为有如下几点。
1. 复用数据更改逻辑
2. 使数据透明化，便于追踪 bug，以及后期维护
3. 方便做独立测试
4. 可以扩展去表达复杂的更新逻辑

看起来很不错，那如果要达到这些目的，是不是没有其他更优雅的方案了呢？

## 一种更优雅的实现 state 共享的方式
----

受到 react hooks、rematch 和 [reactN](https://github.com/CharlesStover/reactn#readme) 的启发。我实现一种 hooks 函数，该函数可以实现 state 的共享。

### 创建一个同步 state hook

可以通过传入一个包含 `state` `reducers` `effects`(可选) 三个属性的对象，生成一个可以在多个组件间共享 `state` 的 hook。[Github](https://github.com/winixt/restate)

```javascript
// useCount.js
import createShareStateHook from './createShareStateHook';
const count = {
    // 需要在多个组件间贡献的 state
    state: {
        count: 0,
        name: '罗宾'
    },
    // reducers 同步数据变更
    reducers: {
        increment: (state, payload) => Object.assign({}, state, {count: state.count + payload}),
        decrement: (state, payload) => Object.assign({}, state, {count: state.count - payload}),
        changeName: (state, payload) => Object.assign({}, state, {name: payload}),
    },
    // 异步数据变更
    effects: {
        getDataAsync() {
             fetch('/get').then((res) => {
                 return res.json();
             }).then((data) => {
                 this.changeName(data.name);
             }).catch(err => {
                 reject(err);
             })
        }
    }
};

// 创建同步 state 的 hooks
export default createShareStateHook(count)
```

### 使用同步 state hook

直接调用上一步生成 hook 的函数。
```jsx
import useCounter from './useCounter';

const Controls = () => {
  const [data, dispatch, effects] = useCounter();
  return (
    <>
      <div>当前 count: {data.count} </div>
      <button onClick={() => dispatch.increment(1)}>加一</button>
      <button onClick={() => dispatch.decrement(1)}>减一</button>
      <button onClick={() => effects.getDataAsync()}>获取异步数据</button>
    </>
  );
}

const Message = () => {
  const [data] = useCounter();
  const {count, name} = data;
  return (
    <div>
      <div>count: {count}</div>
      <div>name: {name}</div>
    </div>
  )
}
```