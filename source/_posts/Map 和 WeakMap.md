---
title: "js Map 和 WeakMap"
date: 2019-03-20
categories: js
tags: 
- Map
- WeakMap
---

## TL;DR

------
* 相比字面量对象，Map 的 key 可以是任意类型
* 相比子面量对象，Map 可直接通过进行遍历，遍历的顺序为`key``value`插入的顺序
* Map 可以方便的对子元素进行增删改查，内部存储其实为数组类型，基本操作的时间复杂度为 n
* WeakMap 键必须是对象，为对象的弱引用，在某些场景下可方便的避免内存泄漏

<!-- more -->

## Map

在 javascript 里，Map 结果是通过两个数组实现的，一个存放 key，一个存放 value，这就解析为什么 Map 结构是可遍历的，遍历的顺序也是可以保证的（即为键值对插入的顺序），也可以使用任意类型作为 key。但是这样会导致一个问题，就是 Map 结构的增删改查的时间复杂度都是O(n)，另外一个问题就是可能会导致内存泄漏。稍后我们分析 WeakMap 时会进行详细分析。

那么我们什么时候使用 Map，什么时候使用对象字面量呢？
> 1. 如果需要将原始值存储为键，则使用 Map。Object 会将键转换为字符串。
> 2. 需要对对象属性进行增删时使用 Map。Object 进行元素的删除时会带来相对大的性能损失。
> 3. 如果 key 在程序运行时才能知道(可能不是 String)，使用 Map，使用 Object 可能会导致一些意想不到的问题。

## WeakMap

前面我们提到过，WeakMap 的键只能是对象，并且只是对象的弱引用。怎么理解呢？

借用阮一峰老师的话:
> WeakMap 中键都是弱引用，即垃圾回收机制不会考虑 WeakMap 对改对象的引用，也就是说，如果其他对象都不在引用该对象，那么垃圾回收机制就会自动回收改对象占用的内存。不考虑改对象是否还存储在 WeakMap 中。

因为 Map 结构的数组会一直引用着每个 key 和 value。这种引用使得垃圾回收算法不能回收处理它们，即是这些对象没有其他地方在引用。

也正是由于这样的弱引用，WeakMap 是不可枚举的。如果 key 是可以枚举的，其列表将会受到垃圾回收机制的影响（因为我们不知道垃圾回收机制什么时候对没有引用的对象进行回收），从而得到不确定性结果。

## 参考
1. [阮一峰es6-WeakMap](http://es6.ruanyifeng.com/#docs/set-map#WeakSet)
2. [WeakMap的学习和使用](https://zhuanlan.zhihu.com/p/25454328)
3. [MDN WeakMap](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
4. [MDN Map](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map)

