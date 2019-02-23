---
title: "webpack之优化"
date: 
categories: webpack
tags: 
- webpack
- 优化
---

在上篇 [webpack 之基础配置](https://winixt.github.io/webpack%E4%B9%8B%E5%9F%BA%E7%A1%80%E9%85%8D%E7%BD%AE/)讲解了 webpack 的一些基本用法，本篇我们来详细分析下 webpack 性能相关优化。

<!-- more -->

![图片](https://ws4.sinaimg.cn/large/006tNc79ly1foswn2zlu3j31kw0vr7az.jpg)



webpack 的优化可分为两大类：

* 优化开发体验：提高构建速度、热替换和自动刷新。
* 优化输出质量：压缩、CDN 加速、使用 Tree Shaking、提取公共代码、按需加载等。



### 优化开发体验

------

#### 缩小文件搜索范围

webpack 启动后会从 entry 出发递归解析和处理 module。处理 module 的时候涉及查找 module 对应的文件和 module 解析两个步骤。当项目比较大的时候，查找和解析 module 可能会造成构建缓慢。因此我们可以从这个点出发，进行优化。



##### 优化 Loader 配置

由于 loader 转换耗时，因此应尽可能减少不必要的 loader 转换，可以通过 test、include、exclude 等缩小命中范围：

```javascript
const config = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader?cacheDirectory'],
        // 只处理 src 目录下的文件
        include: path.resovle(__dirname, 'src')
      }
    ]
  }
}
```



##### 优化 resolve.modules 配置

默认第三方模块在当前目录下的 node_modules 目录下查找，找不到再 往上 ../node_modules，再不到再往上 ../../node_modules。

当我们所需要的第三方模块都在当前目录下的 node_modules 时，可以使用绝对路径。减少搜索时间：

```javascript
const config = {
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules')]
  }
}
```



##### 优化 module.noParse 配置

没有采用模块化的文件，没必要经过 webpack 的处理，例如: jQuery、ChartJS。

```
const config = {
  module: {
    noParse: [/chartjs/],
  }
}
```



#### 使用 DllPlugin

使用过 window 系统的人，应该经常看到 .dll 后缀的文件，这些文件成为**动态链接库**，在一个动态链接库中可以包含给其他模块调用的函数和数据。

webpack 可以利用 DllPlugin 将常用的第三方库打包进动态链接库中，例如：react、react-dom，只要不升级这些模块，动态链接库就不用重新编译，从而大量缩短编译时间。

##### 接入 wepack

webpack 已经内置了对动态链接库的支持，需要通过两个内置的插件接入：

* DllPlugin： 用于打包动态链接库文件。
* DllReferencePlugin: 用于在主配置文件中引入 DllPlugin 打包好的动态链接库文件。

为了方便说明，我用 webpack 简单构建了 react 和 react-dom 合成的动态链接库文件，输出目录如下：

```
/dist
  |-- react.dll.js
  |-- react.manifest.json
```

react.dll.js 的内容大致如下：

```javascript
var _dll_react = (function(modules) {
  // ... 此处省略 webpackBoostrap 函数代码
}([
  function(module, exports, __webpack_require__) {
    // 模块 ID 为 0 的模块对应的代码
  }，
  function(module, exports, __webpack_require__) {
    // 模块 ID 为 1 的模块对应的代码
  }，
  // ... 省略其他模块对应的代码
]));
```

可以一个动态链接库文件中可以包含大量模块，模块以数组索引最为 ID，并且通过 _dll_react 变量将自己暴露在全局中。

react.manifest.json 也是由 DllPlugin 生成的，用于描述动态链接库中包含哪些模块：

```javascript
{
  // 描述该动态链接库文件暴露在全局的变量名称
  "name": "_dll_react",
  "content": {
    "./node_modules/process/browser.js": {
      "id": 0,
      "meta": {}
    },
    // ... 此处省略部分模块
    "./node_modules/react-dom/lib/ReactBrowserEventEmitter.js": {
      "id": 42,
      "meta": {}
    },
    "./node_modules/react/lib/lowPriorityWarning.js": {
      "id": 47,
      "meta": {}
    },
    // ... 此处省略部分模块
    "./node_modules/react-dom/lib/SyntheticTouchEvent.js": {
      "id": 210,
      "meta": {}
    },
    "./node_modules/react-dom/lib/SyntheticTransitionEvent.js": {
      "id": 211,
      "meta": {}
    },
  }
}
```

可见 manifest.json 文件清楚的描述对应的 dll 文件包含哪些模块，以及这些模块的 ID。对应的 html 为：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Page Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="app"></div>
  <!--导入依赖的动态链接库文件-->
  <script src="./dist/react.dll.js"></script>
  <!--导入执行入口文件-->
  <script src="./dist/bundle.js"></script>
</body>
</html>
```

##### 构建动态链接库

新建一个 webpack_dll.config.js 文件构建动态链接库：

```js
const path = require('path');
const DllPlugin = require('webpack/lib/DllPlugin');

module.exports = {
  entry: {
    react: ['react', 'react-dom']
  },
  output: {
    filename: '[name].dll.js',
    path: path.resolve(__dirname, 'dist'),
    // 存放动态链接库全局变量的名称，对 react 来说是 _dll_react
    // 加上 _dll_ 是为了防止命名冲突
    library: '_dll_[name]',
  },
  plugins: [
    new DllPlugin({
      // 动态链接库的名称，需要和 library 保持一致
      // 该字段的值也就是输出的 manifest.json 文件中 name 的值
      name: '_dll_[name]',
      // 描述动态链接库的 manifest.json 文件输出时的文件名
      path: path.resolve(__dirname, 'dist', '[name].manifest.json')
    })
  ]
}
```

##### 使用动态链接库

```js
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')

module.exports = {
  entry: './main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: ['css-loader'],
        })
      }, {
        test: /\.js/,
        use: ['babel-loader'],
        exclude: path.resolve(__dirname, 'node_modules')
    }]
  },
  plugins: [
    // 告诉 webpack 使用了哪些动态链接库
    new DllReferencePlugin({
      // 描述 react 动态链接库的文件内容
      manifest: require('./dist/react.manifest.json'),
    }),
    new ExtractTextPlugin({
      filename: '[name]_[contenthash:8].css',
    }),
  ]
}
```



#### 使用 HappyPack

webpack 以单线程模式运行在 nodejs 之上，当项目大，需要处理大量文件的时候，不能充分利用 CPU 的性能。

HappyPack 可以解决这个问题，它把任务分给多个子进程去并发执行，子进程处理完后再把结果返回给主进程。

##### 接入 HappyPack

分解任务和进程管理 HappyPack 都会自动完成，你所需要做的只是接入 HappyPack：

```js
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HappyPack = require('happypack');

