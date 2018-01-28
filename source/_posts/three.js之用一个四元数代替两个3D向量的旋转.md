---
title: "用一个四元数代替两个3D向量的旋转"
date: 
categories: webgl
tags: 
- webgl
- 3D
---

翻译自：http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors

一个旋转最好的表示方法就是使用一个旋转轴和一个旋转角。旋转轴可以通过两个向量的叉乘得出。

<!-- more -->

![img](https://ws4.sinaimg.cn/large/006tKfTcly1fnwuc596l5j308c05eglk.jpg)

旋转角（最小）可以通过两个向量的点积获得。点积获取的刚好是最小的旋转角。如下两种方法：

![img](https://ws3.sinaimg.cn/large/006tKfTcly1fnwucwyvstj30ab0173y9.jpg)

 

有了角度和旋转轴我们便可以用代码生成四元数

![img](https://ws3.sinaimg.cn/large/006tKfTcly1fnwudpf3moj30fp05174d.jpg)

 

接下来让我们看看通过旋转轴和旋转角构造四元数的公式：

![img](https://ws1.sinaimg.cn/large/006tKfTcly1fnwudz0wagj308s00x3y9.jpg)

看代码：

 

![img](https://ws3.sinaimg.cn/large/006tKfTcly1fnwue906smj30dt04ujrh.jpg)

 

**减少三角函数的使用：**

通过下面三角函数的公式，减少代码中三角函数的使用，简化代码，

![img](https://ws1.sinaimg.cn/large/006tKfTcly1fnwuejh6otj309w02g741.jpg)

直接看代码：

![img](https://ws1.sinaimg.cn/large/006tKfTcly1fnwueu5oxhj30gx07i0sz.jpg)

 

**减少平方根的使用：**

上述代码中用到 3次nomalize, 每个normalize 里面又有一个Math.sqrt;

 计算法向量 （w) 的模，可以使用下面的公式，

![img](https://ws4.sinaimg.cn/large/006tKfTcly1fnwuf4sjglj304s00h0gs.jpg)

 

sin(θ)的值可以使用

![$$\sin\theta = 2 \sin\frac{\theta}{2} \cos\frac{\theta}{2}$$](https://ws4.sinaimg.cn/large/006tKfTcly1fnwufgn7zuj303v00x0jc.jpg)

那么代码即可简化为：

![img](https://ws1.sinaimg.cn/large/006tKfTcly1fnwufsuwnsj30l8087mxi.jpg)‘

 

我们可以清楚的发现创建单位法向量(w)时除了一个 half_sin,构造四元数对象(quat) 又乘了half_sin,因此  half_sin是重复而多余的，简化代码如下：

![img](https://ws4.sinaimg.cn/large/006tKfTcly1fnwug3y8vej30i105naa8.jpg)

 

**在THREE.js  中进行改进**

用些引擎normalize 的速度是很快的，如是我们可以进一步该进代码：

![img](https://ws3.sinaimg.cn/large/006tKfTcly1fnwugso4cvj30m505wweo.jpg)

 

通过观察代码我们容易发现，构建四元素对象时，用的是half_cos 的平方，故开平方的代码可以省去：

![img](https://ws3.sinaimg.cn/large/006tKfTcly1fnwuh8tunmj30ho055aa5.jpg)

 

我们可以让四元素乘上 norm_u_norm_v 进一步简化代码

![img](https://ws2.sinaimg.cn/large/006tKfTcly1fnwuhisncjj30l405474d.jpg)

 

如果强迫 使用单位向量（three.js 确实是这样做的） 代码还可以简化为

![img](https://ws1.sinaimg.cn/large/006tKfTcly1fnwuhrirc8j30i703zmx4.jpg)

 

注意：两个向量可能不在同一个平面内，还要进行判断

所有代码如下：

![img](https://ws2.sinaimg.cn/large/006tKfTcly1fnwuhz37xcj30hj0eimxk.jpg)

 

如有不对，欢迎抛砖