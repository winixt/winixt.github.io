---
title: "重新认识requestAnimationFrame"
date: 2019-03-15
categories: 动画
tags: 
- 动画
---

引用[MDN requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)的一句话。

> window.requestAnimationFrame() 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。回调函数执行次数通常是是每秒60次，与浏览器刷新屏幕次数相匹配。为了提高性能和电池寿命，因此在大多是浏览器里，当 requestAnimationFrame() 运行在后台标签页或者隐藏的iframe里时，requestAnimationFrame 会被暂停。

总的来说，requestAnimationFrame 就是为了解决动画问题而生的。那么使用 requestAnimationFrame 会带来那些好处呢？

<!-- more -->

我们先来阐述一下**动画**这个词的含义，引入维基百科的话语:
> 动画是指由许多帧静止的画面，以一定的速度（如每秒16张）连续播放时，肉眼因视觉残像产生错觉，而误以为画面活动的作品。

浏览器绘制画面的频率（每秒绘制帧的速度）是有限制的，现在大部分浏览器的实现为每秒60-70帧。

那么要实现我们的动画该怎么办呢？只需要告诉浏览器在绘制每一帧的时候更新我们的动画，就可以实现流畅的动画了。而 requestAnimationFrame 就是做这么个事情的。

有人就要提问了，setTimeout 和 setInterval 也可以实现动画呀？用这两个 API 会有什么问题呢？

没问题都可以实现动画。只是有如下暇疵：
1. setTimeout 和 setInterval 不官方，它不知道绘制动画的最佳时机。如同浏览器都支持了 promise，你还要使用 polyfill，这不是缺心眼吗？
2. setTimeout 和 setInterval 也不能保证能按时绘制，一是浏览器有绘制频率，二是线程阻塞导致。
3. 前面也提到过 requestAnimationFrame 在后台标签页会停止，能提高性能和电池寿命，而 setTimout 和 setInterval 不会停。

**⚠️注意，这里不是说 requestAnimationFrame 能解决动画性能问题，requestAnimationFrame 是运行在主线程（js线程）里，当主线程太忙还是会出现掉帧，导致卡顿的现象。因为主线程和 UI线程是互斥的，当运行js线程时，会将UI线程挂起。所以如果js线程占用时间太长，UI线程得不到执行，就会出现掉帧卡顿现象。和用 requestAnimationFrame、setTimeout、setInterval 没关系**

说到这里，在扯远一点，React Fiber 的出现其实也是为了解决 js 线程执行时间太长，导致页面卡顿的问题的。React Fiber 渲染任务拆分成一个个 fiber 单元，在浏览器帧与帧绘制的空隙取出任务，并执行。进而不会阻塞用户与页面的交互。

注意：这里说的是任务拆分，不是任务优化，所以整个任务的运行时间还是不会变，甚至会更长，因为多了任务间切换执行的成本。只不过是为了不阻塞浏览器高优任务，把任务执行周期拉长了。所以当我们把代码写的太烂的时候还是会卡的。。。