const config = {
  module: {
    rules: [
      {
        test: /\.js$/,
        // 将 js 文件交给 id 为 babel 的 HappyPack 进程处理
        use: ['happypack/loader?id=babel'],
        exclude: path.resolve(__dirname, 'node_modules')
      }, {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          // 将 css 文件交个 id 为 css 的 HappyPack 进程处理
          use: ['happypack/loader?id=css']
        })
      }
    ]
  },
  plugins: [
    new HappyPack({
      // 标识 HappyPack 进程
      id: 'babel',
      // 如何处理 .js 文件，用法和 loader 配置一样
      loaders: ['babel-loader?cacheDirectory']
    }),
    new HappyPack({
      id: 'css',
      loaders: ['css-loader']
    }),
    new ExtractTextPlugin({
      filename: '[name].css'
    })
  ]
}
```

除了支持 id 和 loaders，HappyPack 还支持如下参数：

* threads: 代表开几个进程去处理这一类文件，默认是 3 个，类型必须是整数。
* verbose: 是否允许 HappyPack 输出日志，默认 true。
* threadPool: 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程处理任务，以防止资源占用过多。

进程池的创建：

```
const happyThreadPool = HappyPack.ThreadPool({size: 5})
```



#### 使用 ParallelUglifyPlugin

在构建线上代码的时候，需要对代码进行压缩，会发现这个过程相比开发环境慢很多。因为压缩 js 代码需要先把代码解析成用 Object 抽象表示的 AST 语法树，再去应用各种规则分析和处理 AST，导致这个过程计算量巨大，耗时非常多。

使用 parallelUglifyPlugin 可以开启多个进程进行并行压缩，加快构建过程：

```js
const path = require('path');
const DefinePlugin = require('webpack/lib/DefindePlugin');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

