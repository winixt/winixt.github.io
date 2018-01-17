---
title: 揭开 https 安全面纱
categories: 传输协议
tags: https
---

### 1. HTTPS 基础（HTTP + TLS/SSL）

1.1 HTTP 采用明文传输，会造成三个方面的风险：
> 信息窃取
  信息篡改
  身份冒充


1.2 TLS/SSL 全称安全传输协议 Transport Layer Security, 介于 HTTP 和 TCP 之间的一层安全协议。

简单说 HTTPS 就是 HTTP 的安全版，是使用 TLS/SSL 加密过的 HTTP。优势：
> 信息加密
  完整性校验
  身份验证

### 2. TLS/SSL 原理


