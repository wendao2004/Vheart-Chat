# Vheart-Chat

一款基于 uni-app + Vue 3 + TypeScript 构建的全栈式跨平台仿微信移动应用。

![版本](https://img.shields.io/badge/version-1.2.3-blue)
![平台](https://img.shields.io/badge/platform-H5%7CAndroid%7CiOS-green)
![许可证](https://img.shields.io/badge/license-MIT-orange)

## 功能特点

- **聊天系统** - 与好友进行实时消息交流，支持文本和媒体消息
- **联系人管理** - 添加好友、好友请求管理、联系人组织
- **发现页面** - 音乐播放器、动漫浏览等娱乐功能
- **个人主页** - 个人信息管理与设置
- **音乐播放器** - 内置音乐播放功能及播放列表支持
- **跨平台支持** - 支持 H5、Android、iOS 等多平台运行

## 技术栈

### 前端
- **框架**: [uni-app](https://uniapp.dcloud.io/) (Vue 3)
- **语言**: TypeScript
- **状态管理**: Composition API + 响应式模型
- **样式**: SCSS/uni.scss

### 后端
- **云服务**: uniCloud (DCloud)
- **认证系统**: JWT 身份验证
- **数据库**: JSON 数据库及 schema 验证

## 项目结构

```
Vheart-Chat/
├── common/                 # 公共组件和工具
│   ├── tabbar/            # 底部导航栏组件
│   └── utils/            # 辅助函数
├── core/                  # 核心业务逻辑
│   ├── bean/             # 数据模型
│   ├── data/             # 数据定义
│   ├── model/            # 业务模型 (use-xxx-model.ts)
│   ├── net/              # 网络 API
│   └── services/         # 服务层
├── pages/                 # 页面组件
│   ├── chat/             # 聊天列表页面
│   ├── chat-detail/      # 聊天详情页面
│   ├── contact/          # 联系人页面
│   ├── discover/         # 发现页面
│   ├── profile/          # 个人主页
│   ├── music-index/      # 音乐播放器
│   ├── player/           # 全屏播放器
│   └── ...
├── static/               # 静态资源
├── uniCloud-alipay/      # 云函数
│   └── cloudfunctions/   # 后端 API 函数
│       ├── Api-Auth/     # 认证 API
│       ├── Api-Vheart-Chat/  # 聊天 API
│       └── ...
└── uni_modules/          # uni-app 插件
```

## 快速开始

### 环境要求

- Node.js 16+
- HBuilderX（推荐）或 VS Code 配合 uni-app 插件
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/Vheart-Chat.git

# 安装依赖
npm install
```

### 开发

在 HBuilderX 中打开项目，选择目标平台运行：

```bash
# H5
npm run dev:h5

# Android
npm run dev:app-android

# iOS
npm run dev:app-ios
```

### 构建

```bash
# 构建 Android
npm run build:app-android

# 构建 iOS
npm run build:app-ios

# 构建 H5
npm run build:h5
```

## 配置说明

### manifest.json

`manifest.json` 中的关键配置：

- `appid`: 应用标识符
- `versionName` / `versionCode`: 版本信息
- `modules`: 需要的原生模块（Push 等）
- `distribute`: Android/iOS 发布配置

### 云函数部署

运行应用前需要将云函数部署到 uniCloud：

1. 在 HBuilderX 中打开 `uniCloud-alipay` 目录
2. 右键点击 `cloudfunctions` 文件夹
3. 选择"部署到云端空间"

## 截图预览

| 微信 | 联系人 | 发现 | 我的 |
|------|--------|------|------|
| ![微信](./static/Chat.png) | ![联系人](./static/Contacts.png) | ![发现](./static/Discover.png) | ![我的](./static/Profile.png) |

## 贡献代码

欢迎提交 Pull Request！

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m '添加某个很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开源许可

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [uni-app](https://uniapp.dcloud.io/) - 跨平台开发框架
- [DCloud](https://www.dcloud.io/) - 云服务与开发工具
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
