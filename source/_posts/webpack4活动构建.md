---
title: "webpack4 H5活动页构建"
date: 
categories: webpack
tags: 
- webpack
- 活动
---


![webpack4构建](https://ws3.sinaimg.cn/large/006tNbRwly1fyj0dlmpwcj30dw09ajrz.jpg)

由于公司的H5活动页构建老旧，存在一系列问题，于是萌生了用 webpack4 重写整个构建的想法，在此记录下遇到的问题与对应的解决方案。

⚠️ 本文不涉及 webpack4 配置的基础知识！



## 目标

1. 支持单页和多页
2. 支持开发时的热更新
3. 构建过程可配置
4. 支持接口 mock
5. 支持 es6 语法
6. 弹性设配移动端屏幕

### 目录结构

<pre>
|-- lib 活动专用 js 脚本
|-- thirdsrc 第三方代码库
|-- build 构建脚本
|-- mock mock 数据
|-- template 模版
	|-- css
	|-- js
	|-- entry 入口文件，处理一些公用逻辑
	|-- img
	|-- view.html
</pre>

### 依赖的第三方库

#### zepto

引入 zepto 是为了提高 dom 的操作效率，并且符合团队人员的开发习惯。为了不让基础依赖库过大，只引入了 zepto 中的 zepto、event、ajax 三个模块。

没有考虑使用 vue、react 等框架的原因：虽然引入第三方框架，能够更好的复用代码，降低开发人员开发切换开发代价，但是会引入一个更大的问题，依赖基础包太大了，在用户网络不好的情况下，及其影响用户体验。为了一个活动页，引入这么重的框架不值得。如果 vue3.0 实现它的目标，压缩后只有 10k，那么是一个非常好的选择。

#### fastclick

由于我们的代码还要运行在 ios 老的 webview 上，依然会有 click 延迟 300ms 问题，因此引入这个基础库。

#### 引入方式

```js
import '/path/to/fastclick';
import '/path/to/zepto'; 
```



### 图片问题

图片是前端不可忽视的重资源问题，尽管图片解析渲染非常快（相比同等大小的js）。但是过大的图片会导致页面有段空白期，甚至出现页面抖动，造成非常糟糕的用户体验。

#### 大图片

1. 使用 image-webpack-loader 进行图片的压缩
2. 在 CDN 上存储.png 和 .webp 两种格式的图片，客户端判断能用webp 就用 webp（判断是否支持 webp 需要一定的时间，可将判断结果持久化存储在本地），或者直接在 CDN 实现。如果产品运行在 webview 可以引入基础库，直接对 webp 进行支持。

#### 小图标

svg 在移动端支持的非常好了，搭配 http/2，跑的飞起，没有理由不用。虽然在 android <= 4.3 会将 svg 转换成非矢量图在渲染，但是看看你的应用在 android <= 4.3 有多少用户量吧。

### CSS

直接上 postcss，能将 px 转换成 rem，能 autoprefixer(还能根据需要兼容的浏览器进行配置，当然更好的方式是使用 .browserslistrc，这才是业界标准)，能压缩 cssnano。

Normalize.css 当然不能少[normalize.css](https://github.com/necolas/normalize.css) 

### JS

#### 动态 polyfill

由于大部分用户用的都是“现代”手机，因此大部分 polyfill 对于大部分用户来是不需要的。可以自己搭服务器实现类似 [polyfill.io](http://link.zhihu.com/?target=https%3A//polyfill.io/) 的功能。具体性能优势，[传送门](https://zhuanlan.zhihu.com/p/37148975)



#### 编译成 es+

同样，对于大部分用户是能运行 es6 的，所以不必将所有代码编译成 es5。可以编译成两套代码，一套 es6，一套 es5 用于兼容底端设备。具体方案，[传送门](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/)



## Webpack

下面通过代码直接分析遇到的问题。

### html 

由于我们的需求比较简单，使用 html-webpack-plugin 能解决我们的单页多页问题。

处理 html  重的图片： 使用 html-loader

html 热更新，在 entry 文件，加入：

```js

if (process.env.NODE_ENV === 'development') {
    require('path/to/html')
}

```



### CSS

由于我们是活动页，比较适合将 css 注入 style 标签中，实现方式如下：

1. mini-css-extract-plugin 提取 css
2. style-ext-html-webpack-plugin 将提取的 css 注入 html 文件

⚠️ mini-css-extract-plugin 插件要在 style-ext-html-webpack-plugin 之前

```js
// 提取多个文件 css 的 webpack 配置
function generaterStyleChunk() {
    const styleChunk = {};
    for (let page of config.pages) {
        styleChunk[page + 'style'] = {
            name: page,
            test: (m,c,entry = page) => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
            chunks: 'all',
            enforce: true
        }
    }
    return styleChunk;
}

// 需要注意的是，不能将 css 打包进 js 中
{
    optimization: {
        minimize: true,
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: Object.assign({
                common: {
                    test(module, chunks) {
                        const result = module.type === 'javascript/auto' && /\/node_modules\//.test(module.context);
                        if (!result) {
                            console.log(module.type);
                            console.log(module.context);
                        }
                        return result;
                    },
                    name: 'common',
                    chunks: 'initial',
                    priority: 2,
                    minChunks: 2,
                }
            }, generaterStyleChunk())
        }
    }
}
```



### 保证chunk 名字变动最小

```js
new webpack.NamedChunksPlugin((chunk) => {
            const hashChunk = () => {
                return md5(Array.from(chunk.modulesIterable, (m) => {
                    return m.identifier();
                }).join()).slice(0, 10);
            }
            return chunk.name ? chunk.name : hashChunk()
        }),
new webpack.HashedModuleIdsPlugin(),
```



### 其他问题

支持 async/await 需要 @babel/plugin-transform-runtime

分析代码输出 webpack-bundle-analyzer

分析 babel，debug: true



### 总结

你需要明白，想要构建成什么样，能用资源有哪些，可以做到什么地步。然后一步步分析，实现你想要的模样。




