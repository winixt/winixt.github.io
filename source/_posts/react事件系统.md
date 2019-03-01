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
  
## 前置知识

```js
// 两变量数组合并
function accumulate<T>(
  current: ?(T | Array<T>),
  next: T | Array<T>,
): T | Array<T> {
  if (current == null) {
    return next;
  }

  // Both are not empty. Warning: Never call x.concat(y) when you are not
  // certain that x is an Array (x could be a string with concat method).
  if (Array.isArray(current)) {
    return current.concat(next);
  }

  if (Array.isArray(next)) {
    return [current].concat(next);
  }

  return [current, next];
}

// 将数组里面的每个元素作为 cb 的参数,执行 cb
function forEachAccumulated<T>(
  arr: ?(Array<T> | T),
  cb: (elem: T) => void,
  scope: ?any,
) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
}

```

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

![事件分发](https://ws4.sinaimg.cn/large/006tKfTcly1g0n46vst53j317m0hwjyo.jpg)

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
//   {
//     topLevelType,
//     nativeEvent,
//     targetInst,
//     ancestors: []
//   };
  const bookKeeping = getTopLevelCallbackBookKeeping(
    topLevelType,
    nativeEvent,
    targetInst,
  );

  try {
    // Event queue being processed in the same cycle allows
    // `preventDefault`.
    // 控制函数执行前后的一个状态恢复
    // 实质是用于执行 handleTopLevel
    batchedUpdates(handleTopLevel, bookKeeping);
  } finally {
    releaseTopLevelCallbackBookKeeping(bookKeeping);
  }
}

function handleTopLevel(bookKeeping) {
  let targetInst = bookKeeping.targetInst;

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  // 查找祖先 root 的 container，通常为 null
  let ancestor = targetInst;
  do {
    if (!ancestor) {
      bookKeeping.ancestors.push(ancestor);
      break;
    }
    const root = findRootContainerNode(ancestor);
    if (!root) {
      break;
    }
    bookKeeping.ancestors.push(ancestor);
    ancestor = getClosestInstanceFromNode(root);
  } while (ancestor);

  for (let i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i];
    runExtractedEventsInBatch(
      bookKeeping.topLevelType,
      targetInst,
      bookKeeping.nativeEvent,
      getEventTarget(bookKeeping.nativeEvent),
    );
  }
}
```

上面代码的 `runExtractedEventsInBatch` 函数，就是我们即将要分析生成合成事件的过程。

### 生成合成事件

``` js
// EventPluginHub.js
export function runExtractedEventsInBatch(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
) {
  // 生成合成事件，为数组类型，可能不止一个
  const events = extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  );
  // 运行合成事件，这个我们后面再分析
  runEventsInBatch(events);
}

function extractEvents(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
): Array<ReactSyntheticEvent> | ReactSyntheticEvent | null {
  let events = null;
  // EventPluginHub在初始化的时候，注入了七个plugin
  // 使用这些插件分别处理不同的事件
  for (let i = 0; i < plugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin: PluginModule<AnyNativeEvent> = plugins[i];
    if (possiblePlugin) {

      // 重点，每个 plugin 都必须有 extractEvents 方法
      // 用于从对应 plugin 的事件池中取出实例
      // 换句话说就是，通过 extractEvents 生成了单个合成事件
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
      );
      if (extractedEvents) {
        // 数组合并
        events = accumulateInto(events, extractedEvents);
      }
    }
  }
  return events;
}

```

从上述源码我们可以得知，合成事件是事件插件通过 extractEvents 生成的。我们用 SimpleEventPlugin 来举例说明 extractEvents 的工作原理。假设触发事件为 click 事件：

```js
// SimpleEventPlugin.js
 extractEvents: function(
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ): null | ReactSyntheticEvent {
    const dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    let EventConstructor;
    switch (topLevelType) {
      case DOMTopLevelEventTypes.TOP_KEY_PRESS:
       // ........ 省略一堆判断
      /* falls through */
      case DOMTopLevelEventTypes.TOP_AUX_CLICK:
      case DOMTopLevelEventTypes.TOP_DOUBLE_CLICK:
      case DOMTopLevelEventTypes.TOP_MOUSE_DOWN:
      case DOMTopLevelEventTypes.TOP_MOUSE_MOVE:
      case DOMTopLevelEventTypes.TOP_MOUSE_UP:
        EventConstructor = SyntheticMouseEvent;
      // .........
    }
    // 从上述代码可看出，我们取出 click 事件对应的构造函数
    // 然后通过静态方法，从事件池中取出一个事件
    const event = EventConstructor.getPooled(
      dispatchConfig,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    // 事件的初始操作
    // 用来绑定事件捕获和事件冒泡过程中涉及的监听函数
    accumulateTwoPhaseDispatches(event);
    return event;
  },

// EventPropagators.js
export function accumulateTwoPhaseDispatches(events) {
  // 将每个 events 事件在 accumulateTwoPhaseDispatchesSingle 上执行
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    // accumulateDirectionalDispatches 后面我们在解析
    traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
  }
}

