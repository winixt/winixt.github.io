---
title: "聊一聊 HTTP"
date: 
categories: http
tags: 
  http
---

> 下文中的CORS内容大部分摘自 [HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)，这里进行了部分更改

### HTTP 简介

HTTP 超文本传输协议(Hypertext Transper Protocol)，应用层协议。基于一种请求/响应的工作模式。即当客户端与服务器连接后，客户端发送请求，服务器给出响应。

<!-- more -->

接下来我们从常用请求方法、HTTP Headers、响应状态码、跨资源共享 4 个方面进行分析。

### 常用请求方法

虽然 HTTP 规范定义一系列方法，但是常用的无非 GET、POST、HEAD、CONNECT；

* GET

  GET 方法请求一个指定资源的表示方式。使用 GET 方法应该只用于获取数据

* POST

  POST 方法用于将实体提交给指定的资源，通常导致状态或服务器上的副作用的更改

* HEAD 

  HEAD 方法请求一个与 GET 请求的响应相同的相应，但没有响应体。此方法经常用于测试超文本连接的有效性、可访问性、和最近的改变

* CONNECT

  CONNECT 方法建立一个到由目标资源标识的服务器的隧道

------



### HTTP Headers

HTTP 规范也定义了一系列 Headers 信息，但是大部分不需要我们开发人员关心，浏览器已经帮我们实现号了。我们来看看几个比较重要的 Headers 信息。

#### Content-Type

在响应中，Content-Type标头告诉客户端实际返回的内容的内容类型，如：

> Content-Type: text/html; charset=utf-8
>
> Content-Type: multipart/form-data; boundary=something

常见类型有：

1. text/html
2. text/plain
3. text/css
4. text/javascript
5. application/x-www-form-urlencoded
6. multipart/form-data
7. application/json
8. application/xml

指令：

`media-type`

资源或数据的 [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) 。

charset

字符编码标准。

boundary

对于多部分实体，boundary 是必需的，其包括来自一组字符的1到70个字符，已知通过电子邮件网关是非常健壮的，而不是以空白结尾。它用于封装消息的多个部分的边界。

#### Cookie

HTTP Cookie（也叫Web Cookie或浏览器Cookie）是服务器发送到用户浏览器并保存在本地的一小块数据，它会在浏览器下次向同一服务器再发起请求时被携带并发送到服务器上。

Cookie 主要用于以下三个方面：

* 会话状态管理（如用户登录状态、购物车、游戏分数或其他需要记录的信息）
* 个性化设置（如用户自定义设置、主题等）
* 浏览器行为跟踪（如分析用户行为等）

#### 跨资源请求相关 Header

Access-Control-Allow-Origin 等信息，具体看下文[跨资源共享模块]

------



### 响应状态码

#### 状态码分为5大类：

* 1XX（信息描述）：接受的请求正在处理
* 2XX（成功状态）：请求正常处理完毕。其中 206 表示请求部分内容成功
* 3XX（重定向状态）：服务器要求客户端重定向
* 4XX （客户端错误）：服务器无法处理请求
* 5XX （服务器错误）：服务器处理请求出错

#### 常用状态码

* 200: 客户端请求成功
* 301: 资源永久重定向
* 302: 资源暂时重定向
* 304: 请求资源未改动（不会返回任何资源，客户端利用本地缓存资源）
* 400: 客户端请求参数错误
* 401: 请求未授权
* 403: 服务器拒绝接受服务
* 404：请求资源不存在
* 500: 服务器发生不可预期错误
* 503: 服务器当前不能处理客户端请求

------



### 跨资源访问（CORS）

当一个资源从与该资源本身所在的服务器不同域或端口请求一个资源时，资源会发起一个跨域 HTTP 请求。跨域资源共享标准新增了一组 HTTP 首部字段，允许服务器声明哪些源站有权访问哪些资源。

为了防止 CSRF 跨站攻击，浏览器对跨域请求做了限制，即跨资源共享（CORS）机制，具体如下：

0. 简单请求（不会引起其他副作用的请求），直接发起请求，如果服务器拒绝跨域，浏览器会对请求结果进行拦截，否则通过请求。


1. 对于可能对服务器产生副作用的 HTTP 请求方法，浏览器必须首先使用 OPTIONS 方法发起一个预测请求，从而获知服务端是否允许跨域请求，服务器确认允许之后，才发起实际的HTTP 请求。在预测请求的返回中，服务端也可以通知客户端，是否需要携带身份凭证。
2. 有些浏览器不允许从 HTTPS 的域跨域访问 HTTP，比如 Chrome 和 Firefox，这些请求还为发起就被拦截。

#### 一个源的定义

