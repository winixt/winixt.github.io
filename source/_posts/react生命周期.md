---
title: "react生命周期"
date: 
categories: react
tags: 
- react
---

生命周期方法管理是 react 核心功能之一，作为一名 react 开发者没有清晰认知岂不是有点说不过去了哈哈，我们通过网上某位大佬的图片说明一下

<!-- more -->

![图片](https://ws1.sinaimg.cn/large/006tNc79gy1fo4pu0d81yj30kk0p0dhq.jpg)

如上图所示，react 组件生命周期分为三个阶段：

* 创建期
* 存活期
* 销毁期

下面我们逐个分析一下

 

### 创建期

------

即 ES6 class 的初始化过程，初始化并渲染整个组件。下面逐步分析下创建期涉及的生命周期方法。

#### getDefaultProps

用于设置默认的 props 值，如果父组件有直接传值过来或者传入 undefined，会将其覆盖。

组件创建时期调用一次，因为这个方法在实例化之前调用，所以在这个方法里面还不能依赖 this。不过这是 es5 写法，太过时了，我们直接来看看 es6:

```javascript
static defaultProps = {
  txt: 'hello world',
}
```

#### getInitialState

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

#### componentWillMount

用于在组件装载前调用一次，在这个方法里面调用 this.setState 不会导致重渲。

componentWillMount 方法是服务端渲染唯一调用的生命周期钩子，所以有做同构的页面要注意不要在这个方法里面使用有关浏览器的方法，比如 window，document 等。也不要在这个方法发起 http 请求。

#### render

没什么好说的，渲染对象。

#### componentDidMount

在组件挂载后立即执行，此时可以操作 DOM，ajax 请求也主要在这个钩子函数发起。使用 setState 会导致重渲。



### 生存期

------

进入存活期后，可能服务端数据下载下来了，发生组件更新；或者在页面交互过程中更更新组件，涉及的生命周期方法如下：

#### componentWillReceiveProps

若父组件传递的 props “发生变化”，会调用此函数。主要用于更新 this.state。

“发生变化”之所以加上双引号是因为无论父组件传递的 props 是否发生改变，只要父组件进行了 render，就会出发子组件的 componentWillReceiveProps。

#### shouldComponetUpdate

当收到新的 props 或 state 时，会调用此函数，用于告诉 react 是否需要重新 render。因此可以基于此进行一些 react 性能优化。默认都返回 true。

* 初始化渲染
* 使用 forceUpdate 

以上两种情况都不会调用 shouldComponentUpdate。

#### componentWillUpdate

在 shouldComponentUpdate 之后，render 之前会调用次函数。此时的 state 已经是更新后的 state。不能在此函数上调用 this.setState 容易造成死循环。

#### render

组件渲染

#### componentDidUpate

在组件更新后马上调用，可以进行一些 DDM 操作。

注意，也不能在此方法上使用 this.setState，避免造成死循环。



### 销毁期

------

#### componentWillUnmount

在组件销毁前调用，主要用来做一些清理工作。例如：

* 取消定时器
* 解绑 DOM 事件



### react16 新增

------

#### componentDidCatch

在子组件发生未捕获错误时触发。作用：

* 向服务器发送错误报告
* 返回新组件代替错误组件