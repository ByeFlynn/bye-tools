# ByeTools

ByeTools 是一个免登录、本地优先的开发者工具箱。当前版本按产品原型提供 49 个工具入口，并实现主题、搜索、分类、收藏、历史、IndexedDB 持久化、离线缓存和响应式工作台。
## 演示效果
![浅色](assert/%E6%B5%85%E8%89%B2.png)
![深色](assert/%E6%B7%B1%E8%89%B2.png)
![全部工具](assert/%E5%85%A8%E9%83%A8%E5%B7%A5%E5%85%B7.png)
## 本地开发

```bash
npm ci
npm run dev
```

开发地址为 `http://127.0.0.1:4173/`。

## 文件工具

文件工具分类包含图片工具、Favicon 生成器和 PDF 工具。图片工具在同一个工作台内切换压缩、尺寸调整、可视化裁剪、格式转换和 Base64 互转；裁剪模式支持拖动裁剪框、八方向缩放、方向键微调、自由/原始/常用比例、自定义比例、旋转、翻转、矩形与多种形状，以及导出尺寸设置。Favicon 支持多尺寸 PNG、`favicon.ico` 和 HTML 引用片段生成。PDF 工具在同一个工作台内切换合并、拆分、水印、页面整理和转图片，文件均在本地处理。

## 编码转换工具

编码转换分类新增二维码与条形码工作台，在同一个工作台内切换二维码生成、二维码识别、条形码生成和条形码识别。二维码支持纠错等级、边距、尺寸和颜色设置；条形码支持 Code 128、Code 39、EAN、UPC、ITF-14、Codabar 等格式。图片识别使用本地 ZXing 解析，生成和识别均不会上传文件。

## Markdown 编辑器

Markdown 编辑器支持 Markdown 工具栏、行号、实时预览、标题/列表/引用/代码/链接等常用语法。点击“打开文件”可以读取当前设备上的 `.md`、`.markdown` 或 `.txt` 文件继续编辑；文件名会自动带上 Markdown 扩展名。点击“保存”或使用 `Ctrl+S` / `⌘S` 会将当前内容下载为 Markdown 文件，编辑草稿会同步保存在本地存储中。

如果需要根据 `package.json` 更新依赖，可以使用 `npm install`。首次运行 Playwright 且本机没有浏览器组件时，可执行 `npx playwright install`。

项目的详细构建、启动、测试和打包说明见：[项目构建启动打包说明.md](./项目构建启动打包说明.md)。

## 验证

```bash
npm run build
npm test
```

## 桌面开发与构建

桌面版使用 Tauri 2 + Rust，统一通过 SQLCipher SQLite 保存设置、收藏、最近工具、历史、草稿和加密配置。数据库密钥与应用层 AES-256-GCM 密钥分别保存在当前系统凭证存储中，前端只能调用白名单命令，不能访问数据库文件或执行 SQL。

```bash
npm run tauri:dev
npm run tauri:build
```

Windows 构建 SQLCipher 的 vendored OpenSSL 需要 Perl、Visual Studio C++ Build Tools 和 WebView2。构建产物位于 `src-tauri/target/release/bundle/`。桌面版启动失败时会拒绝回退到明文 SQLite，并返回结构化错误码。

桌面端加密配置命令固定为 `crypto_config_list`、`crypto_config_save`、`crypto_config_apply`、`crypto_config_update`、`crypto_config_delete`、`crypto_config_migrate` 和 `crypto_config_rotate_key`。配置列表只返回掩码摘要，完整正文仅在应用或编辑操作中按需解密。

SHA-3 已通过 `js-sha3` 在本地执行，支持 SHA3-256、SHA3-384 和 SHA3-512。SM2、SM3、SM4 已通过 `sm-crypto` 在本地执行：SM2 支持 C1C3C2 加解密，SM3 支持摘要输出，SM4 支持 ECB/CBC 及 PKCS#7、NoPadding。SM4 的 CTR、CFB、OFB 仍会明确显示暂不支持，不会生成伪造结果。AES、SHA-2 及其他纯浏览器工具同样在本地执行，工具输入不会上传服务器。

## 项目结构

| 路径 | 作用 |
| --- | --- |
| `app.js` | 工具目录、页面渲染、交互和工具逻辑 |
| `styles.css` | 页面样式和响应式布局 |
| `index.html` | 前端入口页面 |
| `storage.js` | 浏览器端本地存储适配层 |
| `tests/e2e/` | Playwright 端到端测试 |
| `tests/visual/` | 视觉回归截图脚本 |
| `src-tauri/` | Tauri 和 Rust 桌面端工程 |
| `src-tauri/tauri.conf.json` | Tauri 窗口、前端资源和安装包配置 |
| `src-tauri/src/` | Rust 命令、存储、凭证和加密实现 |
| `dist/` | 前端生产构建输出 |
| `src-tauri/target/release/` | Rust Release 编译输出 |
| `src-tauri/target/release/bundle/` | MSI、NSIS 等桌面安装包输出 |

