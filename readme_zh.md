# TransTweetX

## 项目简介
**TransTweetX** 是一款专为 Twitter/X 设计的精准翻译脚本，提供多语言翻译、Emoji 保留、动态内容加载等功能。通过可视化控制面板，用户可以轻松选择目标语言，并实时查看翻译结果。脚本采用智能队列系统和性能优化策略，确保流畅的用户体验。

---

## 特性

### 1. **可视化控制面板**
   - 使用 Font Awesome 6 的 `fa-language` 图标。
   - 支持点击展开/收起动画。
   - 提供六种语言选择：中文、English、日本語、Русский、Français、Deutsch。
   - 毛玻璃效果（`backdrop-filter`）和暗色模式适配。

### 2. **精准翻译**
   - 保留推文中的 Emoji 和特殊符号。
   - 自动处理换行符和多余空格。
   - 支持动态加载内容（无限滚动）。

### 3. **智能队列系统**
   - 使用 `Set` 管理请求队列，防止重复请求。
   - 支持自动重试机制（最多 3 次）。
   - 200ms 的请求间隔，避免触发限流。

### 4. **性能优化**
   - 优化的 `MutationObserver` 配置，监听动态内容加载。
   - 分离样式和逻辑，减少 DOM 操作。
   - 自动清理已完成的任务，释放内存。

### 5. **用户体验**
   - 翻译结果带有加载动画和错误提示。
   - 支持实时刷新翻译内容。
   - 自动适配 Twitter/X 的暗色模式。

---

## 实现原理

### 1. **控制面板**
   - 使用 `Font Awesome` 提供的图标，通过 CSS 实现动画效果。
   - 控制面板的展开/收起通过 `classList.toggle` 动态切换样式。
   - 语言选择后，更新 `config.targetLang` 并触发翻译刷新。

### 2. **文本提取**
   - 使用 `cloneNode` 复制推文节点，避免影响原始内容。
   - 通过正则表达式和 DOM 操作，清理干扰元素（如链接、按钮等）。
   - 处理换行符和多余空格，确保提取的文本格式正确。

### 3. **翻译逻辑**
   - 使用 Google 翻译 API（`translate.googleapis.com`）进行翻译。
   - 通过 `GM_xmlhttpRequest` 发送请求，避免跨域问题。
   - 支持分段翻译，保留 Emoji 和特殊符号。

### 4. **动态内容检测**
   - 使用 `MutationObserver` 监听 DOM 变化。
   - 检测新增节点（`childList`）和文本更新（`characterData`）。
   - 自动处理新加载的推文。

### 5. **队列系统**
   - 使用 `Set` 存储正在处理的推文，防止重复处理。
   - 使用数组 `requestQueue` 管理待翻译的请求。
   - 通过 `processQueue` 函数按顺序处理请求，确保请求间隔。

---

## 使用说明

### 安装步骤
1. 安装浏览器扩展（如 Tampermonkey 或 Violentmonkey）。
2. 创建新脚本，将完整代码粘贴到编辑器中。
3. 保存脚本并刷新 Twitter/X 页面。

### 使用方法
1. 打开 Twitter/X 页面，右下角会显示语言图标。
2. 点击图标展开语言菜单，选择目标语言。
3. 现有推文会自动翻译，新加载的推文也会实时处理。

### 配置选项
在脚本的 `config` 对象中，可以修改以下参数：
- `targetLang`：默认目标语言（如 `zh-CN`）。
- `languages`：支持的语言列表。
- `translationInterval`：翻译请求间隔（单位：毫秒）。
- `maxRetry`：最大重试次数。

---

## 代码结构

### 主要函数
- `initControlPanel()`：初始化控制面板。
- `refreshAllTranslations()`：刷新所有翻译内容。
- `processQueue()`：处理翻译请求队列。
- `extractPerfectText(tweet)`：提取推文文本。
- `translateWithEmoji(text)`：分段翻译并保留 Emoji。
- `translateText(text)`：调用 Google 翻译 API。
- `processTweet(tweet)`：处理单条推文。

### 工具函数
- `delay(ms)`：延迟函数，用于控制请求间隔。
- `createTranslationContainer()`：创建翻译结果容器。
- `updateTranslation(tweet, translated)`：更新翻译结果显示。
- `markTranslationFailed(tweet)`：标记翻译失败。