module.exports = {
  plugins: [
    // 使用 ParallelUglifyPlugin 并行压缩 js 代码
    new ParalleUglifyPlugin({
      // 传递给 UglifyJS 的参数
      uglifyJS: {
        output: {
          // 最紧凑输出
          beautify: false,
          // 删除所有注释
          comments: false,
        },
        compress: {
          // 在 UglifyJS 删除没有用到的代码时不输出警告
          warnings: false,
          // 删除所有的 console 语句，兼容 ie
          drop_console: true,
          // 内嵌定义了但只用到一次的变量
          collapse_vars: true,
          // 提取出出现多次但是没有定义成变量去引用的静态值
          reduce_vars: true,
        }
      }
    })
  ]
}
```

ParallelUglifyPlugin 支持以下参数：

* test：使用正则去匹配需要压缩哪些文件，默认是 /\\.js$/。
* include: 使用正则去命中需要被压缩的文件，默认 []。
* exclude: 使用正则去命中不需要被压缩的文件，默认 []。
* cacheDir: 缓存压缩后的结果，默认不缓存，若需要缓存请设置一个目录路径。
* workerCount: 开启几个进程去执行压缩，默认当前 CPU 核数减一。
* sourceMap: 是否输出 Source Map，这会导致压缩过程变慢。
* uglifyJS：用于压缩 es5 代码时的配置，Object 类型，直接传递给 UglifyJS 的参数。
* uglifyES：用于压缩 es6 代码时的配置，Object 类型，直接传递给 UglifyES 的参数。

其中 test、include、exclude 与配置 loader 时的思想和用法一样。

> UglifyES 是 UglifyJS 的变种，专门用于压缩 es6 代码，它们两都出自于同一项目，但不能同时使用。
>
> UglifyES 一般用于给比较新的 js 运行环境压缩代码，例如 react-native，为了能得到更好的性能和尺寸，采用 UglifyES 压缩效果更好。
>
> ParallelUglifyPlugin 同时内置了 UglifyES 和 UglishJS。



> 注意：webpack4.0 UglifyJS 在 production 模式时，UglifyJS 自动并行编译和缓存，
>
> 这意味着 当你使用 >= webpack4.0 的版本时不在需要使用 ParallelUglifyPlugin，
>
> 官方说明到 webpack5.0 的时候将会完全实现缓存和并行化，期待



#### 自动刷新

为了优化开发体验，webpack 内置了监听文件的变化去刷新浏览器的功能：

```js
module.export = {
  // 只有开启监听模式，watchOptions 才有意义
  // 默认为 false
  watch: true,
  watchOptions: {
    // 不监听文件或文件夹，默认为 ''
    ignored: /node_modules/,
    // 监听到文件变化后，等 300ms 再去执行操作
    // 防止文件更新太快，重编译频率太高
    aggregateTimeout: 300,
    // 不停的去询问系统文件是否发生变化
    // 默认每秒问 1000 次
    poll: 1000,
  }
}
```

文件监听实现的原理为，记录最后一次文件的编译时间与文件的最后一次保存时间对比，若不相同，在等待 aggregateTimeout 后对文件进行重新编译。

webpack 官方提供了两大模块，一个是核心 webpack 一个是 webpack-dev-server

如果要开启自动刷新功能，需要用 webpack-dev-server 启动 webpack 构建，而 webpack-dev-server 默认开启 watch。



#### 开启模块热替换

模块热替换可在不刷新整个网页的情况下做到超灵敏的实时预览。原理是当一个模块发生变化时，只重新编译发生变化的模块，再用新模块替换浏览器中老的模块。

在启动 webpack 构建时 带上 —hot 参数即可启动模块热替换

##### 优化模块热启动

在发生模块热替换时，浏览器的日志显示的是替换模块的 ID，对人类很不友好。

![图片](https://ws4.sinaimg.cn/large/006tNc79gy1fotpyawq9nj30qk08kgn7.jpg)

从上图可以看到，模块热替换默认显示的是模块 ID 1。上图也有提示：

Consider using the Name ModulesPlugin for module names

我们来优化一下：

```js
const NamedModulesPlugin = requjre('webpack/lib/NamedModulesPlugin');
module.exports = {
  plugins: [
    new NamedModulesPlugin(),
  ]
}
```

![图片](https://ws3.sinaimg.cn/large/006tNc79gy1fotq3yoyp9j30qi06g0u8.jpg)

可以看到模块 ID 就变成模块名称了。

> 注意：webpack4 在 开发模式下，默认启用了 NamedModulesPlugin，不需要再手动设置



### 优化输出质量

------

#### 区分环境

开发网页的时候，一般会有多套运行代码，例如：

* 开发环境代码，包含日志输出，代码美化方便调试
* 发布线上代码，移除日志输出，代码压缩，提高代码运行效率

很多第三方库的代码也做了环境区分，例如：react:

```js
if (process.env.NODe_ENV !== 'production') {
  waring(...)
}
```

这时可以通过 webpack 设置打包环境，优化代码输出质量：

```js
const DefinePlugin = require('webpack/lib/DefinePlugin');