所有命令都应在项目根目录执行。PowerShell 进入项目目录：

```powershell
Set-Location 'D:\AI\codeing\byeTools\project-code'
```

## 环境要求

### 前端环境

- Node.js 和 npm，建议使用当前维护中的 Node.js LTS 版本。
- Chrome。Playwright 配置默认使用 `C:\Program Files\Google\Chrome\Application\chrome.exe`。

检查版本：

```powershell
node --version
npm --version
```

### Tauri 桌面环境

- Rust stable 工具链和 Cargo。
- Visual Studio C++ Build Tools，包含 MSVC 和 Windows SDK。
- WebView2 Runtime。
- Perl。当前 SQLCipher 的 vendored OpenSSL 构建需要 Perl。

检查 Rust：

```powershell
rustc --version
cargo --version
rustup show
```

如果没有 Rust，安装 `rustup` 后执行：

```powershell
rustup default stable
```

## 前端开发、构建与预览

### 启动开发服务器

```powershell
npm run dev
```

Vite 默认监听 `127.0.0.1:4173`。修改 `app.js`、`styles.css` 或 `index.html` 后，浏览器通常会自动热更新。停止服务时，在终端按 `Ctrl+C`。

临时指定端口：

```powershell
npm run dev -- --port 4174
```

让局域网设备访问：

```powershell
npm run dev -- --host 0.0.0.0
```

Tauri 默认连接 `http://127.0.0.1:4173`，修改端口后需要同步修改 `src-tauri/tauri.conf.json`。

### 构建前端生产资源

```powershell
npm run build
```

生产资源生成在 `dist/`。构建成功后可使用预览服务器检查生产资源：

```powershell
npm run preview
```

预览地址默认仍为 `http://127.0.0.1:4173/`，也可以使用 `npm run preview -- --port 4174` 指定端口。

## Tauri 桌面开发

### 启动桌面开发模式

```powershell
npm run tauri:dev
```

该命令会自动启动 Vite，然后由 Tauri 连接开发地址并编译 Rust 开发版本。桌面窗口默认标题为 `ByeTools 开发者工具箱`，初始尺寸为 `1440 × 900`，最小尺寸为 `390 × 640`。

停止时在运行命令的终端按 `Ctrl+C`，并确认桌面窗口已关闭。修改前端通常会热更新，修改 Rust 文件会触发 Rust 重新编译。

### 桌面端存储和加密说明

桌面端使用 SQLCipher SQLite 保存设置、收藏、最近工具、历史、草稿和加密配置。数据库密钥与应用层 AES-256-GCM 密钥分别保存在当前系统凭证存储中，前端只能调用白名单命令，不能直接访问数据库文件或执行 SQL。

桌面端加密配置命令包括：`crypto_config_list`、`crypto_config_save`、`crypto_config_apply`、`crypto_config_update`、`crypto_config_delete`、`crypto_config_migrate` 和 `crypto_config_rotate_key`。配置列表只返回掩码摘要，完整正文仅在应用或编辑操作中按需解密。

## 测试和质量验证

### Playwright 端到端测试

运行全部测试：

```powershell
npm test
```

测试配置会自动启动或复用 `http://127.0.0.1:4173` 的开发服务器，并覆盖桌面端 `1440 × 900` 和移动端 `390 × 844` 两种视口。

按名称筛选测试：

```powershell
npx playwright test tests/e2e/app.spec.js --grep "URL 和 HTML 工具卡片显示正确图标"
```

只运行桌面端：

```powershell
npx playwright test --project="桌面端"
```

只运行移动端：

```powershell
npx playwright test --project="移动端"
```

调试测试：

```powershell
npx playwright test tests/e2e/app.spec.js --debug
```

Playwright UI 模式：

```powershell
npm run test:ui
```

### 视觉测试

```powershell
npm run test:visual
```

视觉脚本位于 `tests/visual/capture.mjs`，截图输出到 `test-results/visual/`。运行前应确保 `http://127.0.0.1:4173` 可访问。

### Rust 测试

```powershell
npm run test:rust
```

该命令等价于：

```powershell
cargo test --manifest-path src-tauri/Cargo.toml
```

如果修改了前端页面，至少执行：

```powershell
npm run build
npm test
```

如果修改了 `src-tauri`、数据库、凭证或 Tauri 命令，建议执行完整验证：

```powershell
npm run build
npm test
npm run test:rust
```

## Release 构建和桌面打包

### 一键打包

```powershell
npm run tauri:build
```

该命令会先执行 `npm run build`，然后编译 Rust Release 版本，并根据 `src-tauri/tauri.conf.json` 中的 `targets: "all"` 生成 Windows 桌面产物。

### 产物路径

桌面可执行文件：

```text
src-tauri/target/release/byetools.exe
```

MSI 安装包：

```text
src-tauri/target/release/bundle/msi/ByeTools_0.1.0_x64_en-US.msi
```