如果协议、端口和域名对于当前访问页面是相同的，则两个页面同源。

例如当前访问页面为：http://www.example.com/test

| URL                            |  结果  | 原因   |
| :----------------------------- | :--: | ---- |
| http://www.example.com/test1   |  成功  |      |
| https://www.example.com/test1  |  失败  | 协议不同 |
| http://www.example.com:81/test |  失败  | 端口不同 |
| http://news.example.com/test   |  失败  | 不同域名 |
|                                |      |      |

 **IE例外** 

* 授信范围：两个相互之间高度互信的域名，如公司域名，不遵守同源策略的限制。
* 端口：IE 未将端口号加入到同源策略的组成成分之中。

#### 简单请求

满足下列条件的请求，可被视为“简单请求”：

* 下列方法之一
  * GET
  * HEAD
  * POST
* Fetch 规范定义[对 CORS 安全的首部字段集合](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)，不得人为设置该集合之外的其他首部字段，该集合为：
  * Accept
  * Accept-Language
  * Content-Language
  * Content-Type(有额外限制，参见下文)
  * DPR
  * Downlink
  * Save-Data
  * Viewport-Width
  * Width
* Content-Type 的值仅限于下列三者之一：
  * text/plain
  * multipart/form-data
  * application/x-www-form-urlencoded

列如下面这个请求，站点http://bar.other 访问站点 http://foo.example 资源：

```
GET /resources/public-data/ HTTP/1.1
Host: bar.other
User-Agent: Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.5; en-US; rv:1.9.1b3pre) Gecko/20081130 Minefield/3.1b3pre
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-us,en;q=0.5
Accept-Encoding: gzip,deflate
Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7
Connection: keep-alive
Referer: http://foo.example/examples/access-control/simpleXSInvocation.html
Origin: http://foo.example


HTTP/1.1 200 OK
Date: Mon, 01 Dec 2008 00:23:53 GMT
Server: Apache/2.0.61 
Access-Control-Allow-Origin: *
Keep-Alive: timeout=2, max=100
Connection: Keep-Alive
Transfer-Encoding: chunked
Content-Type: application/xml
```

这里有两个比较特殊的首部字段：

1. Origin: 在第 10 行，表明该请求来源于 http://foo.example

2. Access-Control-Allow-Origin: 在第16行，值为：*，表明该资源可以被任意的域访问，如果服务端仅允许来自 http://foo.example 的访问，首部字段应该如下：

   ```
   Access-Control-Allow-Origin: http://foo.example
   ```



#### 需要检测的请求

如前文所述，需要检测的请求，需要先发起一个 OPTIONS 预检请求到服务器， 满足下述任意条件时，应首先发起预检请求：

* 使用了下列任一方法
  * PUT
  * DELETE
  * CONNECT
  * OPTIONS
  * TRACE
  * PATCH
* 人为设置了[ CORS 安全的首部字段集合](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)之外的其他首部字段，该集合为：
  - Accept
  - Accept-Language
  - Content-Language
  - Content-Type(有额外限制，参见下文)
  - DPR
  - Downlink
  - Save-Data
  - Viewport-Width
  - Width
* Content-Type 的值不属于下列之一：
  * application/x-www-form-urlencoded
  * multipart/form-data
  * text/plain

如下是一个需要执行预检请求的 HTTP 请求：

```javascript
var invocation = new XMLHttpRequest();
var url = 'http://bar.other/resources/post-here/';
var body = '<?xml version="1.0"?><person><name>Arun</name></person>';
    
function callOtherDomain(){
  if(invocation)
    {
      invocation.open('POST', url, true);
      invocation.setRequestHeader('X-PINGOTHER', 'pingpong');
      invocation.setRequestHeader('Content-Type', 'application/xml');
      invocation.onreadystatechange = handler;
      invocation.send(body); 
    }
}
```

上面的代码使用 POST 请发送一个 XML 文档，包含自定义首部 X-PINGOTHER: pingpong。另外请求的 Content-Type 为 application/xml。因此，该请求需要首先发起"预检请求"。

