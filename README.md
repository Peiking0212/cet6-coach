# 六级陪练 · CET-6 Coach

一个手机/平板浏览器随时可用的纯前端 **PWA**，覆盖六级**听力 / 翻译 / 阅读 / 作文**四大模块，内置示例真题与预测题，按答题表现智能推荐"适合我的内容"，并可接入兼容 OpenAI 格式的 AI（OpenAI / DeepSeek / 通义 / 智谱 / Kimi）做错题讲解、作文批改与陪聊答疑。

- React + Vite + TypeScript，零后端，所有进度 / 积分 / 错题 / AI 配置都存浏览器 `localStorage`。
- 移动端优先，粉色系主题 + 暗色模式，支持"添加到主屏幕"离线打开。

## 运行

```bash
npm install
npm run dev      # 开发模式，默认 http://localhost:5173
```

构建与本地预览：

```bash
npm run build    # 产物在 dist/
npm run preview  # 本地预览生产构建
```

在手机上使用：电脑和手机连同一 WiFi，用 `npm run dev -- --host` 启动，手机浏览器打开电脑局域网 IP:5173，再"添加到主屏幕"。

## 模块一览

- **听力**：短新闻 / 对话 / 讲座文本，用浏览器 `SpeechSynthesis` 朗读，支持语速调节、逐句点读、重听；先听写后做选择题，再对照原文。数据保留 `audioUrl` 字段，后续可导入真实音频。
- **翻译**：三关进阶 —— **重点词填空 → 整句翻译 → 全文翻译**。含「二十四节气」「中国茶文化」等文化类与「数字经济」「新能源汽车」等经济/科技预测题。
- **阅读**：**仔细阅读**（选择题 + 逐题解析）+ **选词填空**（词库选词 + 逐空解析），单关计时。
- **作文**：题目 + 评分维度 + 写作提纲 + 字数统计 + **AI 批改**（总分 / 维度评分 / 逐句修改建议 / 升级表达 / 范文）+ 内置参考范文。

## 趣味化机制

- 关卡进阶、星级评定、连击 combo、每日目标进度环、积分与等级。
- 首页**自适应推荐**：按各题型正确率与练习时间计算薄弱点，优先推荐该练的模块。
- **错题复习队列**：答错自动入队，按简易间隔重现（SRS）定时提醒复习。

## AI 配置（Key 存哪里）

进入 **设置** 页面填写：

- **Base URL**：如 `https://api.deepseek.com/v1`（页面内置 OpenAI / DeepSeek / 通义 / 智谱 / Kimi 一键预设）。
- **API Key**：你的密钥，**仅保存在本机浏览器 localStorage，绝不硬编码、绝不预填、不会上传任何服务器**。
- **Model**：如 `deepseek-chat`、`gpt-4o-mini` 等。

填好后可点「测试连接」验证。AI 用于：错题一键讲解、作文批改、答疑陪聊。不配置 AI 完全不影响刷题。

## 可选：本地 CORS 代理

部分国内厂商对浏览器直连有 CORS 限制。若「测试连接」报网络/CORS 错误，可启动内置极简代理：

```bash
npm run proxy        # 默认 http://localhost:8787
```

然后在 **设置 → 本地代理地址** 填入 `http://localhost:8787`，请求会经由本地代理转发。代理仅允许上述几家厂商域名，且只用于本地个人使用。

## 目录结构

```
src/
  app/         外壳布局、侧栏 / 底部导航、主题、图标、路由
  components/  通用组件（MCQ、计时进度条、AI 讲解、Markdown、结果页等）
  engine/      做题引擎：计时、判分结果类型
  store/       进度 / 积分 / 连击 / 复习队列（localStorage）+ 自适应推荐
  data/        内置题库 JSON（translation / reading / listening / writing）+ 类型定义
  modules/     四大模块页面与做题流程
  ai/          统一 OpenAI 兼容客户端 + 提示词
  styles/      全局 / 组件 / 页面样式
proxy/         可选本地 CORS 代理（npm run proxy）
```

