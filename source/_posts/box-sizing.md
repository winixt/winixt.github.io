---
title: "box-sizing"
date: 
categories: css
tags: 
- box-sizing
- css
---

想必大多数人都用过 box-sizing 属性吧？那么这个属性的值对应的 css 盒子模型宽高计算方式有什么区别呢？

<!-- more -->

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1focoji9wr3j30jg0b4dg8.jpg)



### css 盒子模型

------

首先我们来看看 css 盒子模型宽度和高度的计算：

宽度 = border(left&&right) + padding(left&&right) + contentWidth(或者手动设置的元素宽度)

高度 = border(top&&bottom) + padding(top&&bottom) + contentHeight(或者手动设置的元素高度)

这看起来可能会有些抽象，我们通过图片来简单讲解一下：

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1focqh7xvvhj30to0g6aal.jpg)

如图所示，盒子的宽度 = 40(px) * 2 + 2(px) * 2 + 236(px) = 320px; 盒子高度计算方式类似。



### box-sizing

------

用于改变 css 盒子模型计算宽高的方式，有两个值，一个 content-box(默认值)，另一个 border-box。下面我们来分析一下这两个值。

#### content-box

content-box 是默认值。它是如何计算元素的宽高的呢？如下图所示首先我们设置 box 的宽高为 100px，边宽 2px，内边距（padding) 10px：

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1focs9nwrtsj31100kaq5y.jpg)

然后 WTF，box 宽度变为 124 px 了? 明明我是想设置宽度为 100px 的呀？这种情况是不是有点似曾相识的感觉【滑稽】
注意: content-box 为默认值所以不用写 box-sizing: content-box; 也行，浏览器会自动加上。

其实当 box-sizing 为 content-box 的时候，如果你设置元素宽度（width）或高度（height），实际上设置的是 content 的宽高（标题图的content）并不是盒子的宽高。也就是说实际宽度为：

宽度 = border + padding + width(你手动设置的宽度)

#### border-box

如果我们给 box 设置 box-sizing: border-box 会发生什么呢？如下图：

![图片](https://ws3.sinaimg.cn/large/006tKfTcgy1focsihytiwj310u0ku41q.jpg)

我们可以看到 box 的宽高变回 100px * 100px 了，好神奇呀，这就是我们想要的答案。

如果我们给元素设置 box-sizing: border-box; 那么该元素的宽高计算方式为（以宽举例）：

宽度 = width(你手动设置的宽度)

width(你手动设置的宽度) =  border + padding + content;



既然设置为 border-box 是我们更期望的渲染行为，那么我们是否应该设置全部元素为 border-box 呢？

```
* {
    box-sizing: border-box;
}
```

答案是否，因为大部分元素你不需要手动设置宽高，在需要手动设置宽高的元素上再使用是一种更好的选择。当然你要这么使用也没什么问题～