![client-server](https://ws3.sinaimg.cn/large/006tKfTcgy1fnpi3nsl4jj30eh0fdgor.jpg)

```
OPTIONS /resources/post-here/ HTTP/1.1
Host: bar.other
User-Agent: Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.5; en-US; rv:1.9.1b3pre) Gecko/20081130 Minefield/3.1b3pre
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-us,en;q=0.5
Accept-Encoding: gzip,deflate
Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7
Connection: keep-alive
Origin: http://foo.example
Access-Control-Request-Method: POST
Access-Control-Request-Headers: X-PINGOTHER, Content-Type


HTTP/1.1 200 OK
Date: Mon, 01 Dec 2008 01:15:39 GMT
Server: Apache/2.0.61 (Unix)
Access-Control-Allow-Origin: http://foo.example
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
Vary: Accept-Encoding, Origin
Content-Encoding: gzip
Content-Length: 0
Keep-Alive: timeout=2, max=100
Connection: Keep-Alive
Content-Type: text/plain
```

预检请求完成后，发送实际请求：

```
POST /resources/post-here/ HTTP/1.1
Host: bar.other
User-Agent: Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.5; en-US; rv:1.9.1b3pre) Gecko/20081130 Minefield/3.1b3pre
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-us,en;q=0.5
Accept-Encoding: gzip,deflate
Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7
Connection: keep-alive
X-PINGOTHER: pingpong
Content-Type: text/xml; charset=UTF-8
Referer: http://foo.example/examples/preflightInvocation.html
Content-Length: 55
Origin: http://foo.example
Pragma: no-cache
Cache-Control: no-cache

<?xml version="1.0"?><person><name>Arun</name></person>


HTTP/1.1 200 OK
Date: Mon, 01 Dec 2008 01:15:40 GMT
Server: Apache/2.0.61 (Unix)
Access-Control-Allow-Origin: http://foo.example
Vary: Accept-Encoding, Origin
Content-Encoding: gzip
Content-Length: 235
Keep-Alive: timeout=2, max=99
Connection: Keep-Alive
Content-Type: text/plain
```

从上面的报文中我们看到，第1-12 行发送了一个 OPTIONS 方法的“预检请求”。OPTIONS 是 HTTP/1.1 的方法，用以从服务器获取更多的信息，该方法不会对服务器资源产生影响。预检请求携带了下面连个首部字段：

```
Access-Control-Request-Method: POST
Access-Control-Request-Headers: X-PINGOTHER
```

1. Access-Control-Request-Method 告知服务器，实际使用的请求方法，在这里是 POST。
2. Access-Control-Request-Headers 告知服务器，实际请求携带的自定义首部字段，在这里是 X-PINGOTHER 和 Content-Type。

服务器据此决定，该请求是否被允许。

第 14-16 行为预检请求的响应， 表明服务器将接受后续的实际请求。重点看 17-19 行：

```
Access-Control-Allow-Origin: http://foo.example
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
```

1. Access-Control-Allow-Methods：表示服务器允许客户端使用的请求方法，在这里是 POST、GET、OPTIONS。
2. Access-Control-Allow-Headers：表示服务器允许请求中携带的自定义字段，在这里是X-PINGOTHER, Content-Type。与 Access-Control-Allow-Methods 一样，Access-Control-Allow-Headers 的值为英文逗号分隔的列表。
3. Access-Control-Max-Age：表示该响应的有效时间为 86400 秒，也就是 24 小时。在有效时间内，浏览器无须为同一请求再次发起预检请求。请注意，浏览器维护了一个最大的有效时间，如果该首部字段的超过了最大的有效时间，将不会生效。



#### 附带身份凭证的请求

Fetch 与 CORS 的一个有趣的特性是，可以基于 HTTP cookies 和 HTTP 认证信息发送身份凭证。一般而言，对于跨域 XMLHttpRequest 或 Fetch 请求，浏览器不会发送身份凭证信息。如果要发送凭证信息，需要设置 XMLHttpRequest 的某个特殊标识位。

如下，http://foo.example 的某脚本 向 http://bar.other 发起一个 GET 请求，并设置 Cookie:

```
var invocation = new XMLHttpRequest();
var url = 'http://bar.other/resources/credentialed-content/';
    
function callOtherDomain(){
  if(invocation) {
    invocation.open('GET', url, true);
    invocation.withCredentials = true;
    invocation.onreadystatechange = handler;
    invocation.send(); 
  }
}
```

第 7 行将 XMLHttpRequest 的 withCredentials 的标志设置为 true，从而向服务器发送 Cookie。因为这是一个简单的 GET 请求，所以浏览器不会发起预检请求。但是，如果服务器的响应中未携带 Access-Control-Allow-Credentials: true，浏览器将不会把响应内容返回给请求的发送者。

Fetch 的特殊标志如下：credentials: 'include'

```
let requestConfig = {
    credentials: 'include',
    method: type,
    headers: {
      'Accept': 'application/json',
      'Content-Type' : 'application/json'
    },
    mode: "cors",
    cache: "force-cache"
  }
```



#### 附带身份凭证的请求与通配符

对于附带身份凭证的请求，服务器不得设置 Access-Control-Allow-Origin 的值为"*"。

这是因为请求的首部中携带了 Cookie 的信息，如果  Access-Control-Allow-Origin 的值为 “*”，请求将会失败。

#### form 表单的跨域问题

当 form 表单跨域提交数据的时候，原页面会跳转到新页面（这样原页面脚本便无法获取新页面的内容，浏览器因此认为是安全的），相当于 a 标签跳转一样，因而会带上缓存在本地的新页面的 cookie，并且可以提交成功。（这也是 csrf 能攻击成功，而不会被同源策略限制的原因）

但是因为不同源之间的跳转，request 也会带上 origin，refer等字段，可以依据这些字段限制不可信的跨域访问，这些涉及到 csrf 防御的问题了，在另一篇 csrf 防御和攻击有详细说明。

### HTTP 响应首部字段

本节列出了规范所定义的响应首部字段。上一小节中，我们已经看到了这些首部字段在实际场景中是如何工作的。

####  Access-Control-Allow-Origin

响应首部中可以携带一个 [`Access-Control-Allow-Origin`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)` 字段，其语法如下:`

```
Access-Control-Allow-Origin: <origin> | *
```

其中，origin 参数的值指定了允许访问该资源的外域 URI。对于不需要携带身份凭证的请求，服务器可以指定该字段的值为通配符，表示允许来自所有域的请求。

例如，下面的字段值将允许来自 http://mozilla.com 的请求：

```
Access-Control-Allow-Origin: http://mozilla.com
```

如果服务端指定了具体的域名而非“*”，那么响应首部中的 Vary 字段的值必须包含 Origin。这将告诉客户端：服务器对不同的源站返回不同的内容。

#### Access-Control-Expose-Headers

译者注：在跨域访问时，XMLHttpRequest对象的getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。

[`Access-Control-Expose-Headers`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Expose-Headers) 头让服务器把允许浏览器访问的头放入白名单，例如：

```
Access-Control-Expose-Headers: X-My-Custom-Header, X-Another-Custom-Header
```

这样浏览器就能够通过getResponseHeader访问`X-My-Custom-Header`和 `X-Another-Custom-Header` 响应头了`。`

#### Access-Control-Max-Age

[`Access-Control-Max-Age`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Max-Age) 头指定了preflight请求的结果能够被缓存多久，请参考本文在前面提到的preflight例子。

```
Access-Control-Max-Age: <delta-seconds>
```

`delta-seconds` 参数表示preflight请求的结果在多少秒内有效。

#### Access-Control-Allow-Credentials

[`Access-Control-Allow-Credentials`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials) 头指定了当浏览器的`credentials`设置为true时是否允许浏览器读取response的内容。当用在对preflight预检测请求的响应中时，它指定了实际的请求是否可以使用`credentials`。请注意：简单 GET 请求不会被预检；如果对此类请求的响应中不包含该字段，这个响应将被忽略掉，并且浏览器也不会将相应内容返回给网页。

```
Access-Control-Allow-Credentials: true
```

上文已经讨论了[附带身份凭证的请求](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials)。

#### Access-Control-Allow-Methods

[`Access-Control-Allow-Methods`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Methods) 首部字段用于预检请求的响应。其指明了实际请求所允许使用的 HTTP 方法。

```
Access-Control-Allow-Methods: <method>[, <method>]*
```

相关示例见[这里](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS$edit#Preflighted_requests)。

#### Access-Control-Allow-Headers

[`Access-Control-Allow-Headers`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Headers) 首部字段用于预检请求的响应。其指明了实际请求中允许携带的首部字段。

```
Access-Control-Allow-Headers: <field-name>[, <field-name>]*
```

### HTTP 请求首部字段

本节列出了可用于发起跨域请求的首部字段。请注意，这些首部字段无须手动设置。 当开发者使用 XMLHttpRequest 对象发起跨域请求时，它们已经被设置就绪。

#### Origin

[`Origin`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Origin) 首部字段表明预检请求或实际请求的源站。

```
Origin: <origin>
```

origin 参数的值为源站 URI。它不包含任何路径信息，只是服务器名称。

**Note:** 有时候将该字段的值设置为空字符串是有用的，例如，当源站是一个 data URL 时。

注意，不管是否为跨域请求，ORIGIN 字段总是被发送。

#### Access-Control-Request-Method

[`Access-Control-Request-Method`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Request-Method) 首部字段用于预检请求。其作用是，将实际请求所使用的 HTTP 方法告诉服务器。

```
Access-Control-Request-Method: <method>
```

相关示例见[这里](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS#Preflighted_requests)。

####  Access-Control-Request-Headers

[`Access-Control-Request-Headers`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Request-Headers) 首部字段用于预检请求。其作用是，将实际请求所携带的首部字段告诉服务器。

```
Access-Control-Request-Headers: <field-name>[, <field-name>]*
```