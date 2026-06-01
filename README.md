# 家务积分表 APK

将家务积分表 HTML 单页应用打包为 Android APK。

## 🚀 GitHub Actions 自动构建（推荐）

代码推送到 GitHub 后，**自动构建 APK**，无需本地安装任何东西。

### 快速开始

1. 在 GitHub 创建新仓库（如 `chores-apk`）
2. 把本目录所有文件推送到仓库：
   ```bash
   git init
   git add .
   git commit -m "家务积分表 Cordova 项目"
   git remote add origin https://github.com/你的用户名/chores-apk.git
   git push -u origin main
   ```
3. GitHub 自动开始构建（Actions 标签页可查看进度）
4. 构建完成后，在 **Actions → 最新运行 → Artifacts** 下载 APK

之后每次修改 `www/index.html` 并推送，GitHub 会自动重新构建 APK。

## 本地构建（备选）

### 准备工作（一次性）

### 1. 安装 Java JDK 17+
下载并安装：https://adoptium.net/download

安装后验证：
```cmd
java -version
```

### 2. 安装 Android Studio（可选但推荐）
下载：https://developer.android.com/studio

安装后设置环境变量：
```cmd
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
```

如果不想装 Android Studio，也可以只装 Android SDK 命令行工具：
https://developer.android.com/studio#command-line-tools-only

### 3. 安装 Gradle（可选）
Cordova 会自动下载 Gradle，但如果网络不好可以手动安装：
https://gradle.org/releases/

## 构建 APK

双击运行 `build-apk.bat`，或在命令行执行：

```cmd
cd C:\Users\Administrator\Desktop\家务积分表-apk
build-apk.bat
```

脚本会自动：
1. 安装 npm 依赖（cordova-android）
2. 生成应用图标
3. 添加 Android 平台
4. 构建调试版 APK

## 输出

```
platforms\android\app\build\outputs\apk\debug\app-debug.apk
```

## 安装到手机

1. 将 APK 文件传到手机（USB / 微信 / QQ / 网盘）
2. 在手机「设置 → 安全」中开启「允许安装未知来源应用」
3. 点击 APK 文件安装

## 自定义图标

替换 `res/icon/` 目录下的 PNG 文件，然后重新构建：

| 文件 | 尺寸 |
|------|------|
| icon-48.png | 48×48 |
| icon-72.png | 72×72 |
| icon-96.png | 96×96 |
| icon-144.png | 144×144 |
| icon-192.png | 192×192 |

推荐在线生成图标：https://www.appicon.co

## 签名发布版 APK（可选）

生成签名密钥：
```cmd
keytool -genkey -v -keystore housework.keystore -alias housework -keyalg RSA -keysize 2048 -validity 10000
```

构建签名 APK：
```cmd
npx cordova build android --release -- --keystore=housework.keystore --alias=housework
```

## 项目结构

```
家务积分表-apk/
├── config.xml          # Cordova 配置
├── package.json        # npm 配置
├── build-apk.bat       # 一键构建脚本
├── generate-icons.js   # 图标生成器
├── README.md           # 本文件
├── www/
│   ├── index.html      # 应用主文件（PWA 增强版）
│   ├── manifest.json   # PWA 清单
│   ├── sw.js           # Service Worker（离线支持）
│   ├── icon-192.png    # PWA 图标
│   └── icon-512.png    # PWA 大图标
└── res/
    └── icon/           # Cordova 图标（各尺寸）
```
