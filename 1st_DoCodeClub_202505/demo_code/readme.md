欢迎使用笃小实AGI!
运行指南如下

1. 安装依赖
运行 `pip install -r .\requirement.txt`

2. 申请API
~~本项目用的 deepseek V3 的 API~~
~~可以在网址：https://platform.deepseek.com/api_keys 中申请自己的APIkeys，非常便宜方~~便。
本项目用的清华 deepseek 的 API
可以在网址：https://madmodel.cs.tsinghua.edu.cn/ 中，右下角“API使用指南”，复制token。（每次登录后，token的有效期为5个小时）
或者可以联系项目作者:caoye541@gmail.com，借用作者API来完成项目实践

1. 配置API环境文件
添加`.env`文件
在文件中输入：
```
DEEPSEEK_API_KEY= your api_keys
SECRET_KEY= anything if you want (i write my studentNum)
```

1. 运行
在命令行中输入：`python app.py`
并点击其中的网址：`http://127.0.0.1:5000`，即可访问！
值得一提的是：WARNING: This is a development server. 是因为我们用的是用于开发的flask，属于轻量级的网页服务，所以会有一些警告，但是无所谓

1. 有任何疑问欢迎在issue区留言