module.exports = {
  plugins: [
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      }
    })
  ]
}
```

经过构建后代码变成：

```js
if (false) {
  waring(...)
}
```

if 语句得不到执行，再经过 UglifyJS 压缩，即可删除这段无效代码，即可以提高代码运行速度，又可以减小总体代码体积。



#### 压缩代码

##### 为什么要进行代码压缩

因为进行代码压缩可以减小文件体积，减少网络传输流量。对于代码文件还有混淆代码的作用，并且压缩了代码变量名名称，有利于保护代码安全。

压缩 js 上文有介绍，这里就不赘述，我们来看看 css 压缩、svg 压缩。

##### css 压缩

css 代码也可以像 js 那样压缩，对代码进行混淆，目前比较成熟的工具是 cssnano，基于 PostCSS。

cssnano 能理解 css 代码含义，而不仅仅是删除空格，例如：

* margin: 10px 20px 10px 20px 被压缩成 margin: 10px 20px;
* color: #ff0000 被压缩成 color: red;

webpack 使用 cssnano 很简单，只需要开启 css-loader 的 minimize 选项：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['css-loader?minimize']
      }
    ]
  }
}
```



##### svg 压缩

目前 svg 已经成为客户端应用小图标的首先技术方案，相对于位图更清晰，多数情况下体积更小。

使用 sag-inline-loader 会分析 svg 内容，去除不必要的内容，例如：

```sag
<svg class="icon" verison="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     stroke="#000">
  <circle cx="12" cy="12" r="10"/>
</svg>
```

被处理后：

```
<svg viewBox="0 0 24 24" stroke="#000"><circle cx="12" cy="12" r="10"/></svg>

```

sag-inline-loader 用法：

```
module.exports = {
  module: {
    rules: [
      {
        test: /\.svg/,
        use: ['use-inline-loader']
      }
    ]
  }
}
```



#### 使用 Tree Shaking

##### 什么是 Tree Shaking

Tree Shaking 可以用来剔除 javascript 中用不上的死代码，依赖于 es6 模块化语法。

例如：utils.js源码：

```js
export function funcOne() {
  console.log('one');
}

export function funcTwo() {
  console.log('two');
}
```

当我们的代码只引用了 funcOne:

```js
import {funcTwo} from './utils';

// do something ...
```

Tree Shaking 后的 utils.js:

```js
export function funcOne() {
  console.log('one');
}
```

> 注意：Tree Shaking 正常工作的前提是交给 webpack 的 js 代码必须是 es6 模块语法的，因为 es6 模块语法是静态的，这让 webpack 可以简单分析出哪些 export 的被 import 过了。如果采用 es5 中的模块，例如：module.exports = {…}, require(…)，webpack 无法分析出哪些代码可以被剔除。



##### 接入 Tree Shaking

把 es6 模块化的代码交给 webpack，修改 .babelrc 如下：

```json
{
  "presets": [
    [
      "env",
      {
        "modules": false
      }
    ]
  ]
}
```

其中 "modules": false 含义是关闭 babel 模块转换功能，保留原本 es6 模块化语法。

配置好后，重新运行 webpack 带上 —display-used-exports 参数，方便追踪 Tree Shaking 工作。

上述工作只是标识出可以剔除的代码，真正剔除的工作还得交给 UglifyJS，启动 webpack 时带上 —optimize-minimize 参数即可实现剔除。

很多第三方库也提供了 es6 模块化的入口：

```json
{
  "main": "lib/index.js", // 指明采用 CommanJS 模块化的代码入口
  "jsnext:main: "es/index.js", // 指明采用 es6 模块化的代码入口
}
```

webpack 添加如下配置，也可让 Tree Shaking 对第三方库生效：

```js
module.exports = {
  resolve: {
    mainFields: ['jsnext:main', 'browser', 'main']
  }
}
```



#### 提取公共代码

##### 为什么要提取公共代码

提供公共代码有两个方面的优势：

* 提取多个页面的公共代码，虽然用户第一次访问没有优势，当时当用户访问其他页面的时候，因为本地有缓存，页面加载速度将大大加快。
* 提取第三方库，因为第三方库代码更改频率低，可以充分利用浏览器缓存。

使用 >= webpack4.x 的版本时，webpack 会自动处理代码分割，无需手动处理。但是如果我们开发大型项目，还是有必要手动处理公共代码的。

> 注意， webpack4.0 已经将 CommonsChunkPlugin 移除，取而代之的是更好的默认公共代码提取方式，以及拥有更丰富更灵活的功能的  optimization.splitChunks 和 optimization.runtimeChunk。

##### 提取大型项目公共代码的原则

