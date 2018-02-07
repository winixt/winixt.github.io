---
title: "深入理解z-index"
date: 
categories: css
tags: 
- z-index
- css
---

z-index 简单呀，想显示在上面给个大点的整数不久行了吗❓❓❓

我们想的还是简单了点，这就好像写了一段能跑的代码，但是不知道它是怎么跑起来的，这就是新手和大佬的差距。要学的还很多，且勿骄勿躁，与君共勉！

<!-- more -->

![图片](https://ws4.sinaimg.cn/large/006tNc79gy1fo4i47weplj30jg0dcq3i.jpg)

z-index 简单来说就是能够控制层叠上下文中元素在 **z 轴**前后位置，所以我们应该先理解什么是层叠上下文才能更好理解 z-index 工作原理，以及使用 z-index 的正确姿势。

嗯，好！带着这个问题往下看：什么是层叠上下文？

此处你可能会忍不住一声长叹，又是一个新概念呀～

为什么要定义概念呢？因为使用同一概念易于知识的交流与传播。

但有一个缺陷：当不理解这个概念的时候，解析起来的复杂的，解析的不好时候，他人理解起来更是困难，甚至误解。得看解析的人的水准，所以若下文有缺陷还是很希望有大佬来斧正的！



### 层叠上下文

------

html 文档有一个三维的概念，如上图所示的  **z 轴**。假设整个 html 文档没有新建的层叠上下文，那么就只有一个根层叠上下文，可以想象成上图 **x 轴**和 **y 轴**交叉形成的紫色平面。如果有新创建层叠上下文，那么会根据层叠上下文的顺序，形成层叠空间，如上图 Stack element1 和 Stack element2。

那么层叠上下文之间又有什么关系呢？上文提及的层叠上下文的顺序又是怎么样的一个顺序呢？

#### 层叠上下文之间的关系

* 层叠上下文比根层叠上下文（普通元素）优先级高。
* 层叠上下文可以嵌套，在层叠上下文中可以新建层叠上下文。
* 层叠上下文兄弟之间彼此独立，当涉及兄弟层叠上下文比较时，比较父元素之间的优先级，子元素继承父元素的优先级；若父元素优先级相同，则遵循后来据上的原则。
* 层叠上下文自成体系，可以理解成层叠上下文中的元素的层叠关系只遵循层叠上下文的顺序规则，不受其他层叠上下文极其其他因素的影响。

这里图解一下第三点

![图片](https://ws4.sinaimg.cn/large/006tNc79gy1fo8agngxtgj30s20joabf.jpg)

#### 层叠上下文的层叠顺序

![图片](https://ws2.sinaimg.cn/large/006tNc79gy1fo87lmrujfj30go0a0t8l.jpg)

图片右上角 Stacking Order 即是层叠顺序的意思，总共 7 层，（呃，小学生也数的出来）至于各个层级之间那几个英文单词应该不成问题吧～应该～应…

除了第 1 层 (background/Borders) 和第 5 层 (Inline Boxes)，其他层级相信也挺好理解的，我们重点分析第 1、5层：

* Background/Borders：背景边框在最底层，意指位处层叠上下文最底层的元素的背景和边，不管你设置子元素的 z-index 的值为负多少，始终在这个层叠上下文中。
* Inline Boxes：行内元素他兄弟 Inline-block 其实吧也是属于这一层的。

当元素处于相同的层级时，比如 z-index 都是 1 ，那么遵循**后来居上**的原则。

### 层叠上下文的创建

------

层叠上下文的创建分为三种类型，原本就存在的根层叠上下文、定位元素创建的层叠上下文、css3新属性创建的层叠上下文。下面我们来分析一下：

#### 根层叠上下文

也就是原始 html 的文档，也称为普通元素。层叠上下文的创建总得有个参照物吧？就像绝对定位类似，没有给它做参照的，就以浏览器窗口作为参照定位一个道理。

#### 定位元素与层叠上下文

* 当 position 的值为 relative/absolute 时，只要 z-index 不是默认值 auto 创建上下文。
* 当 postion 的值为 fixed 时，默认创建上下文。

注意：这里浏览器实现实现有差异，这里只考虑 chrome，其他浏览器请自行做测试。

请看下面的🌰：

![图片](https://ws1.sinaimg.cn/large/006tNc79gy1fo8b8obnbjj31800nqwro.jpg)

可以看到动漫图片跑到 box 后面去了，如果我们把 box 的 z-index 改为 0:

![图片](https://ws4.sinaimg.cn/large/006tNc79gy1fo8bbpn8glj31am0ne7t0.jpg)

动漫图片就跑上来了。在来试试 position: fixed:

![图片](https://ws3.sinaimg.cn/large/006tNc79gy1fo8bdji117j319c0moay9.jpg)

可以看到即使 z-index 为 auto 一样可以形成层叠上下文，使 z-index 为负值的 img 不会跑到 box 后面去。

### css3新属性与层叠式上下文

css3 出现的一些新属性对过去很多规则发生了挑战。而对层叠上下文又影响的包括以下属性：

1. z-index 值不为 auto 的 flex 项（父元素为 display: flex | inline-flex);
2. 元素的 opacity 值不是 1；
3. 元素的 transform 值不是 none;
4. 元素的 mix-blend-mode 值不是 normal;
5. 元素的 filter 值不是 none;
6. 元素的 isolation 是 isolate;
7. will-change 指定的属性值为上面任意一个；
8. 元素 -webkit-overflow-scrolling 设为 touch。

##### display: flex|inline-flex 与层叠上下文

![图片](https://ws2.sinaimg.cn/large/006tNc79gy1fo8c4p7daqj318s0nw7hq.jpg)

可以看到 z-index: 0 不起作用，图片跑下面去了

![图片](https://ws2.sinaimg.cn/large/006tNc79gy1fo8c63gpstj316m0notwy.jpg)

没有定位元素，box 的 z-index:0 起作用，图片不能跑到 box 下面。

##### opacity 与层叠上下文

![图片](https://ws2.sinaimg.cn/large/006tNc79gy1fo8c9bz5fvj316u0mwkeu.jpg)

可以看到 opacity 使 z-index 起作用，形成了层叠上下文，图片不能跑到 box 下面。

剩下的几个属性，作为练手，请读者亲自试试，这里就不赘述了～