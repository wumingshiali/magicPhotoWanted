# Magic Photo · 通缉令生成器

一个完全本地的通缉令海报生成器。选择照片、填写档案信息、挑选预设，即可在本地合成 1200 × 1600 的高清 PNG 海报。

- 照片不上传，不写入本地存储，关闭应用即清除。
- 不调用任何服务器、AI 接口或 CDN，运行时零网络请求。
- 支持 Windows、macOS、Linux 桌面版，以及 Android、iOS 移动版。
- 另提供单文件离线网页版，以及实验性的 OpenHarmony ArkTS 壳。

## 直接使用

Windows 与 Android 成品位于 [`release/`](release/)：

| 文件 | 说明 |
| --- | --- |
| `MagicPhoto-1.0.0-portable.exe` | 免安装便携版 |
| `MagicPhoto-1.0.0-setup.exe` | 安装版（当前用户） |
| `MagicPhoto-1.0.0-Android.apk` | Android 7.0+ arm64，使用调试证书签名，可直接安装测试 |
| `MagicPhoto-Offline.html` | 单文件离线网页版 |

Android APK 仅用于本地安装测试；上架应用商店或公开分发前，请在 Android Studio 中配置自己的签名。macOS / Linux / iOS 需要按 [docs/跨平台构建.md](docs/跨平台构建.md) 在对应系统构建；仓库已包含全部平台配置和移动端工程。

详细使用说明见 [docs/使用说明.md](docs/使用说明.md)。

## 开发

```bash
npm install
npm run package   # 构建当前平台安装包并整理到 release/
npm run dev       # Tauri 开发模式
npm run offline-html
```

桌面端需要 Node.js、Rust 和对应平台的系统 WebView；移动端还需要 Android SDK/NDK 或 Xcode。完整依赖见 [docs/跨平台构建.md](docs/跨平台构建.md)。

## 技术说明

- 桌面壳：Tauri 2（Rust + 系统 WebView），Windows 安装包约 1.3 MB，便携版约 3.6 MB。
- 移动端：Tauri 2 Android/iOS 工程，使用系统 WebView，不引入额外浏览器内核；Android APK 约 6.3 MB。
- 保存：Tauri dialog + fs 插件调用各平台原生保存界面；Android 使用 SAF，iOS 使用文档选择器。
- OpenHarmony：ArkTS `Web` 组件 + `javaScriptProxy` 桥接系统文档选择器，实验性支持。
- 源页面仍是单个 `index.html`；构建时将三份 WinUI 样式内联，生成完全自包含的 `dist/index.html`。
- 海报绘制完全由 Canvas 2D 完成，四种预设：简洁、玄凤鹦鹉、WinUI 3、复古。

## 许可

[MIT](LICENSE)。本工具仅供娱乐创作，请勿用于伪造证件、骚扰他人或其他违法用途。
