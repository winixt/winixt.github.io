---
title: "js Number详解"
date: 2019-03-18
categories: js
tags: 
- number
---

## TL;DR

------
* Number 最大安全整数为 `Math.pow(2, 53) - 1`
* Number.MAX_VALUE round 成 Infinity 至少加上能被四舍五入到 `Math.pow(2, 970)`
* 位运算符处理数据之前需要转换为32位进行处理，处理完后再转换为 64 位

<!-- more -->

## 文章思路
1. 描述 IEEE754 64双精度表示法
2. 推出 Infinity、Number.MAX_VALUE、Number.MIN_VALUE 的表述
3. 进一步推出 Number 的最大安全数表示，为什么是 Math.pow(2, 53) - 1
4. 分析位运算 32位转换，如何将 64 位转换成 32 位


## IEEE754 双精度表示

根据 IEEE754 标准规定，一个双精度浮点数可以表示为:
> value = 符号位(S) x 尾数(M) x Math.pow(2, E)

1. S 符号位，决定数字的正负
2. M 尾数位，1 <= M < 2
3. E 表示数字指数

在内存中的表示如下：

![双精度浮点数在内存中的表示](https://ws1.sinaimg.cn/large/006tKfTcly1g18c4pud5dj30hx02st9q.jpg)

1. sign 1 位，exponent 11 位，significand 52 位
2. S 表示符号位，0 为正，1 为负
3. exponent 不是公式中 Math.pow(2, E) 中的 E，二是 E + 1023
4. 前面提到，1 <= M < 2，可以表示 1.xxxxxx，其中 xxxxxxx 即是用 significand 存储
   
> 参考
> 1. [IEEE754](https://link.zhihu.com/?target=http%3A//www.csee.umbc.edu/~tsimo1/CMSC455/IEEE-754-2008.)
> 2. [IEEE754 可视化](http://bartaz.github.io/ieee754-visualization/)

### Infinity、0、MAX_VALUE、MIN_VALUE

IEEE754 标准规定，exponent 全1和全0都有特殊含义，不算正常指数。
1. 全0：用来表示带符号的 0（尾数为0）或下溢数（尾数不为0）
2. 全1：用来表示Inifinity（尾数为0）或 NaN （尾数不为0）
3. 其他：代表 Math.pow(2, e)，其中 -1022 <= e <= 1023，因为 -1023 和 1024 已有特殊含义

由此可知:
```
// 无穷大
Math.pow(2, 1024) === Inifity

// 0，因为 e最小为 -1022，把默认的 1 再左移 53 位，尾数即为 0
Math.pow(2, -1022) * Math.pow(2, -53) === 0
```

由此可轻易推断出，MIN_VALUE 和 MAX_VALUE
```
// MIN_VALUE 为：最小指数 x 最小尾数
Number.MIN_VALUE === Math.pow(2，-1022) * Math.pow(2, -52);

// MAX_VALUE 为：最大指数 x 最大尾数
Number.MAX_VALUE === Math.pow(2, 1023) * 1.xxxxxx
                 === Math.pow(2, 971) * (Math.pow(2, 53) - 1) // 将尾数右移 52 位
```

所以 Infinity 和 Number.MAX_VALUE 不是一个数量级的。Infinity 比 Number.MAX_VALUE 多了`Math.pow(2, 971)`。Number.MAX_VALUE 只有在 significand 多一个比特位才会被表示为 Infinity
```
(Math.pow(2, 54) - 1) * Math.pow(2, 970) - (Math.pow(2, 53) -1) * Math.pow(2, 971) === Math.pow(2, 970)
```
也就是说，Number.MAX_VALUE 必须要加上一个被 IEEE754 四舍五入为 Math.pow(2, 970) 的数，才能被转换为 Infinity

### Number.MAX_SAFE_INTEGER

javascript 的最大安全数为 Number.MAX_SAFE_INTEGER，即：
```
Math.pow(2, 53) - 1 === Number.MAX_SAFE_INTEGER
```

**为什么 Math.pow(2, 53) - 1 才是最大安全整数呢？**

IEEE754 要求浮点数以规范形式存储，即小数点前有一位非零数字。对于二进制数，非零数字只有 1。所以IEEE754在存储时省略了这个小数点前面的1，只存储小数点后面的位。前面我们说过，significand 总共有 52 位，加上隐藏的一位1，总共有 53 位表示的二进制数，在多的会被截断，也就是精读丢失。那么最大的整数即是 53 位 1，位 Math.pow(2, 53) - 1。

**为什么不是 Math.pow(2, 53) 呢？因为 Math.pow(2, 53) 后面全是 0，截断也没关系呀？**

就是因为有截断这个动作，所以 Math.pow(2, 53) === Math.pow(2, 53) + 1，那么 Math.pow(2, 53) 就是不安全的。“它可以被不安全的数表示”