NSIS 安装包：

```text
src-tauri/target/release/bundle/nsis/ByeTools_0.1.0_x64-setup.exe
```

版本号或架构变化时，安装包文件名会相应变化。查看最新产物：

```powershell
Get-Item 'src-tauri/target/release/byetools.exe'
Get-ChildItem 'src-tauri/target/release/bundle' -Recurse -File
```

直接运行 Release 程序：

```powershell
& '.\src-tauri\target\release\byetools.exe'
```

### 打包后验证

1. 直接运行 `byetools.exe`，确认窗口和页面可以正常打开。
2. 安装 NSIS 安装包，验证安装、启动和卸载。
3. 安装 MSI 安装包，验证安装目录、快捷方式和卸载。
4. 在干净用户数据环境中验证首次启动、主题、收藏、历史和加密配置。
5. 验证 URL、HTML、密码、加密和摘要等常用工具的页面交互。

### 版本和图标配置

发布新版本时，应同步检查以下版本字段：

- `package.json` 的 `version`。
- `src-tauri/tauri.conf.json` 的 `version`、`productName` 和 `identifier`。
- `src-tauri/Cargo.toml` 的 Rust 包版本。

安装包图标由 `src-tauri/tauri.conf.json` 的 `bundle.icon` 指定，Windows 主图标为 `src-tauri/icons/icon.ico`。发布后不要随意修改 `identifier`，否则系统可能将其识别为新的应用。

## 端口、进程和缓存处理

检查 `4173` 端口：

```powershell
Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
```

查看端口占用进程：

```powershell
$connection = Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
if ($connection) { Get-Process -Id $connection.OwningProcess }
```

确认是本项目进程后，再按实际进程号结束：

```powershell
Stop-Process -Id 12345
```

关闭 ByeTools 桌面程序：

```powershell
Get-Process byetools -ErrorAction SilentlyContinue | Select-Object Id,Path
Stop-Process -Name byetools -ErrorAction SilentlyContinue
```

如果构建缓存疑似损坏，可清理 Rust 缓存后重新打包：

```powershell
npm run build
cargo clean --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```

`cargo clean` 会删除 Rust 构建缓存，下一次构建会重新编译依赖，耗时会增加。

## 常见问题

### 页面打不开或显示旧版本

确认开发服务器地址为 `http://127.0.0.1:4173/`，检查 `npm run dev` 是否仍在运行并执行浏览器强制刷新。验证 Release 程序时，需要重新执行 `npm run tauri:build` 并重启 `byetools.exe`。

### 4173 端口被占用

停止旧的 Vite、Preview 或测试服务器，或者临时使用其他端口。Playwright 和 Tauri 使用固定端口时，启动参数和配置必须保持一致。

### Playwright 找不到 Chrome

Playwright 默认使用 `C:\Program Files\Google\Chrome\Application\chrome.exe`。如果 Chrome 安装在其他路径，应修改 `playwright.config.js` 的 `launchOptions.executablePath`。

### Tauri 打包提示 Rust、MSVC、WebView2 或 Perl 错误

检查 `rustc --version`、`cargo --version` 是否可用，确认 Visual Studio C++ Build Tools 包含 MSVC 和 Windows SDK，确认 WebView2 Runtime 和 Perl 已安装并在 `PATH` 中。

### OpenSSL 缺少 PDB 警告

Release 链接时可能出现 `LNK4099`。这是链接警告，不等于构建失败。应以命令最后是否出现 `Finished ... bundles at`，以及 MSI、NSIS 文件是否生成作为成功判断依据。

### 打包提示文件被占用

先关闭桌面程序并确认没有残留 `byetools` 进程，再重新执行：

```powershell
npm run tauri:build
```

## 发布前检查清单

- [ ] `npm ci` 或 `npm install` 成功。
- [ ] `npm run build` 成功。
- [ ] `npm test` 全部通过。
- [ ] 修改 Rust、数据库或凭证逻辑时，`npm run test:rust` 成功。
- [ ] `npm run tauri:build` 成功。
- [ ] `src-tauri/target/release/byetools.exe` 可以启动。
- [ ] MSI 和 NSIS 安装包均可安装、启动和卸载。
- [ ] 桌面端和移动端没有明显溢出或交互异常。
- [ ] 发布包中没有调试文件、临时截图或测试数据。

## npm 脚本速查

| 目的 | 命令 |
| --- | --- |
| 安装锁定依赖 | `npm ci` |
| 启动浏览器开发 | `npm run dev` |
| 构建前端资源 | `npm run build` |
| 预览生产资源 | `npm run preview` |
| 启动 Tauri 桌面开发 | `npm run tauri:dev` |
| 运行 Playwright 测试 | `npm test` |
| 打开 Playwright UI | `npm run test:ui` |
| 运行视觉测试 | `npm run test:visual` |
| 运行 Rust 测试 | `npm run test:rust` |
| Release 打包 | `npm run tauri:build` |