// ReactTreeTraversal.js
// 查找目标节点父节点
// fn 为上面的 accumulateDirectionalDispatches
export function traverseTwoPhase(inst, fn, arg) {
  const path = [];
  while (inst) {
    path.push(inst);
    inst = getParent(inst);
  }
  let i;
  // 生成捕获流程
  for (i = path.length; i-- > 0; ) {
    fn(path[i], 'captured', arg);
  }
  // 生成冒泡流程
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg);
  }
}

// EventPropagators.js
// 到这里我们终于看到 _dispatchListeners 了
// _dispatchListener 按捕获和冒泡的顺序存储了对应的 listener
function accumulateDirectionalDispatches(inst, phase, event) {
  // 查找 component 上面的 listener
  const listener = listenerAtPhase(inst, event, phase);
  if (listener) {
    event._dispatchListeners = accumulateInto(
      event._dispatchListeners,
      listener,
    );
    // 存储实例
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
  }
}
// 获取 dom 的listener
function listenerAtPhase(inst, event, propagationPhase: PropagationPhases) {
  const registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(inst, registrationName);
}

// EventPluginHub.js
export function getListener(inst: Fiber, registrationName: string) {
  let listener;

  // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
  // live here; needs to be moved to a better place soon
  const stateNode = inst.stateNode;
  if (!stateNode) {
    // Work in progress (ex: onload events in incremental mode).
    return null;
  }
  // 查找对应 component 的props
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (!props) {
    // Work in progress.
    return null;
  }
  // 从 props 中取出 listener
  // 至此，我们已经初始化完了合成事件
  listener = props[registrationName];
  if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
    return null;
  }
  return listener;
}

```

### 执行合成事件

接着我们上文 `runEventsInBatch` 函数，执行合成事件
```js
// EventPluginHub.js
export function runEventsInBatch(
  events: Array<ReactSyntheticEvent> | ReactSyntheticEvent | null,
) {
  // 和当前事件队列合并
  if (events !== null) {
    eventQueue = accumulateInto(eventQueue, events);
  }

  // Set `eventQueue` to null before processing it so that we can tell if more
  // events get enqueued while processing.
  const processingEventQueue = eventQueue;
  eventQueue = null;

  if (!processingEventQueue) {
    return;
  }
  
  // 执行事件队列中的事件
  forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);
  // This would be a good time to rethrow if any of the event handlers threw.
  rethrowCaughtError();
}

// 忍住，快摸到瓜了
const executeDispatchesAndReleaseTopLevel = function(e) {
  return executeDispatchesAndRelease(e);
};

const executeDispatchesAndRelease = function(event: ReactSyntheticEvent) {
  if (event) {
    // 按顺序执行事件
    executeDispatchesInOrder(event);
    // 执行完后释放事件实例，放回事件对象池
    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

// EventPluginUtils.js
// 最后一步了
export function executeDispatchesInOrder(event) {
  // 取出之前我们存入 dispatchListeners 的listener 执行
  const dispatchListeners = event._dispatchListeners;
  const dispatchInstances = event._dispatchInstances;
  if (__DEV__) {
    validateEventDispatches(event);
  }
  if (Array.isArray(dispatchListeners)) {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break;
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
    }
  } else if (dispatchListeners) {
    executeDispatch(event, dispatchListeners, dispatchInstances);
  }
  event._dispatchListeners = null;
  event._dispatchInstances = null;
}

function executeDispatch(event, listener, inst) {
  const type = event.type || 'unknown-event';
  event.currentTarget = getNodeFromInstance(inst);
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
  event.currentTarget = null;
}
// invokeGuardedCallbackImpl.js
// 最终通过这个函数执行我们的 listener
// func 即我们的 listener
let invokeGuardedCallbackImpl = function<A, B, C, D, E, F, Context>(
  name: string | null,
  func: (a: A, b: B, c: C, d: D, e: E, f: F) => mixed,
  context: Context,
  a: A,
  b: B,
  c: C,
  d: D,
  e: E,
  f: F,
) {
  const funcArgs = Array.prototype.slice.call(arguments, 3);
  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
};
```

完毕！

### 感谢阅读