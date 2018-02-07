---
title: "react key"
date: 
categories: react
tags: 
- react
- key
---

react 核心开发人员说之后可能不再需要 key，趁它还在赶紧去了解一泼，逃～～～

<!-- more -->
![图片](https://ws2.sinaimg.cn/large/006tKfTcgy1fo5t530snoj30u40eqtp7.jpg)

本文思路：

* 为什么要使用 key
* 使用 key 的正确方式

### 为什么要使用 key？

------

简单来说，这和 react 的 diff 算法有关，用于提高 react 处理列表的性能。

为什么使用了 key 就可以提高处理列表的性能呢？

例如，我们需要在当前列表末尾插入一个新的元素：

```html
<!-- 原始列表 -->
<ul>
  <li>冬笑非</li>
  <li>南宫燕</li>
</ul>

<!-- 更新后列表 -->
<ul>
  <li>冬笑非</li>
  <li>南宫燕</li>
  <li>雪鸢心</li>
</ul>
```

在新旧 dom 树 diff 过程中，发现前两个列表子节点（ &lt;li&gt;冬笑非&lt;/li&gt; 和  &lt;li&gt;南宫燕&lt;/li&gt; ）相同，如是直接插入 &lt;li&gt;雪鸢心&lt;/li&gt; 这个节点完事

但是（重点都在"但是"后），如果我在列表前面插入一个元素会发生什么呢？

```html
<!-- 原始列表 -->
<ul>
  <li>冬笑非</li>
  <li>南宫燕</li>
</ul>

<!-- 更新后列表 -->
<ul>
  <li>雪鸢心</li>
  <li>冬笑非</li>
  <li>南宫燕</li>
</ul>
```

react 将会改变每一个节点，而不是保留  &lt;li&gt;冬笑非&lt;/li&gt; 和  &lt;li&gt;南宫燕&lt;/li&gt; 这两个节点。这种处理方式会导致一定的性能问题。（你可能会觉得一个 li 能造成什么性能影响呢？想想在实际情况下，这可能是一个商品列表页，然后你会懂的）

为了解决上述问题，react 提供了一个称为 key 的属性。

```html
<!-- 原始列表 -->
<ul>
  <li key="doxiu">冬笑非</li>
  <li key="niye">南宫燕</li>
</ul>

<!-- 更新后列表 -->
<ul>
  <li key="xueyx">雪鸢心</li>
  <li key="doxiu">冬笑非</li>
  <li key="niye">南宫燕</li>
</ul>
```

这样 react 会发现 key 为 doxiu、niye 的节点并没有改变，只需移动一下位置，再新增一个 key="xueyx" 的节点。

react 使用 key 识别列表子节点，进而对节点进行增删改操作。如果 key 变更，react 会认为是一个新节点。

### 使用 key 的正确方式

------

既然 key 用于标识列表中的一个节点，自然 key 应该在当前列表唯一（不需要全局唯一），并且保持稳定。

如果同一个列表子节点的 key 不断的变更，react 会认为它总是一个新节点。

所以使用 key 的时候：

* 如果数据本身带有 id 尽量使用 id 作为 key 
* 如果数据本身不带 id ，并且需要经常更新列表，需要为每个子节点构造一个唯一 key，使用 hash 方法等
* 如果数据本身不带 id，并且数据不怎么更新，使用数据 index 也没什么问题



这种方式相当于人工优化算法，有点变扭～～

不过前文也说了，之后可能不用再写 key 了【期待脸】

