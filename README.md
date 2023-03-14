# auto_xuexiqiangguo

# auto_xuexiqiangguo 是一款自动化学习工具 每天可达满分（支持四人赛、双人赛对战）

### 一、项目介绍

本项目是对https://github.com/dundunnp/auto_xuexiqiangguo 的扩展，使用python去截图模拟器的方法实现了四人赛、双人赛的对战功能
1. 安装安卓模拟器，安装学习强国和hamibot
2. 使用Python启动一个web服务，对外提供一个接口，当有请求进来的时候，自动去截取模拟器的当前界面，把图片上传到百度ocr，把获取到的文本返回
3. 修改hamibot脚本，把原本的截图功能代码去掉（学习强国新版已经禁止对战中截图），把请求百度ocr的接口换成请求Python服务的接口

## 二、项目运行

1、clone仓库代码，修改main方法中的配置信息

2、安装Python 3.10

3、双击run.bat
