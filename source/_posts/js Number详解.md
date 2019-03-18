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
1. 描述 ieee754 64双精度表示法
2. 推出 Infinity 和 Number.MAX_VALUE 的表述
3. 进一步推出 Number 的最大安全数表示，为什么是 Math.pow(2, 53) - 1
4. 分析位运算 32位转换，如何将 64 位转换成 32 位



