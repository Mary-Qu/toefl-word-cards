# Margin TOEFL 词卡

Margin 是一个可以离线运行的 TOEFL 背单词网页工具。单词数据来自 `Word Lists 1-35` 中的 Word 和 PDF 词表，当前收录 Word List 1–35，共 3413 个单词和短语。

网页提供词卡学习、间隔复习、专项练习、词库搜索和学习统计。学习记录保存在浏览器本地，无需服务器和数据库。

## 功能

- 按照 Word List 选择学习范围
- 显示单词、音标、词性、中文释义、同义词和例句
- 使用浏览器英语语音播放单词发音
- 根据熟悉度自动安排下一次复习日期
- 提供释义选择、中文拼写和例句填空练习
- 按照单词表、学习状态和收藏状态筛选词库
- 记录每日学习数量、连续学习天数、正确率和掌握进度
- 支持桌面端和手机端布局
- 支持键盘快捷操作

## 直接使用

双击项目根目录中的 `index.html` 即可打开网页。

运行所需的文件结构为：

```text
index.html
src/
├─ app.js
├─ styles.css
└─ data/
   └─ words.js
```

这些文件保持原有相对位置时，网页可以直接离线运行。

## 学习方法

### 1. 选择单词

首页显示 35 个 Word List 的条目数量和学习进度。点击某个 Word List 右上角的箭头，可以只学习该单词表；点击“快速学习”会混合全部单词表。

在“词卡”页面中可以设置：

- 学习哪些 Word List
- 本轮学习 10、20、30 或 50 个单词

到期单词会优先进入学习队列，其后安排新单词。

### 2. 使用词卡

词卡正面显示单词、音标和发音按钮。点击卡片或按下 `Space` 可以查看释义和例句。

查看答案后，根据实际回忆情况选择熟悉度：

| 数字 | 熟悉度 | 复习安排 |
|---:|---|---|
| 1 | 忘记，最不熟悉 | 当天再次出现 |
| 2 | 模糊 | 1 天后复习 |
| 3 | 熟悉 | 从 3 天开始逐渐延长 |
| 4 | 掌握，最熟悉 | 从 7 天开始逐渐延长 |

数字越大，代表对当前单词越熟悉。连续选择“熟悉”或“掌握”会延长复习间隔；选择“忘记”会将单词重新加入当前学习队列。

### 3. 完成专项练习

“练习”页面包含三种模式：

- 释义选择：根据英文选择中文释义
- 中文拼写：根据中文释义填写英文单词
- 例句填空：根据原始例句填写缺少的单词或短语

每轮包含 10 道题。答题结果会更新该单词的学习记录和复习日期。

### 4. 使用词库

“词库”页面支持：

- 搜索英文单词、中文释义和同义词
- 按照 Word List 筛选
- 按照未学习、学习中、复习中和已掌握筛选
- 只显示收藏单词
- 展开查看完整释义和例句
- 重置单个单词的学习记录

### 5. 查看学习记录

“记录”页面显示：

- 已经学习和已经掌握的单词数量
- 整体回答正确率
- 最近七天的学习数量
- 连续学习天数
- 每个 Word List 的学习进度

页面底部可以重置全部学习记录。重置操作会清除熟悉度、复习日期、收藏和统计数据。

## 键盘快捷键

| 按键 | 功能 |
|---|---|
| `Space` | 翻开或合上当前词卡 |
| `1` | 忘记，最不熟悉 |
| `2` | 模糊 |
| `3` | 熟悉 |
| `4` | 掌握，最熟悉 |
| `P` | 播放当前单词发音 |
| `F` | 收藏或取消收藏当前单词 |

熟悉度快捷键需要在词卡翻面后使用。

## 学习记录保存位置

学习记录保存在浏览器的 `localStorage` 中，存储键为：

```text
margin-toefl-progress-v1
```

使用规则：

- 刷新页面或关闭浏览器不会清除学习进度
- 不同浏览器分别保存自己的学习记录
- 不同设备分别保存自己的学习记录
- 清除浏览器网站数据会同时清除学习记录
- 每位在线用户拥有独立的本地学习记录

## 使用本地服务器

本地服务器属于可选运行方式。直接双击 `index.html` 不需要安装开发工具。

运行 `npm run serve`、`npm run parse` 或 `npm run check` 时，电脑需要安装 Node.js 18 或更高版本。Node.js 安装包会同时提供 npm。

在项目目录中执行：

```powershell
npm run serve
```

浏览器访问：

```text
http://127.0.0.1:4173
```

按下 `Ctrl+C` 可以停止本地服务器。

## 更新单词数据

解析程序会按照固定顺序读取 `Word Lists 1-35(1)` 目录中的下列文件：

```text
Word_Lists_1-5.docx
Word_Lists_6-10.docx
Word Lists 11-15.txt
Word Lists 16 to 20.docx
Word_Lists 21-25(1).docx
Word_List_26-30 (Final).docx
Word_Lists_31-35.docx
```

`Word Lists 11-15.txt` 是从原始 PDF 提取的布局文本。只有原始 PDF 发生变化时，才需要重新生成该文件。执行下面命令需要 Python 3 和 `pypdf`：

```powershell
python scripts/extract-pdf-word-lists.py "Word Lists 1-35(1)/Word Lists 11-15.pdf" "Word Lists 1-35(1)/Word Lists 11-15.txt"
```

更新步骤：

1. 在对应源文件中修改单词内容。
2. PDF 发生变化时，重新生成 `Word Lists 11-15.txt`。
3. 在项目目录中运行：