* 根据项目应用的技术栈，提取所有页面都需要的基础库。例如 react 的技术栈，可以提取 react、react-dom 为一个单独的文件。（具体情况需要具体分析，可能技术栈中使用了 appolo-client 也需要把 appolo-client 放入基础库）这个文件一般命名为 base_[hash:8].js。
* 在剔除了公共代码库后，将各个页面公用的代码提取入 common_[hash:8].js，若是 css 可提取进 common\_[hash:8].css。
* 每个页面生成一份单独的 js、css 文件。（在此基础上按需实现懒加载）

借用 [吴浩麟大神](http://webpack.wuhaolin.cn/)的图片

![图片](https://ws4.sinaimg.cn/large/006tNc79gy1fotxz9d3qyj30zs19swk6.jpg)

下面我们来看看如何用 optimization.splitChunks 和 optimization.runtimeChunk 实现上叙需求。

```js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'async', // chunks 类型 (initial | all | async)
      minSize: 30000, // 最小尺寸, 默认 30000
      minChunks: 1, // 最少 chunk, 默认 1
      maxAsyncRequests: 5, // 最大异步请求 chunk 数
      maxInitalRequests: 3, // 最大初始化请求 chunk 数
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20, // 优先级
        },
        // 提取各个页面的公共代码（不包括第三方库）
        commons: {
          name: 'commons',
          chunks: 'initial',
        },
        // 提取各个页面公共的第三方库
        vendors: {
          name: 'base',
          chunks: 'initial',
          test: /node_modules/,
          priority: -10,
        }
      }
    }
  }
}
```



#### 按需加载

随着 SPA 的广泛流行，面临着一个网页需要加载全网站代码的问题，这会导致初次进入页面，页面加载缓慢、交互卡顿，用户体验糟糕。

针对这个问题的优化原则：

* 把整个网站拆分成一个个小功能，在按照功能的相关性分成几个类
* 把每一个类合并为一个 chunk，按需加在对应的 chunk
* 对于用户首次打开网页时需要用到的功能，不需要做按需加载，而是放到执行入口所在的 chunk 中，降低用户感知时间。
* 对于依赖大量代码的功能，例如：chartjs，可对此再按需加载。（若是在首页，则可对这部分代码进行异步加载）

##### webpack 实现按需加载

```jsx
import { PureComponent, createElement } from 'react';
import { render } from 'react-dom';
import { HashRouter, Route, Link } from 'react-router-dom';
import Home from './Home';

function getAsyncComponent(load) {
  return class AsyncComponent extends PureComponent {
    componentDidMount() {
      // 在高阶组件 DidMount 后在去异步加载 组件
      load().then(({ default: component }) => {
        // 组件加载成功，通知高阶组件重新渲染子组件
        this.setState({
          component,
        })
      })
    }
    render() {
      const { component } = this.state || {};
      // component 是 React.Component 类型
      // 需要通过 createElement 产生一个组件实例
      return component ? createElement(component) : null;
    }
  }
}

function App() {
  return (
    <HashRouter>
      <div>
        <nav>
          <Link to="/">Home</Link> | <Link to="/about">Home</Link>
        </nav>
        <hr />
        <Route exact path="/" component={Home} />
        <Route path="/about" component={getAsyncComponent(
            // webpack 内置了对 import 的支持
          () => import(/* webpackChunkName: 'about' */'./pages/about')
        )} />
        <Route path="login" component={getAsyncComponent(
          () => import(/* webpackChunkName: 'login' */'./pages/login')
        )} />
      </div>
    </HashRouter>
  );
}

render(App, document.getElementById('app'))
```

上叙代码的关键在于 import(/* webpackChunkName: 'about' */'./pages/about')

webpack 内置了对 import(*) 语句的支持，当webpack 遇到这样的语句：

* 以 ./pages/about 为入口新生成一个 Chunk;
* 当代码执行到 import 所在语句时才会去加载由 Chunk 对应生成的文件；
* import 返回一个 promise，文件加载成功时调用 resolve

 注意：不支持 Promise 的浏览器需要手动注入 promise polyfill

 上述代码直接打包会报错，因为 Babel 不认识 import(*) ，为此我们需要安装一次插件 babel-plugin-syntax-dynamic-import，.babelrc 改为

 ```json
 {
   "presets": [
     "env",
     "react"
   ],
   "plugins": [
     "syntax-dynamic-import"
   ]
 }
 ```



### 参考链接

------

深入浅出 webpack： http://webpack.wuhaolin.cn/

webpack 中文官网： https://doc.webpack-china.org/configuration/