## 扩展题库

编辑 `src/data/*.json`，字段含义见 `src/data/types.ts`。听力可在对应条目填写 `audioUrl` 接入真实音频（接口已预留）。

### 导入本地六级真题（个人学习材料）

从本地文件夹导入 PDF 真题、答案速查与听力 MP3（不提交 PDF/音频到 git）：

```bash
npm run import:exam
# 或指定目录：
node scripts/import-exam.mjs --source "E:/BaiduNetdiskDownload/2024年6月六级真题和答案"
```

默认源目录见 `scripts/import-exam.mjs` 中的 `DEFAULT_SOURCE`。脚本会：

- 从 PDF 解析听力选择题、写作题、翻译、部分阅读（仔细阅读等）
- 将已下载的 MP3 复制到 `public/audio/exams/2024-06/`（已在 `.gitignore` 中忽略）
- 生成 `src/data/exams/2024-06.json` 元数据与题目

导入后刷新或 `npm run build`。各模块页顶部可选择 **全部 / 2024年6月真题 / 内置示例**。听力在存在 `audioUrl` 时优先播放真题录音，否则使用浏览器 TTS。

**注意：** 需先在百度网盘客户端完成 MP3 下载（勿保留 `.baiduyun.p.downloading` 后缀）。第 3 套官方说明听力与第 2 套相同。长篇阅读段落匹配、部分选词填空需对照扫描图手动补全。

导入后若缺参考译文、范文或听力官方答案，可再运行（会读取本机解析 PDF，不提交 PDF 到 git）：

```bash
npm run patch:exam      # 补全译文/范文/听力答案（见 scripts/patch-exam-supplements.mjs）
npm run sanitize:exam   # 清理页码水印、对齐翻译逐句英文
npm run audit:exam      # 检查缺答案、缺译文等
```

`patch:exam` 在重新 `import:exam` 之后需再执行一次，否则导入可能覆盖已补全的 2024-12 参考译文。

**2024年12月** 若只有 `E:\BaiduNetdiskDownload\2024年12月` 这一目录，典型结构为：

| 子目录 | 内容 | 应用中的效果 |
|--------|------|----------------|
| `01、真题PDF版（推荐使用）` | 三套可复制真题 PDF | 听力选项、阅读、写作题、翻译原文 |
| `02、答案解析` | 目前常见仅第 3 套解析 PDF（多为扫描图） | 扫描版无法自动提取听力答案 |
| `03、听力音频` | 需自行下载 MP3 | 下载后放入该目录，再 `npm run import:exam -- --exam-id 2024-12` |
| `2024.12翻译` | 翻译参考图（jpg） | 第 2、3 套译文已在应用内补全；第 1 套北斗译文见 `patch:exam` |

导入命令示例：

```bash
node scripts/import-exam.mjs --exam-id 2024-12 --source "E:\BaiduNetdiskDownload\2024年12月" --merge
npm run patch:exam
```

### 导入外部词库（个人学习材料）

可将本地 `.doc` / `.pdf` 或手动导出的 CSV / JSON 合并进应用词库。导入脚本**不会修改**内置精选 `vocabulary.json`（152 词及记忆技巧），而是生成独立 deck 文件供应用选择。

```bash
npm run import:vocab
```

默认读取路径（可在 `scripts/import-vocab.mjs` 的 `DEFAULT_SOURCES` 或 `--sources config.json` 中修改）：

| 来源 | 默认路径 | 输出 deck |
|------|----------|-----------|
| 六级乱序 DOC | `e:/download2/六级词汇表-乱序.doc` | `vocabulary-cet6-disordered.json` |
| 六级高频词汇 PDF | `e:/download2/赠-大学英语六级-高频词汇.pdf` | `vocabulary-highfreq.json` |
| 高频词组 PDF | `e:/download2/赠-英语六级高频词组.pdf` | `vocabulary-phrases-gift.json` |
| 百词斩词表 PDF | 远程 URL（可配置） | `vocabulary-bbdc-phrases.json` |