```powershell
npm run parse
```

程序会重新生成：

```text
src/data/words.js
```

当前解析规则：

- `Word List N` 识别为单词表标题
- 包含英文单词和音标的段落识别为新单词
- 支持“单词、音标、词性和释义”位于同一段的格式
- `e.g.` 开头的段落识别为例句
- 英文完整句子可以在缺少 `e.g.` 标记时识别为例句
- 其余段落归入当前单词的释义
- `[同]` 后面的内容识别为同义词
- 原始文本会和结构化数据一起保存

解析完成后会检查 35 个 Word List 的条目数量、重复 ID、缺少例句、多条释义和跨表重复单词。

当前固定数量检查的汇总结果：

```text
Word List 1-5:   405
Word List 6-10:  476
Word List 11-15: 416
Word List 16-20: 464
Word List 21-25: 554
Word List 26-30: 575
Word List 31-35: 523
总数: 3413
```

修改现有单词的释义、音标、同义词或例句时，可以直接重新解析。增加或删除单词条目时，还需要同步修改 `scripts/parse-word-lists.mjs` 中的 `expectedCounts`。

数量不符或出现重复 ID 会终止生成。缺少例句、多条释义和跨表重复单词属于统计项目，程序会报告数量并继续生成数据。

## 运行项目检查

执行：

```powershell
npm run check
```

该命令会：

1. 重新解析 Word 和已提取的 PDF 单词表。
2. 检查 35 个 Word List 的条目数量。
3. 检查辅助脚本的 JavaScript 语法。
4. 检查网页数据和主程序的 JavaScript 语法。

`npm run check` 会检查 `scripts/browser-qa.mjs` 的语法，不会启动 Chrome 或执行网页交互测试。

浏览器自动化检查脚本位于：

```text
scripts/browser-qa.mjs
```

该脚本覆盖首页、词卡翻面、熟悉度说明、评分保存、练习反馈、词库搜索、统计页面、手机布局和离线打开方式。

执行该脚本需要 Node.js 22 或更高版本、本地服务器，以及监听 `9222` 端口的 Chrome DevTools 调试会话。该脚本主要用于项目开发和页面回归检查，普通使用和 GitHub Pages 部署不依赖它。

## 部署到 GitHub Pages

### 1. 创建仓库

在 GitHub 中创建一个公开仓库，例如：

```text
toefl-word-cards
```

### 2. 上传网站文件

将以下内容上传到仓库根目录：

```text
index.html
src/
README.md
```

上传完成后，仓库首页应当可以直接看到 `index.html`。网站运行不需要上传原始 `.docx`、课程视频、教学文件、`scripts` 或 `work` 文件夹。

### 3. 开启 Pages

进入仓库：

```text
Settings → Pages
```

设置：

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

示例使用 `main` 分支。仓库采用其他默认分支时，在 `Branch` 中选择实际保存网站文件的分支。

点击 `Save`，等待 GitHub 完成部署。

网站地址通常为：

```text
https://GitHub用户名.github.io/toefl-word-cards/
```

以后向选定的发布分支提交更新后的网页文件，GitHub Pages 会自动重新部署，分享网址保持不变。

## 项目结构

```text
托福阅读/
├─ index.html                       # 网页入口
├─ src/
│  ├─ app.js                       # 页面、学习逻辑和本地存储
│  ├─ styles.css                   # 桌面端和手机端样式
│  └─ data/
│     └─ words.js                  # 自动生成的单词数据
├─ scripts/
│  ├─ parse-word-lists.mjs         # DOCX/TXT 单词表解析程序
│  ├─ extract-pdf-word-lists.py    # PDF 布局文本提取程序
│  ├─ serve.mjs                    # 本地静态服务器
│  └─ browser-qa.mjs               # 浏览器自动化检查
├─ Word Lists 1-35(1)/            # Word List 1–35 源文件
│  ├─ Word Lists 11-15.pdf
│  ├─ Word Lists 11-15.txt         # 从 PDF 提取的文本
│  └─ 其他 Word 词表
├─ package.json                    # 项目命令
└─ README.md                       # 使用说明
```

## 常见问题

### 页面提示“单词数据未生成”

确认文件存在：

```text
src/data/words.js
```

缺少该文件时运行：

```powershell
npm run parse
```

### 页面能够打开，但没有样式

确认 `index.html` 和 `src` 文件夹保持在同一级目录，并检查下面的文件是否存在：

```text
src/styles.css
src/app.js
```

### 发音按钮没有声音

检查浏览器和系统音量，并确认浏览器中存在可用的英语语音。推荐使用较新的 Chrome 或 Edge。

### 学习进度消失

学习记录与当前浏览器的网站数据关联。更换浏览器、使用隐私模式、清除网站数据或更换设备都会产生新的学习记录。

### GitHub Pages 显示 404

检查：

```text
仓库根目录存在 index.html
Pages 分支为 main
Pages 目录为 / (root)
```

首次部署和后续更新可能需要等待几分钟。

## 数据说明

当前数据统计：

| 单词表 | 条目数量 |
|---|---:|
| Word List 1–5 | 405 |
| Word List 6–10 | 476 |
| Word List 11–15 | 416 |
| Word List 16–20 | 464 |
| Word List 21–25 | 554 |
| Word List 26–30 | 575 |
| Word List 31–35 | 523 |
| 合计 | 3413 |

其中 95 个条目在原始单词表中没有例句，197 个条目包含多条释义。14 个英文单词出现在多个 Word List 中，网页会按照各自的单词表和条目 ID 分别保存学习记录。
