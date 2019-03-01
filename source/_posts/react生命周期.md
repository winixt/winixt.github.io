---
title: "react生命周期"
date: 2019-03-01
categories: react
tags: 
- 生命周期
---

react在 ^16.4 版本进行生命周期的变更，废除了 `componentWillMount`,`componentWillReceiveProps`,`componentWillUpdate`，新引入了两个生命周期函数 `getDerivedStateFromProps`,`getSnapshotBeforeUpdate`。

<!-- more -->

![](https://ws2.sinaimg.cn/large/006tKfTcly1g0n8wrg0v1j30uk0hldi8.jpg)


如上图所示，react 组件生命周期分为三个阶段：

* 创建时
* 更新时
* 卸载时

下面我们逐个分析一下

 

## 创建时

------

创建期 react 将会按照下面顺序调用生命周期函数

* constructor
* static getDerivedStateFromProps
* render
* componentDidMount

## 更新时

更新时，react 将按照下面的顺序调用生命周期

* getDerivedStateFromProps
* shouldComponentUpdate
* render
* getSnapshotBeforeUpdate
* componentDidUpdate
  
## 卸载时

卸载时，调用 componentWillUnmount

## 为什么要调整生命周期？

### UNSAFE_componentWillMount

刚开始接触 react 的时候，可能很多同学为了尽早的发出请求，将后端数据请求放在 componentWillMount，但实际上 componentWillMount 执行后，render 就开始了。所以首次渲染总会是没有异步数据的。需要尽早拉取数据，官方鼓励放在 constructor 中。其次，如果将 api 请求和事件监听等放在 componentWillMount，那么在服务端渲染的时候就会出现问题，组件在请求完成之前渲染，所以即使我们在服务端完成渲染也只是完成了部分。所以应该把请求移至 componentDidMount。事件监听也一样，在componentWillMount 订阅的事件，因为服务端不会调用 componentWillUnmount 而不能取消订阅。

另外，在未来异步渲染机制中，单个组件的实例也可能多次调用该方法。

### UNSAFE_componentWillReceiveProps

编写 react 应用的时候，可能有遇到需要监听 props 更改 state，或者当 props 变更的时候调用一些方法。这会破坏 state 单一数据源的规则，导致组件状态变更不可预测。官方出一篇博客进行解析[你很可能不需要派生 state](https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html)。为了应对一些特殊需求，官方引入一个新的生命周期方法 static getDerivedStateFromProps 去监听 props 进而更新当前组件。并且建议将 props 变更而必须调用的方法放到 componentDidUpdate 而不是将方法调用和 state 更新都混在 componentWillReceiveProps 方法中，避免了外部组件频繁更新 props 带来的在单次 render 内多次调用 componentWillReceiveProps 的问题。

### UNSAFE_componentWillUpdate

componentWillUpdate 在异步渲染机制下变的不可靠，它是在 render 之前调用的。比如要获取用户当前的 scroll 位置，在实现异步渲染时，渲染过程中会出现渲染阶段（render）和提交阶段（getSnapshotBeforeUpdate，componentDidUpdate）。如果在 componentWillUpdate 获取用户当前 scroll 位置，那么当渲染阶段和提交阶段这段时间差内,用户滚动了屏幕,改变了 scroll 的位置，那么 componentWillUpdate 获得的数据已经过期了。而 getSnapshotBeforeUdpate 会在 dom 更新之前立刻被调用。

## 常用生命周期方法

### render

render 会在`this.props`和`this.state`更改的时候调用。可以返回如下类型
* React Element
* Arrays 和 fragments
* Portals
* String and Bumber：渲染文本
* boolean or null: 什么都不渲染

render 必须是个纯函数，也就是在状态不变的情况，每次调用返回的结果相同。

> 需要注意的是，当 shouldCompoentUpdate 返回 false 的时候，render 不会调用

### constructor

通常，使用 constructor 只因为下面两个目的：
* 初始化本地 state
* 绑定 event 

不应该在 constructor 执行有副作用的函数，这些函数应该放在 componentDidMount 里面。另外也不应该在 construtor 中用 props 初始化 state。

### componentDidMount 

这是个拉取异步数据的好地方，也可以在这个方法订阅事件，但是要记得在 componentWillUnmount 中取消订阅，避免内存泄漏。

### componentDidUpdate

这里可以检测 DOM 的更新和 prop 的更新，执行一些网络请求，或者更改 DOM。

### componentWillUnmount

做一些清理工作

## 不常用的一些生命周期方法

### shouldComponentUpdate

使用这个方法，让 react 知道一个组件是否应该被更新。通常在性能优化的时候使用。

### static getDerivedStateFromProps

监听 props 的变更，进而更新当前组件的 state。使用前应该确保你确实需要它，上文有说明原因。

### getSnapshotBeforeUpdate

在 render 之后，提交 DOM 变更之前执行，获取当前执行环境快照。

## 错误捕获钩子函数

一个错误捕获组件可以捕获它的子组件的错误，将错误上传到服务器，并且使用新的 UI 替换当前 UI。一个 class component 只要拥有 static getDerivedSateFromError() or componentDidCatch() 它就会变成一个错误捕获组件。

> **注意**
> 应该仅仅用在预料之外的情况，而不是在可控的错误状态下。
> 并且这个组件不会捕获它们自身的错误。

### static getDerivedStateFromError

这个生命周期函数在子组件抛出错误的时候执行。接受一个 error 参数，应该返回一个对象，更新 state
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return {hasError: true}
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong</h1>;
    }

    return this.props.children;
  }
}
```
> **注意**
> getDerivedStateFromError 发生在渲染阶段，不应该执行带有副作用的函数。对于这种情况，应该使用 componentDidCatch 取代。

### componentDidCatch

在子组件抛出错误时触发，接受两个参数：
* error - 抛出的错误
* info - 一个对象，包含 componentStack，表明是哪个 component 抛出的错误。

componentDidCatch 在提交阶段触发。所以 log 函数，数据上报请求，应该在这里发出。

## getDefaultProps

用于设置默认的 props 值，如果父组件有直接传值过来或者传入 undefined，会将其覆盖。

组件创建时期调用一次，因为这个方法在实例化之前调用，所以在这个方法里面还不能依赖 this。不过这是 es5 写法，太过时了，我们直接来看看 es6:

```javascript
static defaultProps = {
  txt: 'hello world',
}
```

## getInitialState

用于初始化 this.state 的值。

在组件创建的时候调用一次，这个也是 es5 写法，就不多做介绍了，直接上 es6:

```javascript
class TestState extends React.Component {
  constructor(props) {
    super(props);
    this.state = {active: false};
  }
}
```