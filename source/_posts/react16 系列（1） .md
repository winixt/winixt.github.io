---
title: "react16 系列（1）"
date: 2018-05-30
categories: react
tags: 
- react
- react16
---

### 前言

------

近来一直忙其他事，没怎么和 react 打过招呼了，转眼 react 已经跟新到了 16.2 版本，并且带来了很多重要的变更:

<!-- more -->

* render 可以返回字符串（String）和片段（fragments)
* Error Boundary 处理错误组件
* Portals 将组件渲染到当前组件树外
* 支持自定义 DOM 属性
* setState 传入 null 时不会出发更新
* 减少文件大小
* 优化服务器端渲染方式



### render 可以返回字符串（String）和片段（fragments)

------

现在的 render 方法可以返回字符串，非常简单：

```jsx
const String = () => {
  return "hello world";
}
```

![图片](https://ws2.sinaimg.cn/large/006tKfTcly1fnxip7ozvqj30ui0a8q5d.jpg)

render 返回片段，是个数组类型，html 元素需要带上 key，（官方说可能之后不用再写 key 了，哇赞成的举个手）👋：

```jsx
export const FragmentDemo1 = () => {
  return [
    "Some Text.",
    <h2 key="heading-1">A heading</h2>,
    "More text.",
    <h2 key="heading-2">Another heading</h2>,
    "Even more text."
  ];
}
```

react16.2 新出了一个语法糖 Fragment，官方定义如下：

> Fragments look like empty JSX tags. They let you group a list of children without adding extra nodes to the DOM：

```jsx
render() {
  return (
    <>
      <ChildA />
      <ChildB />
      <ChildC />
    </>
  );
}
```

也就是说相当于一个空的 jsx 标签，具体用法：

```jsx
export const FragmentDemo2 = () => {
  return (
    <Fragment>
      Some text.
      <h3>A heading </h3>
      More text.
      <h1>Another heading</h1>
      Even more text.
    </Fragment>
  );
}
```

![图片](https://ws1.sinaimg.cn/large/006tKfTcly1fnxiwggv1hj30zk0i8n1r.jpg)



### Error Boundary 处理错误组件

------

在 UI 中的一个 javascript 错误，不应该让整个应用崩溃，像皮球一样，搓个洞就炸了。

为解决这个问题，react16 提供了一新的概念 Error Boundary：

> 可以捕获它的子组件树的任何 javascript 错，log 错误信息，并用一个 component 取代奔溃的组件树。包括 rendering 时的错误，生命周期中的错误，以及子组件中的 constructor 中错误。如果  Error Boundary 处理失败，会上浮到离它最近的一个 Error Boundary 上，相似于 catch {}
>
> 注：是只能捕获子组件树，不能捕获它自身的错误。

怎么用呢？只需要在一个 class Component 加上 componentDidCatch，这个组件就变成 Error Boundary Component 了

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  componentDidCatch(error, info) {
    // Dispay fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting servics
    // logErrorToMyServics(error, info);
    console.log(error, info);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children;
  }
}
```

注：也只有 class Compoent 才能变成 Error Boundary Component

然后可以用于普通组件：

```jsx
<ErrorBoundary>
  <String />
</ErrorBoundary>
```

```jsx
const String = () => {
  throw new Error('哇哇哇，出错啦出错啦')
  return "hello world";
}
```

![图片](https://ws3.sinaimg.cn/large/006tKfTcly1fnxlwcb6jtj314a0d6n13.jpg)

现在我们了解了 Error Boundary 的作用及其用法，那么它可以用在哪里呢？

这主要取决于你需要做多细粒度的控制。可以用于包裹顶层 route component，当应用发生错误的时候现实 "出现了某种类型的错误" 给用户。或者专门控制一些小的子组件，防止子组件奔溃的时候影响整个应用。

注：如果没使用 Error Boundary，出现错误，react 会卸载整个组件树，详细原因看[传送门](https://reactjs.org/blog/2017/07/26/error-handling-in-react-16.html)



### Portals 将组件渲染到当前组件树外

------

使用 react 的时候，如果我想在父组件为 overflow: hidden 的情况下把子组件显示出来怎么办？例如 html5.2 新出的 dialog，或者hovercards、tooltips

Portals 就是为解决这种问题而开发出来，它可以将一个组件渲染到其他 DOM 节点去，而不在当前的父节点下，用法如下：

```jsx
render() {
  // React does *not* create a new div. It renders the children into `domNode`.
  // `domNode` is any valid DOM node, regardless of its location in the DOM.
  return ReactDOM.createPortal(
    this.props.children,
    domNode,
  );
}
```

注：虽然 Portal 组件渲染到其他 DOM 节点下了，但是 Portal 组件的其他方面的行为还是和正常的 react child 一样，Portal 组件上的事件还是传递到原来的父组件，这和 react 的事件系统设计有关，[传送门](https://reactjs.org/docs/portals.html)



### 支持自定义 DOM 属性

------

听说 react16 文件减小，是不是很开心😄？

但是这和我们的自定义 DOM 属性有什么关系呢？

因为 react 不用再搞一个属性白名单了，直接把无法识别的 html 和 svg 属性传递给 DOM：

```jsx
<div nirenshiwoma="不认识你这个属性耶">我带了新属性</div>
```

![图片](https://ws1.sinaimg.cn/large/006tKfTcly1fnxp1g0m4lj30la01cdg6.jpg)



### setState 传入 null 时不会出发更新

------

setState react 官方描述如下：

- Calling `setState` with null no longer triggers an update. This allows you to decide in an updater function if you want to re-render.
- Calling `setState` directly in render always causes an update. This was not previously the case. Regardless, you should not be calling setState from render.
- `setState` callbacks (second argument) now fire immediately after `componentDidMount` / `componentDidUpdate` instead of after all components have rendered.

这里点击 update 按钮不会触发 render:

![图片](https://ws3.sinaimg.cn/large/006tKfTcly1fnxphwax6mj31kw0s2469.jpg)



### 减少文件大小

------

什么？增加了这么多功能，文件还减小了？【成龙脸】

没错，你没听错，如 Facebook 工程师所说：我们对 react 进行了重写

赞，喜欢的就是这范👍

> `react`包的大小从20.7kb下降到5.3kb（gzip压缩后大小从6.9kb下降到2.2kb）。
>
> `react-dom`包的大小从141kb下降到103.7kb（gzip压缩后大小从42.9kb下降到103.7kb）。
>
> `react`+`react-dom`包总大小从161.7kb下降到109kb（gzip压缩后大小从49.8kb下降到34.8kb）



### 优化服务器端渲染方式

------

这个是大话题，请听下回【react16 系列（2）】分析😊