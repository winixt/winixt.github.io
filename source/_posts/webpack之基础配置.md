---
title: "webpack之基础配置"
date: 
categories: webpack
tags: 
- webpack
---

随着 web 应用逐渐复杂、前端技术的日新月异，前端代码的可扩展性、可维护性不断被提上议程。前端代码工程化的问题急需被解决，从模块化到构建工具，一代代发展，webpack 顺势而生，力压群雄。

<!-- more -->

![图片](https://ws4.sinaimg.cn/large/006tKfTcgy1forowys2uwj31kw0sgqcn.jpg)

在回答为什么需要解决前端工程化的问题前，先问问自己几个问题：

1. 当使用 es6 开发前端应用时，如何将其编译成 es5 在低端浏览器运行？
2. 如何把多模块合并为一个文件？
3. 如何进行文件压缩？
4. 如何提取多个页面的公共代码？
5. 如何实现懒加载？
6. 多人合作开发，如何进行代码校验，尽量保持代码风格的统一？
7. 如何自动实现代码发布？
8. ….

你可能会说，以上可以利用现有库或者自行开发一些工具函数实现呀！

不错，是可以，单单一个大点的项目手动实现的工作量就已经很惊人了，如果有多个项目呢？而构建工具，例如：webpack，可以通过简单的配置自动解决上述问题，减少大量重复的劳作时间，提高开发效率。

由于 webpack 是目前最好的构建工具，有良好的生态链和维护团队。下面我们重点来深入理解下 webpack。进而更好的应用于我们的产品当用，提高我们的开发效率和产品性能。



我们先来介绍 webpack 的几个核心概念，让你内心对 webpack 有个整体的认知，方便后面对 webpack 的学习：

* **Entry**: 入口，webpack 执行构建的入口。
* **Module**: 模块，webpack 视一切为模块，每一个文件为一个模块。webpack 会从 Entry 入口文件递归查找所有依赖文件。
* **Chunk**: 代码块，一个 Chunk 由多个模块组成，用于合并和分割代码。
* **Loader**: 模块转换器，用于把模块内容转换成新的内容，例如：scss，转换成 css。
* **Plugin**: 插件，用于在 webpack 构建流程中的特定时机注入扩展逻辑来改变构建或做其他事情。
* **Output**: 输出结果，webpack 完成构建后，将一系列文件输出。

webpack 启动后会从 Entry 开始递归解析 Entry 所依赖的所有 Module。每找到一个 Module，就会根据配置的 Loader 去找出对应的转换规则，对 Module 转换后，再解析出当前 Module 所依赖的 Module。这些模块会以 Entry 为单位进行分组，一个 Entry 和其所依赖的 Module 被分到一个组，也就是一个 Chunk。最后 webpack 会把所有 Chunk 转换成文件输出。在整个处理流程中，webpack 会在恰当的时机执行 Plugin 定义的逻辑。

### Entry

------

entry 是 webpack 构建入口，可以理解为构建起点。webpack 将从 entry 递归遍历所有依赖的 module。

#### context

webapck 查找相对路径的文件会以 context 为根目录，默认值为执行 webpack 的当前工作目录。可以通过以下方式设置：

```javascript
module.exports = {
    context: path.resolve(__dirname, 'otherWorkPath'),
}
```

注：context 必须为绝对路径，除了配置文件还可以通过 webpack —context 设置。

先在这里介绍 context，是因为 entry 路径和其他依赖模块的路径可能采用相对于 context 的路径来描述。

#### entry 用法

```javascript
//用法1(单入口）：entry: string|Array<string>
const config = {
    entry: './path/to/my/entry/file.js'
}

//用法2（对象语法）：entry: {[entryChunkName: string]: string|Array<string>}
const config = {
    entry: {
        app: './src/app.js',
        vendors: './src/vendors.js',
    }
}
```

这只是一个简单的示范，后续文章会根据实例进一步详细说明。

#### Chunk 名称

webpack 生成的 Chunk 名称与 Entry 的配置有关：

* entry 是一个 string 或 array，那么生成的 Chunk 名称为 main。
* entry 是一个 object，那么生成的 Chunk 名称为 object 键值对应的键名。

#### 动态 entry

如果有多个页面需要配置 entry，并且可能还会增加新的页面，entry 可能受其他因素影响不能写成静态值，需要动态配置，如下：

```javascript
// 同步
entry: () => {
    return {
        pageOne: './pageOne/index.js',        
        pageTwo: './pageTwo/index.js',
    }
}

// 异步
entry: () => {
    return new Promise((resolve) => {
        resolve({
            pageOne: './pageOne/index.js',        
        	pageTwo: './pageTwo/index.js',
        })
    })
}
```



### Output

------

配置 output 选项控制 webpack 如何向硬盘写入文件，是一个 object，里面包含一系列配置选项。

#### filename

配置输出文件名称：string，当只有一个文件时可以成静态文件名：

```
filename: 'bundle.js'
```

当有多个 Chunk 时，需要借助模版和变量。前面说到 webpack 会为每个 Chunk 生成一个文件名，可以这样用：

```
filname: '[name].js'
```

[name] 代表用内置变量 name 去代替 [name]，类似于 es6 的模版字符串。除了 name 还包括：

* **id**： Chunk 的唯一标识，从 0 开始。
* **name**: Chunk 名称。
* **hash**: Chunk 唯一标识 的 hash 值。
* **chunkhash**: Chunk 内容 hash 值。

其中 hash 和 chunkhash 值的长度是可指定的，[chunkhash: 8] 代表取 8 位的 chunkhash 值，默认是 20。 

> 注意 [ExtractTextWebpackPlugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) 插件是使用 `contenthash` 来代表哈希值而不是 `chunkhash`， 原因在于 ExtractTextWebpackPlugin 提取出来的内容是代码内容本身而不是由一组模块组成的 Chunk。

#### chunkFilename

output.chunkFilename 用于配制无入口的 Chunk 在输出时的文件名称。通常配合 CommonsChunkPlugin(用于提取公共代码的插件) 和动态加载使用。配置方式和 output.filename 一样。

> 注意：在 webpack4.0 commonsChunkPlugin 被移除，用 optimization.splitChunks 和 optimization.runtimeChunk 取代。
>

#### path

output.path 配置构建输出文件的位置，必须是 string 类型的绝对路径。

```
path: path.resolve(__dirname, 'dist');
```

#### publicPath

output.publicPath 默认值为 '' 空字符串，即 webpack 构建出的资源默认使用相对路径。如果需要使用 CDN 加速，让客户端去 CDN 服务器加载资源，则需要更改 publicPath 的配置：

```
publicPath: '//cdn.example.com/assets/'
```

这时发布到线上的代码地址为：

```
<script src="//cdn.example.com/assets/filename_[hash].js"></script>
```

#### crossOriginLoading

output.crossOriginLoading 配置异步加载资源是否带 cookie:

* anonymous （默认）加载此脚本资源时不会带上用户的 cookie。
* use-credentials 加载异步资源时带上用户的 cookie。

注意：这里只介绍了几个常用配置，详细请上[官方文档](https://doc.webpack-china.org/concepts/output/)查看。下文也类似。



### Module

------

module 配置如何处理不同类型的模块。

#### 配置 Loader

rules 配置模块的读取和解析规则，通常用来配置 loader。类型为 array，描述了如何处理部分文件，配置规则如下：

1. 条件配置：通过 test、include、exclude 三个配置项来命中需要 loader 处理的文件。
2. loader: 对命中的文件通过 use 配置来应用 loader，也可以给 loader 传递参数。
3. 重置顺序：一组 loader 处理顺序默认是从右往左执行的，可以通过 enforce 选项让其中一个 loader 最前或最后

下面我们通过例子来说明一下：

```javascript
module: {
 rules: [
   {
      // 通过正则命中 js 文件
      test: /\.js$/,
      // 使用 babel-loader 转换 js 文件
      // ?cacheDirectory 表示给 babel-loader 传递参数，用于缓存 babel 编译结果加快重新编译速度
      use: ['babel-loader?cacheDirectory'],
      // 只处理 src 中的 js 文件
      include: path.resolve(__dirname, 'src')
    }
  ]
}

// 传递给 loader 的参数可以是 object
module: {
 rules: [
   {
      // 通过正则命中 js 文件
      test: /\.js$/,
      // 使用 babel-loader 转换 js 文件
      // ?cacheDirectory 表示给 babel-loader 传递参数，用于缓存 babel 编译结果加快重新编译速度
       use: [{
           loader: 'babel-loader',
           options: {
               cacheDirectory: true,
           },
           // enforce: 'post' 表示该 loader 执行顺序放到最后
           // enforce: 'pre' 表示 loader 执行顺序放到最前面
           enforce: 'post'
       }],
      // 不处理 node_modules 中的 js 文件
      exclude: path.resolve(__dirname, 'node_modules')
    }
  ]
}

// test | include | exclude 可以是数组
module: {
 rules: [
   {
      test: [/\.js$/, /\.ts$/],
      include: [
          path.resolve(__dirname, 'pageOne'),
          path.resolve(__dirname, 'pageTwo')
      ],
       exclude: [
           path.resolve(__dirname, 'node_modules'),
           path.resolve(__dirname, 'bower_modules')
       ]
    }
  ]
}
```

#### noParse

noParse 用于忽略没有采用模块化的文件的递归解析和处理。例如，jquery、ChartJS 等：

```
// 正则匹配
noParse: /jquery|chartjs/

// webpack3.0 后支持函数
noParse: (content) => {
  // content 表示模块文件路径
  // return true or false
  return /jquery|chartjs/.test(content)
}
```



### Resolve

------

resolve 可以配置 webpack 如何去查找模块对应的文件。

#### alias

resolve.alias 配置通过别名，将原路径变为新路径：

```
resolve: {
  alias: {
    // import .. from 'react-native' 替换为 
    // import .. from 'react-native-web
    'react-native': 'react-native-web'
  }
}

// 可以通过 $ 缩小命中范围
resolve: {
  alias: {
    'react$': '/path/to/react.min.js'
  }
}
```



#### mainFields 

有些第三方模块会针对不同环境提供几分代码。例如，分别提供 es6 和 es5 2份代码：

```
{
  "jsnext:main": "es/index.js", // 采用 es6 语法入口文件
  "main": "lib/index.js" // 采用 es5 语法入口文件
}
```

webpack 会根据 mainFields 配置去决定优先采用那份文件，默认值为：

```
mainFields: ['browser', 'main']
```

webpack 会根据数据里面的顺序去 package.json 文件里寻找，只会找到第一个。假如想采用 es6 的代码，应改配置为：

```
mainFields: ['jsnext:main', 'browser', 'main']
```



#### extensions

当导入的文件不带后缀时，webpack 会自动给文件匹配上后缀，然后查找文件是否存在，尝试后缀列表默认：

```
extensions: ['.js', '.json']
```

若你的 react 应用使用的是 jsx 后缀，可改配置为：

```
extensions: ['.jsx', '.js', '.json']
```



#### modules

配置 webpack 去哪找第三方模块，默认只会在 node_modules 找。若你的项目中有大量类似 import '../../componens/button' 这样的导入模块路径，可以这样配置：

```
modules: ['./src/components', 'node_modules']
```

然后通过 import 'button' 导入，提高开发效率。



### Plugins

------

plugin 用于扩展 webpack 的功能，社区有各种 plugin 几乎可以做任何构建相关的事情。

#### plugin 配置

plugin 配置很简单，将 plugin 的实例传入 plugins 即可。plugin 需要的参数可以通过 构造函数传入：

```
plugins: [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      wrarning: false,
      drop_console: false,
    }
  })
]
```



### DevServer

------

只有通过 DevServer 启动 webpack 时，devServer 选项才会生效，webpack 本身并不认识 devServer。

#### hot

devServer.hot 是否启用热模块替换功能。启用热模块替换后，将会在不刷新页面的情况下用新模块代替旧模块。

#### historyApiFallback

devServer.historyApiFallback 用于使用了 HTML5 History API 的单页应用。这类应用要求服务器针对任何命中的路由都返回同一个 HTML 文件：

```
historyApiFallback: true
```

若有多个单页应用：

```
historyApiFallback: {
  rewrites: [
    {from: /^\/user/, to: 'user.html'},
    {from: /^\/game/, to: 'game.html'},
    {from: /./, to: 'index.html'}
  ]
}
```

#### https

DevServer 默认使用 HTTP，但是当你使用 HTTP/2 和 Service Worker 必须使用 https:

```
devServer: {
  https: true
}
```

#### open

devServer.open 配置是否在第一次启动时在默认浏览器上打开开发网页。



### 其他配置项

------

除了上面的配置项，webpack 还提供了一些零散的配置项。下面介绍几个常用的。

#### Target

js 的应用场景越来越多，webpack 可以根据不同环境构建出不同的代码：

| target值        | 描述                                       |
| :-------------- | :----------------------------------------- |
| web             | 针对浏览器（默认），所有代码集中在一个文件 |
| node            | 针对 nodejs，使用 require 语句加载 chunk   |
| async-node      | 针对 nodejs，异步加载 chunk                |
| webworker       | 针对 webworker                             |
| electron-main   | 针对 electron 主线程                       |
| electron-render | 针对 electron 渲染线程                     |
|                 |                                            |

例如，当设置 target: 'node' 时，require('fs') 就不会将 fs 模块导入 chunk，更详细的介绍请看另一篇文章：webpack之react同构应用。

#### Devtool

配置 webpack 如何生成 Source Map，方便进行代码调试。默认值为 false，即不生成 Source Map，可以这样配置：

```
devtool: 'source-map'
```



#### extenals

extenals 告诉 webpack 哪些模块不用被打包进去，而是由外部环境提供，例如，当 html 文件中有：

```
<script src="/path/to/jquery.js"></script>
```

可以这样配置，防止页面加载两份 jquery 文件（url 一份，打包一份）：

```
externals: {
  // 把导入语句里的 jquery 替换成运行环境的全局变量 jQuery
  jquery: 'jQuery'
}
```



### 导出多种配置

------

通常需要从一份源码中构建出多份代码（开发环境、线上环境）等，但是之间的配置又很相似，如果写两份配置文件，则需要维护两份配置文件，工作量大，还容易出错，这时可以导出一个 Function，通过一个配置文件完成要求：

```javascript
const path = require('path');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');

module.exports = function (env = {}, argv) {
  const plugins = [];

  const isProduction = env['production'];

  // 在生成环境才压缩
  if (isProduction) {
    plugins.push(
      // 压缩输出的 JS 代码
      new UglifyJsPlugin()
    )
  }

  return {
    plugins: plugins,
    // 在生成环境不输出 Source Map
    devtool: isProduction ? undefined : 'source-map',
  };
}
```



### 参考链接

------

深入浅出 webpack： http://webpack.wuhaolin.cn/

webpack 中文官网： https://doc.webpack-china.org/configuration/