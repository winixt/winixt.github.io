---
title: "react事件系统"
date: 2019-2-28
categories: react
tags: 
- 事件系统
---

## TL;DR

------
* react16.8.3
* react 事件系统分为`事件注册`和`事件分发`两个阶段。
* 事件注册阶段将**大部分**事件绑定到 document，在事件分发阶段调用 `dispatchEvent`进行事件捕获、事件冒泡分发。
* 事件分发阶段会先根据事件类型调用对应 EventPlugin 进行事件合成，捕获和冒泡阶段会执行的 listener 都会存储到 event._dispatchListeners

## 事件注册

![事件注册流程](https://ws1.sinaimg.cn/large/006tKfTcly1g0mfic97rnj315i0ck43w.jpg)

根据上图步骤我们逐步分析一下具体细节。

### 在 document 上绑定事件

document 上同一类型的事件只会绑定一次。举个🌰：
```js
function Control() {
    return (
        <>
            <button onClick={() => console.log('button1')}></button>
            <button onClick={() => console.log('button2')}></button>
        </>
    )
}
```
这里我们在两个 button 分别绑定了一次 `click` 事件, 但是在 document 上只会绑定一次。继续拿 `click` 事件举例，让我们一起来看下源码：
```js
// ... 以上省略大量其他事件的条件绑定。dependency 为 react 定义的事件名，与原事件存在一个映射
// 比如 topClick 对应的是 click 事件相关东西，后面事件合成再细说
// mountAt 即 document
trapBubbledEvent(dependency, mountAt);
// 将该标记为已绑定，后续不会重复绑定
isListening[dependency] = true;

// ReactDOMEventListener.js 里面的绑定冒泡事件函数
export function trapBubbledEvent(
  topLevelType: DOMTopLevelEventType,
  element: Document | Element,
) {
  if (!element) {
    return null;
  }
  const dispatch = isInteractiveTopLevelEventType(topLevelType)
    ? dispatchInteractiveEvent
    : dispatchEvent;

  addEventBubbleListener(
    element,
    getRawEventName(topLevelType), // 获取 native 事件名
    // Check if interactive and wrap in interactiveUpdates
    dispatch.bind(null, topLevelType),
  );
}

// EventListener.js 有两个函数进行事件捕获和事件冒泡的事件绑定
export function addEventBubbleListener(
  element: Document | Element,
  eventType: string,
  listener: Function,
): void {
  element.addEventListener(eventType, listener, false);
}

export function addEventCaptureListener(
  element: Document | Element,
  eventType: string,
  listener: Function,
): void {
  element.addEventListener(eventType, listener, true);
}
```

从上面的代码可以看出在 document 上绑定的其实都是`dispatch`事件。事件执行的时候就是通过这个函数进行事件分发。

### 在 target dom 上绑定 noop 函数

react 会在目标 dom 上也绑定一个事件，事件对应的监听函数为一个空函数：
```js
function noop() {}
```
这是为了将 target dom 上的 native event 冒泡到 document，在由 document 进行处理。

### 为什么不是所有事件都绑定到 document

```js
// react 中有这么段代码
export function listenTo(
  registrationName: string,
  mountAt: Document | Element,
) {
  const isListening = getListeningForDocument(mountAt);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (!(isListening.hasOwnProperty(dependency) && isListening[dependency])) {
      switch (dependency) {
        case TOP_SCROLL:
          trapCapturedEvent(TOP_SCROLL, mountAt);
          break;
        case TOP_FOCUS:
        case TOP_BLUR:
          trapCapturedEvent(TOP_FOCUS, mountAt);
          trapCapturedEvent(TOP_BLUR, mountAt);
          // We set the flag for a single dependency later in this function,
          // but this ensures we mark both as attached rather than just one.
          isListening[TOP_BLUR] = true;
          isListening[TOP_FOCUS] = true;
          break;
        case TOP_CANCEL:
        case TOP_CLOSE:
          if (isEventSupported(getRawEventName(dependency))) {
            trapCapturedEvent(dependency, mountAt);
          }
          break;
        case TOP_INVALID:
        case TOP_SUBMIT:
        case TOP_RESET:
           // 这里是重点！！！！
           // 这些事件会直接绑定到对应的 dom 结构上
          // We listen to them on the target DOM elements.
          // Some of them bubble so we don't want them to fire twice.
          break;
        default:
          // By default, listen on the top level to all non-media events.
          // Media events don't bubble so adding the listener wouldn't do anything.
          const isMediaEvent = mediaEventTypes.indexOf(dependency) !== -1;
          if (!isMediaEvent) {
            trapBubbledEvent(dependency, mountAt);
          }
          break;
      }
      isListening[dependency] = true;
    }
  }
}

```

## 事件分发

![事件分发](https://ws4.sinaimg.cn/large/006tKfTcly1g0mfl9x8znj316w0psn6b.jpg)

可能现在已经有很多同学发起疑问了，之前绑定到 component 的 listener 哪去了呢？什么时候被执行呢？
稳住，你将会看到了。

### 查找触发事件的 component

前面我们讲过，我们绑定的在 document 上的 listener 其实都是 dispatch 这个分发函数。具体实现如下：
```js
// ReactDOMEventListener.js
export function dispatchEvent(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
) {
  // .....
  // 获取触发事件的 target
  const nativeEventTarget = getEventTarget(nativeEvent);
  // 根据 target event 对象查找对应的虚拟 dom 节点，component
  let targetInst = getClosestInstanceFromNode(nativeEventTarget);
  //.... 
  
  // bookKeeping 的对象缓存
  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
  );

  try {
    // Event queue being processed in the same cycle allows
    // `preventDefault`.
    // 控制函数执行前后的一个状态恢复，
    batchedUpdates(handleTopLevel, bookKeeping);
  } finally {
    releaseTopLevelCallbackBookKeeping(bookKeeping);
  }
}
```

上面代码的重点是 `batchedUpdates` 函数

``` js

```



在事件分发的时候，即触发事件的时候，react 会根据 native event 找到对应的 react component。使用 react component 和对应的事件类型生成对应的合成事件。执行合成事件。将合成事件释放回事件池中。

其中生成合成事件过程中，会找到触发事件的 component 的父组件，存入一个数组中。根据 父组件 --> target 组件 --> 父组件的事件捕获和事件冒泡流程，将对应的事件监听 listener 和实例，放到 dispatchListener 和 dispatchInstance 中。在执行合成事件的过程中按顺序逐个事件进行执行。