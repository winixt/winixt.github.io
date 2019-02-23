
# 用法

## hexo 使用

### init

$ hexo init [folder]
新建一个网站。如果没有设置 folder ，Hexo 默认在目前的文件夹建立网站。

### new

$ hexo new [layout] <title>
新建一篇文章。如果没有设置 layout 的话，默认使用 _config.yml 中的 default_layout 参数代替。如果标题包含空格的话，请使用引号括起来。

### generate

$ hexo generate | hexo g
生成静态文件。

选项描述
-d, --deploy 文件生成后立即部署网站
-w, --watch 监视文件变动

### publish

$ hexo publish [layout] <filename> | hexo p
发表草稿。

### server

$ hexo server
启动服务器。默认情况下，访问网址为： http://localhost:4000/。

选项描述
-p, --port 重设端口
-s, --static 只使用静态文件
-l, --log 启动日记记录，使用覆盖记录格式

### deploy

$ hexo deploy | hexo d
部署网站。

参数描述
-g, --generate 部署之前预先生成静态文件
该命令可以简写为：