手动导入：

```bash
node scripts/import-vocab.mjs --csv path/to/words.csv
node scripts/import-vocab.mjs --json path/to/words.json
```

CSV 表头建议：`word,phonetic,pos,meaning,example,exampleCn`。

导入后重新 `npm run build`（或开发模式下刷新）。单词页顶部可选择 **精选词库 / 六级乱序 / 六级高频词汇 / 高频词组 / 百词斩词表**。

**格式提示：** 旧版 `.doc`（Word 97–2003）可直接解析；若仅有 `.docx` 也可用。无法解析的 PDF 可先在 Word / WPS 中「另存为」纯文本或 CSV 再导入。

> 版权：外部词表为个人学习材料，仅供本地 PWA 使用，请勿在公开仓库中再分发完整原文。

## 打包 Android APK（自用，离线听力 + 本地记录）

不上应用商店、仅自己平板/手机安装时，用 **Capacitor** 把网页和真题 MP3 打进 APK。学习进度仍走应用内 `localStorage`，与浏览器版一致。

### 前置条件

1. 安装 [Android Studio](https://developer.android.com/studio)（含 Android SDK）。
2. 本机已用 `import-exam` 导入过真题，且 `public/audio/exams/` 下有 MP3（该目录默认不进 Git，但会打进 APK）。

### 一键构建并同步到 Android 工程

```bash
npm install
npm run build:android
```

会依次：`tsc` → Vite 构建（`base=/`，关闭 PWA Service Worker）→ 复制 `public/audio/exams` 到 `dist` → `cap sync android`。

### Gradle 下载超时（国内常见）

若 Sync 报错 `Could not install Gradle distribution` / `Read timed out`：

1. 项目已默认改用腾讯云 Gradle 镜像；在 Android Studio 点 **File → Sync Project with Gradle Files** 重试。
2. 仍失败时，浏览器或迅雷下载：  
   https://mirrors.cloud.tencent.com/gradle/gradle-8.11.1-all.zip  
   然后在 Android Studio：**File → Settings → Build → Gradle → Gradle user home** 记下路径（一般为 `C:\Users\你的用户名\.gradle`）。  
   删除 `wrapper\dists\gradle-8.11.1-all` 下未下完的文件夹，把 zip 放进该目录里**唯一子文件夹**中（文件夹名是 Gradle 自动生成的乱码），文件名保持 `gradle-8.11.1-all.zip`，再 Sync。
3. 有 VPN/代理时也可在 **Settings → HTTP Proxy** 配置后，把 `gradle-wrapper.properties` 里的地址改回官方：  
   `https://services.gradle.org/distributions/gradle-8.11.1-all.zip`

### 在 Android Studio 出 APK

```bash
npm run cap:open
```

1. 等待 Gradle 同步完成。
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**。
3. 调试包路径一般为：`android/app/build/outputs/apk/debug/app-debug.apk`。
4. 传到平板安装，并允许「安装未知应用」。

正式长期使用可 **Build → Generate Signed Bundle / APK** 自签名（不必上架商店）。

### 更新应用内容后

改完代码或新导入听力后，重新执行：

```bash
npm run build:android
```

再在 Android Studio 里重新 Build APK。

### 说明

| 项目 | 说明 |
|------|------|
| **听力** | MP3 打进 APK；Android 上使用 **@capgo/native-audio**（可后台播放、通知栏控制）。浏览器/PWA 仍用 HTML5 `<audio>` |
| **记录** | Android 使用 **@capacitor/preferences** 持久化（关 App 再开不丢）；首次启动会把旧 `localStorage` 迁过去。设置里可导出 JSON 备份 |
| **AI / 代理** | 与 GitHub Pages 相同，需网络且可能受 CORS 限制；本地 `npm run proxy` 不会随 APK 运行 |
| **体积** | 多套真题 MP3 会使 APK 变大（几十 MB 以上属正常） |

新增依赖后若只改了 JS，执行 `npm run build:android` 会顺带 `cap sync`；若新装插件后 Android 编译报错，再执行一次 `npx cap sync android`。

与 **GitHub Pages** 构建互不影响：Pages 用 `npm run build:pages`，Android 用 `npm run build:android`。

## 部署到 GitHub Pages（手机随时打开）

将应用发布到 GitHub Pages 后，无需在电脑上跑 `npm run dev`，手机浏览器打开固定链接即可使用（可「添加到主屏幕」当 PWA）。

### 1. 创建仓库并推送代码

当前仓库默认分支为 **master**（也支持 **main**）。若尚未关联远程：

```bash
git init   # 若尚未初始化
git add .
git commit -m "Initial commit with GitHub Pages deploy"
git branch -M master
git remote add origin https://github.com/<你的用户名>/cet6-coach.git
git push -u origin master
```

仓库名须为 **`cet6-coach`**，这样站点路径才是 `https://<用户名>.github.io/cet6-coach/`。若改名，请在 GitHub Actions 工作流与本地 `VITE_BASE_PATH` 中同步修改 base 路径。

### 2. 在 GitHub 启用 Pages（必做，否则 deploy 会 404）

1. 打开仓库 **Settings → Pages**（例如 [Peiking0212/cet6-coach/settings/pages](https://github.com/Peiking0212/cet6-coach/settings/pages)）
2. **Build and deployment → Source** 选择 **GitHub Actions**（不要选 Deploy from a branch）
3. 保存后，向 `master`（或 `main`）推送，或在 **Actions** 中手动 **Re-run** 工作流

工作流 `.github/workflows/deploy.yml` 会 `npm ci`、`npm run build:pages` 并发布 `dist/`。

> **build 成功但 deploy 失败，日志含 `Failed to create deployment (status: 404)` 或 `Ensure GitHub Pages has been enabled`**：说明尚未完成本节的 Source 设置。这与代码无关，在 Settings 里选 **GitHub Actions** 后重新运行即可（Actions → 选中失败的工作流 → **Re-run all jobs**）。

首次部署可在 **Actions** 标签页查看「Deploy to GitHub Pages」是否成功。

### 3. 访问地址

```
https://<你的 GitHub 用户名>.github.io/cet6-coach/
```

例如用户名为 `Peiking0212` 时：`https://Peiking0212.github.io/cet6-coach/`

### 4. 添加到手机主屏幕

- **iPhone（Safari）**：打开上述链接 → 分享 → **添加到主屏幕**
- **Android（Chrome）**：打开链接 → 菜单 → **添加到主屏幕** / **安装应用**

离线时仍可打开已缓存的页面与题库；首次访问需联网加载。

### 5. 本地验证生产构建

模拟 GitHub Pages 的 base 路径：

```bash
npm run build:pages
npm run preview -- --base /cet6-coach/
```

浏览器访问提示的 preview 地址（路径含 `/cet6-coach/`）。

### 6. 部署后注意事项

| 项目 | 说明 |
|------|------|
| **API Key** | 仍在手机端 **设置** 里填写，保存在本机 `localStorage`，不会上传 GitHub |
| **CORS / AI 调用** | 浏览器直连各厂商 API 可能因 CORS 失败；GitHub Pages 上无法使用本项目的 `npm run proxy`（那是本地 Node 服务）。可选：使用支持浏览器跨域的 API、自建云端代理、或仅在能直连的网络环境下使用 AI 功能 |
| **真题听力 MP3** | `public/audio/exams/` 默认在 `.gitignore` 中，不会随仓库发布；线上听力会回退到浏览器 TTS。若需线上真题录音，需自行将 MP3 纳入构建产物（注意版权与仓库体积） |
| **自定义域名** | 若绑定自定义域名，请将 `VITE_BASE_PATH` 改为 `/` 并调整 workflow 中的 env |
