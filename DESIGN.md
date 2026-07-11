# distant-friends 设计与开发文档

多语言日常短语对照站。代码和数据已经说清楚的事，这份文档不再说一遍——这里只记代码表达不了的部分：为什么这样设计、受什么约束、踩过什么坑。

**维护规则**：正文写当下事实，不打日期补丁，同一件事只在一处记。日期只出现在三个地方：§9 决策日志、§10 迭代账本、附录 C 版本史。推翻旧决策，在 §9 末尾追加一两行，不回头改写旧条目；做完一轮打磨，在 §10 记一行。看文档不必通读：改内容读 §3 和 README；做打磨轮读 §10、§9 末尾几条和相关的 §4 小节；性能、无障碍、部署、CI 都在 §7。

---

## 1. 项目定义

60 多条朋友之间的日常短语，对照 23 种语言：点击复制、TTS 朗读、收藏、深浅色、PWA 离线。

作者在光遇等社区结识了一群外国朋友，想在聊天时说上几句对方的语言，这个站为此而做。朋友们同时来自多个国家、多数不懂中文，所以 UI 锁英文；一条短语横向对照几种语言是最常用的操作，主形态因此是多列对照表——5 列上限只是版面放不下，不是需求上限。将来可能有公开用户，但设计以作者和朋友们为准。

明确不做的：旅游短语手册、语言学习（不设练习和测验）、翻译 API、社交和 UGC——内容只由作者编辑。取舍时，语气的温度优先于语法的正确；宁可少而精，不求多而全。

## 2. 设计原则

整个站照着"信笺"来做。新决策拿不准时只问一句：加上它之后，这东西更像一封信，还是更像一个 app？信笺是约束，不是装修主题——既不许有后台管理系统的气味（chips 墙、legend、pill 标签），也不许为了"像信"去堆装饰。

五条红线，方向不动摇；具体数字按实测修订，改动记入 §9：

1. 编辑体、信笺观感，禁止 AI 模板感——Inter 字体、紫渐变、通用圆角卡片
2. UI 让位给内容
3. PWA 离线优先，全部功能可离线（TTS 受浏览器限制）
4. 键盘和读屏完整可用，对比度从 AA 起步
5. 轻而快，预算见 §7.4

七条决策规则，正文按名引用，案例见 §9：

| # | 规则 | 内容 |
|---|---|---|
| 1 | 绝不空格子 | 筛选或缺数据时必须有回退显示，任何情况下不出现空单元格 |
| 2 | 控件要挣席位 | 命中率不足的控件直接删；拨了没效果的控件比没有更糟 |
| 3 | 阈值胜过重议 | 依赖数据的决策设一个可测的触发条件，到阈值自动重评，不反复辩论 |
| 4 | 借形先问旧义 | 引入新形状或纹样之前，先查它在通用 UI 里已有的含义 |
| 5 | 增强不承重 | backdrop-filter、JS 动画、webfont 挂掉时，功能和可读性不受损 |
| 6 | 事实住代码 | 文档只记代码表达不了的决策与原因 |
| 7 | 一轮一验 | 视觉改动一轮一交：截图给用户裁决，通过了才做下一轮 |

## 3. 数据模型

### 3.1 原则

1. **语言平等**：无"源语言"概念，每种语言是同一概念的并列 realization；锚点列是用户视角选择，不是数据属性
2. **语境维度全局固定**：tone 仅 `casual / neutral / polite` 三档，不扩展；各语言只在真实有区分处填变体
3. **缺翻译不是错误**：构建时出覆盖率报告，运行时显示占位纹样，不 hard fail
4. **面向 AI 协作**：每短语一个文件，可独立生成 / review / diff

### 3.2 文件与校验

```
src/data/
├── phrases/           # 每短语一个 JSON（<id>.json）
├── phrases.ts         # import.meta.glob 聚合
├── languages.json     # code / native / name / group / tts / rtl / bcp47
└── scenes.json        # 有序场景列表（数组顺序 = 页面顺序）

src/content/ui/en.json # UI 字符串（仅英文）
```

不用 Content Collections。校验：`src/lib/schema.ts`（Zod）在构建开始时 parse 全部数据，schema 错误即构建失败。

### 3.3 Schema 语义

字段定义见 `src/lib/schema.ts`。语义约定：

- 语言：`defaultOn` = 首访默认勾选（含 anchor ≤5）；`defaultAnchor` 唯一，当前 en；stores 从数据派生默认值，禁止硬编码语言 code
- 场景：`em` = 标题中斜体强调的词
- 短语：`id`（kebab-case = 文件名）、`scene`、`order`、`trans{lang: {gloss, variants[]}}`；`gloss` = 该语言对概念的标签，显示为锚点列注脚；`variants` ≥1
- 变体维度字段全部可选：`tone / speakerGender / addresseeGender / addresseeCount / region / rom / note`，只填真实区分
- rom / tone / note 属变体不属 UI。判据：删掉翻译后该文本是否仍有意义；否 → 归变体

```json
{
  "id": "greeting-hello",
  "scene": "greetings",
  "order": 1,
  "trans": {
    "zh": { "gloss": "问候", "variants": [
      { "text": "你好", "rom": "nǐ hǎo" },
      { "text": "您好", "rom": "nín hǎo", "tone": "polite", "note": "Honorific; to elders or strangers." }
    ]},
    "en": { "gloss": "a greeting", "variants": [ { "text": "Hello" } ] }
  }
}
```

### 3.4 筛选逻辑（`src/lib/filter.ts`）

- tone=`any` → 全部变体；指定档位 → 精确命中优先，无命中回退未标 tone 的变体（规则 1）
- 性别轴：排除显式标相反性别的变体，未标保留；`addresseeCount` 仅作被动标签不筛选
- 性别控件的存废由阈值机制管理（规则 2、3）：`pnpm coverage` 输出各轴命中数，≥10 cell 才允许控件存在；当前已恢复
- tone 展示文案（"casually" 等）属 UI 字符串不属数据

### 3.5 内容工作流

流程与翻译四规则见 README（唯一维护处）。模式：AI 生成 JSON → review → 合入。脚本：`pnpm new-phrase`（骨架）、`pnpm coverage`（覆盖率矩阵）。

## 4. 交互规格

> 只记意图、约束、⚠️ 陷阱；数值与细节以组件源码为准。

### 4.1 Masthead 控件（ThemeToggle / ViewToggle）

- ThemeToggle：`light / dark / system` 三态持久化；`<html data-theme>` + 两套 CSS 变量。防 FOUC：`<head>` inline script 阻塞式读 localStorage 设 `data-theme`，先于样式表
- ViewToggle：`table / cards / auto`（auto 按视口宽度，阈值在 `ViewToggle.svelte`）；`$view` 持久化；`body[data-view]` 驱动两套视图互斥显隐
- 卡片视图约束：卡片与场景标题 720px 居中，shell 1240px 不变 → 右侧留 ~260px 供 TocSide 使用

### 4.2 语言选择（LanguagePicker / LangMenu / 列头）

双轨：Stationery 句行面板为主控件（两视图均在），负责增 / 删 / 搜索；桌面表格列头仅提供换列（最高频操作就近放置）。

- **列序 = 选择顺序**：`$selectedLangs` 数组序即列序（anchor 恒首列；句行、选项、卡片语言块均镜像）。添加追加到末尾；换列为数组原位替换。⚠️ 消费端禁止按 languages.json 顺序重排——会导致换入语言跳列
- 句行：母语名直立 serif，anchor 标 accent 色。LangMenu 面板：搜索 + 分组 + 英文名 + Clear（保留 anchor）；满 5 时 header 提示 + pulse，header 在面板内 sticky
- 列头：`<th>` 即按钮，点开同一 LangMenu；点未显示语言 = 原位换列（anchor 列则 anchor 跟随）；仅换列，增删搜索回面板。表头 sticky
- LangMenu：搜索折叠大小写与变音符；选后清空搜索词。⚠️ 分组名与顺序从数据首现顺序派生，禁止硬编码组清单——新组语言会静默消失。母语名直立 serif + 英文 exonym 斜体小字（`name===native` 不重复）
- 约束：anchor 不可删（它是一列）；最后一门语言不可删；`$selectedLangs` 持久化，初始化在 stores 模块层，不依赖组件挂载顺序
- 无障碍：触发器 `aria-expanded`；选项 `aria-pressed` + `aria-label`；母语名 `lang` + `dir`（BCP-47 取数据 `langTag`）；菜单方向键巡航（↑↓ 环绕 + Home/End）；满 5 / 删 anchor 被拒时 `aria-live` 播报；trigger 与 popover 为兄弟节点不嵌套。⚠️ trigger hover/focus 高亮必须用比背景亮的 `--paper-up`——变暗染色会使 accent 文字对比跌破 4.5

### 4.3 Stationery（SlotPicker）

两行句式控制面，slot 即状态：

```
for friends who read [English · 中文 … ▾]
I write — [in any tone] — to [a friend], as [myself].
```

- Slot 值域：`anchor`（已选语言内）、`tone`（any/casual/neutral/polite）、`addressee`（any/m/f）、`speaker`（any/m/f）；默认 `anchor=en, tone=any`；文案取 `ui/en.json`
- 视觉：斜体 Fraunces + accent 色 + 虚线下划线 + ▾；选中 pulse 反馈；键盘完整可用
- 此控制面替代了 chips 墙 / legend / 单元格 pill 三者
- ⚠️ popover 选项按钮关闭态必须 `tabindex="-1"`，展开时改 0——否则 Tab 焦点进入隐藏选项，浏览器自动滚动将其带入视口；`closeAllSlots()` 须重置全部子按钮

### 4.4 表格与卡片（PhraseTable / PhraseCards / VariantRow）

- 锚点列：固定首列，淡金棕底 + 右侧浅 border；表头显示锚点语言本地名。行结构三层：Headword 大字（筛选后第一条变体）、rom、gloss。缺翻译显示淡斜体 `—`，不阻断整行（规则 1）
- 译文格：变体行堆叠，行间虚线。行结构：Entry 大字、rom、tag line（仅 `tone=any` 时渲染 tone/gender 标签）、note、copy hint（hover 显现）。被筛空的格显示斜纹占位。卡片头复用锚点列三层结构，语言块顺序镜像列序
- 复制：主操作，整行可点。复制纯 `text`（不含 rom / tag / note）；成功 = 行内 `✓ copied` + Toast；失败 fallback `execCommand`。`role="button"` + `aria-label`，键盘可触发。⚠️ `.copy-hint` 必须为空 span，文字经 `::before content` 切换——innerText 与 ::before 并存会重叠
- TTS（SpeakButton）：非主交互。`speechSynthesis`，BCP-47 取 `languages.json[lang].tts`；voice 匹配：精确 → 同语种前缀回退，按质量启发式排序；无可用 voice 或无 tts code → 按钮不渲染（规则 2）
- 收藏（StarButton）：锚点列右上，两视图同位；`$starred: Set<phraseId>` 持久化；有收藏时显示 "Starred only" 过滤 chip（chip 状态会话级）；收藏粒度为短语级

### 4.5 TOC（TocTop / TocSide）

两形态互斥，共享 `$scrolled` 阈值（`src/lib/scroll.ts`）。

- TocTop：首屏横向目录，文档流内；Roman 编号 + 场景名（Index 角色）；点击平滑滚动；scrolled 后淡出但保留占位（防跳动）；移动端 flex-wrap
- TocSide：fixed 右侧垂直居中，锚定 shell 右内缘。显隐（阈值以 `TocSide.svelte` 为准）：cards 视图 scrolled 且 ≥640；table 视图 scrolled 且 ≥1024（更窄会挤压末列）；再窄隐藏，由回顶钮兜底
- 静息态：无背景无边框，Roman 数字 + 竖向 rail + 阅读进度线；展开态：实纸面板 `--surface-toc-panel`（半透明会与下层表格文字透叠）；禁用 backdrop-filter
- 展开仅由 hover / focus 触发，滚动不展开——展开面板与表格末列在常见视口必然重叠；active 场景三重标识：编号 accent、场景名加重、短横线
- 场景名收起时保留布局宽度（展开无横向位移）；`$activeScene` 在 scroll RAF 中按场景块位置判定

### 4.6 StickyBar

- scrolled 后顶部淡入：mark（点击回顶）+ 缩略 Stationery（tone / addressee / speaker）
- 不含 anchor slot：锚点切换频率极低，留在 Stationery
- slot 与 Stationery 共享 store，双向同步；淡出时 `closeAllSlots()`
- 表面：近实纸底 + backdrop-filter。blur 仅在浮动工具栏成立（与内容分层）；TocSide 非工具栏故禁用。可读性不依赖 blur（规则 5）
- 窄屏隐藏 mark 仅留句子。不做 TOC 快捷跳转（TocSide 已覆盖）

### 4.7 PWA

- manifest + SW（`@vite-pwa/astro`，`autoUpdate`）；precache 仅 shell（短语数据打包进 JS）
- 字体不 precache：CJK Noto 按 unicode-range 拆分上百子集（全量数十 MB），改运行时 CacheFirst；离线时系统衬线兜底（规则 5）
- 不做自定义 install prompt
- ⚠️ Astro 7 下 `@vite-pwa/astro` 不自动注入 `registerSW`——Layout 在 PROD 手动挂载，否则离线静默失效；由离线测试守护

### 4.8 Popover 原语（`lib/popover.ts`）

全站浮层（SlotPicker、语言面板、列头弹层）统一走单一 `openPopover` store + `use:popover` action：同刻只开一层、点外关闭、Esc 关闭并归还焦点到触发器。

- ⚠️ 禁止回退到各组件自挂 document 监听 + stopPropagation——会出现双层同开、Esc 后焦点落 body
- popover id 须实例唯一（同名 slot 在 Stationery 与 StickyBar 各一份）
- 弹层条件挂载（`{#if}`），禁止 `visibility:hidden` 常驻——曾致 ~1200 个隐藏按钮驻留 DOM 且需全套 tabindex 管理

## 5. 设计系统

数值全部在 `src/styles/tokens.css`，本节只记语义。

### 5.1 字体（角色制）

来源：Masthead 用 Fraunces 大光轴（高笔画对比）+ 字重 400 + 斜体点缀；正文层级按角色递减复用该特征。全站字体经角色 token 取值，**组件禁止自设 `font-variation-settings` 裸值**。

| 角色 | 用途 | 规格意图 |
|---|---|---|
| Display | Masthead、场景标题、404 | 大字号自然高对比，负字距 |
| Headword | 锚点列大字、卡片头字 | 用 opsz 而非字重取得分量 |
| Entry | 变体正文 | opsz 高于 auto 一档 |
| Aside | rom / gloss / 语域行 / 注名 / 空态 | serif italic 小字 `--ink-mute`，全站统一一个声部 |
| Index | 语言菜单母语名、TOC 条目 | 母语名直立（CJK 无真斜体，italic 是劣质伪斜体） |
| Label | 全部 sans 小帽标签 | 统一一档；登记例外：Footer 署名、StickyBar 紧凑变体 |

- Fraunces 仅含 Latin（西里尔由 Noto Serif SC cyrillic 子集承担）；CJK 回退 Noto Serif SC/JP/KR；首屏 UI 标签用 `--font-serif-local`（无晚到 webfont，见 §7.4）
- Instrument Sans 仅 400/500；opsz 是唯一表现轴（无 SOFT/WONK；CJK 回退字体无 opsz 轴，自动忽略）

### 5.2 颜色

- 两层命名：原色（bg / paper / paper-up / ink / ink-soft / ink-mute / accent / gold / gold-ink / on-accent / line）+ 语义 surface（`--surface-*`）
- 暖纸色系：米色底、墨字、赤陶 accent、金色装饰
- 暗色主题 = 同一色相体系整体压暗提亮，非反色
- `--gold` 仅装饰（文字不达 AA）；文字金用 `--gold-ink`；`--on-accent` 为 accent 填充上的文字色，随主题反向
- 双主题均须过 AA（正文 4.5:1，大字 3:1），在 CI 门禁内。⚠️ 对比度基准背景是最暗的 `--bg`（比 `--paper` 深）——仅对 paper-up 验证会漏检

### 5.3 动效

约束：动画必须对应一个可解释的状态变化（换列 = 逐行写入新内容、收藏 = 星标确认、slot 切换 = 高亮一次）；纯装饰动画不做。

- 时长按用途分档（hover / switch / feedback / reveal / entrance）；easing 三种（`--ease-out` 通用、`--ease-spring` 轻 overshoot、linear 仅机械属性）；TOC 的 JS 时序常量在 `scroll.ts`
- 命名动画：`rise`（卡片入场）、`pulse`（slot 反馈）、`nudge`（满 5 提示）、TOC stagger、`$freshLang` 换列级联
- 圆角两档：微圆（卡片）、药丸（chip）；不用正圆
- reduced-motion：`global.css` 一条全局兜底覆盖全部动画与过渡
- ⚠️ 首屏大文本块入场只用位移不用透明度——LCP 元素做 opacity 入场会推迟绘制记录点
- ⚠️ lightningcss 会把独立 `animation-timeline` 折叠进 `animation` 简写导致整条声明被浏览器丢弃（静默失效）；写法：`animation-timeline: var(--xx)` 经自定义属性间接引用，压缩器无法折叠

## 6. 技术选型

判据：bundle 小、可手工雕琢、可离线、AI 可协作。

| 层 | 选择 | 理由 / 约束 |
|---|---|---|
| 静态生成 | Astro | Islands、零 JS 默认、GH Pages 兼容 |
| 交互 | Svelte | 仅有状态 islands |
| 语言 | TypeScript | strict |
| Schema | Zod | 构建时显式校验（§3.2） |
| 状态 | nanostores | 持久化 `@nanostores/persistent` |
| 样式 | Vanilla CSS + 变量 | 禁 Tailwind / CSS-in-JS |
| PWA | @vite-pwa/astro | Workbox |
| 字体 | fontsource（fraunces / instrument-sans） | 自托管离线可用 |
| 包管理 / 部署 | pnpm / GitHub Pages | 经 Actions |

- 版本以 `package.json` 为准（每周自动升级，§7.2）
- 不选：Next.js / Nuxt（重、路径复杂、SSR 无用）；SvelteKit static（可行但 Astro 更合适）；纯 HTML（无类型安全）；React（bundle / hydration 成本）；Tailwind（与红线 1 冲突，**不随流行度重议**）
- 不引入：图标库（手写 SVG ×6）、UI 库、动画库、大型状态管理。唯一例外：测试（§7.2 的必要条件）
- 重选条件：Astro 停止维护或 Islands 有更轻替代 → 按判据重评；引入预生成音频（§8）→ 构建管线复杂度整体重议

目录：

```
distant-friends/
├── public/            # favicon、og-image、PWA icons
├── src/
│   ├── components/    # astro/（静态）+ svelte/（islands）
│   ├── data/          # §3.2
│   ├── lib/           # schema / stores / filter / tts / scroll / clipboard / storage / popover / slot-options
│   ├── content/ui/    # UI 字符串
│   ├── styles/        # tokens / global / typography
│   └── pages/         # index + 404
├── scripts/           # new-phrase / coverage / export-review
├── tests/             # Playwright
└── .github/workflows/ # 部署 + CI + 自动合并
```

## 7. CI 与质量门禁

前提：无人工审阅。所有质量保障必须由门禁自动执行。

### 7.1 部署

dev → main（Vercel preview）→ release（GitHub Pages），细节见 README。Actions：pnpm + Node 22、`upload-pages-artifact` → `deploy-pages`。仓库名非 `<user>.github.io` 时配 `site` + `base`；自定义域后去掉 `base`。

### 7.2 依赖自动合并（Dependabot）

- 每周一扫描依赖与 Actions 引用，对 dev 开 PR（升级走完整管线，dev 不落后 main）
- 门禁：`pnpm build` + `pnpm check` + `pnpm test`，绿灯 squash 合并；patch / minor / major 一视同仁，无人工审
- minor+patch 合并单 PR；major 单独 PR（破坏性升级只挡自己）
- `allow_auto_merge` 关闭，门禁内置 workflow 步骤，不依赖分支保护
- ⚠️ `dependabot.yml` 从默认分支读取；auto-merge workflow 须在 PR base 分支（dev）上才触发

### 7.3 测试（Playwright + axe）

对 `astro preview` 生产构建执行：

- 冒烟：渲染、复制 + toast、SlotPicker、主题、星标过滤、键盘穿行
- axe：WCAG 2.1 A/AA 全量含 `color-contrast`，light + dark 双主题
- 离线：SW 缓存后断网可用
- `pnpm test` = chromium（门禁）；`pnpm test:all` = chromium / firefox / webkit
- 接入 `ci.yml`（PR 与 dev/main push）与 §7.2 门禁。键盘 / 读屏行为是 axe 盲区，由冒烟测试覆盖

### 7.4 性能预算

按实测校准（校准记录在 §9）：

- Lighthouse（slow-4G）：A11y / BP / SEO = 100；Performance ≥ 90
- CLS = 0（首屏禁止任何字体 swap 重排）；TBT < 100ms
- 阻塞 CSS < 20KB（CJK @font-face 保持异步）；首屏关键传输 < 250KB
- 禁用 `font-display: optional`：⚠️ 实测触发 Chrome 预取全部 unicode-range 相交子集，慢网 FCP 翻倍

策略：Fraunces standard 轴；拉丁两支 + Instrument Sans latin 预载（防 swap 位移）；CJK 异步 + 系统衬线兜底；首屏 UI 标签用 `--font-serif-local`（栈内无晚到 webfont → 无重排；短语内容保持 Noto）；水合分级（滚动后可见的岛 `client:idle`，首屏可点 `client:load`）；`content-visibility: auto`；数据打包进 JS 不走 fetch；零第三方脚本、零 analytics。

### 7.5 无障碍

- 全部交互有 `:focus-visible`；icon 按钮必有 `aria-label`
- Toast `role="status"` + `aria-live="polite"`；语言切换 `aria-pressed`；译文带 `lang`
- 对比度 AA 双主题入门禁；不以颜色为唯一信息载体
- 键盘完整可操作；Esc 关浮层并归还焦点（Toast 为瞬态非交互件，无 Esc 要求）
- `prefers-reduced-motion` 全局兜底；`<html lang="en">`；`h1` 唯一
- RTL（阿拉伯语）：内容级 `dir="auto"`，界面保持 LTR

## 8. 未来项（不承诺）

| # | 项 | 状态 / 条件 |
|---|---|---|
| 1 | UI 中文化 | ✗ 不做：受众不懂中文，UI 锁英文；切换结构保留不补译文 |
| 2 | 搜索框 | 候选（fuse.js，任一语言 / 拼音定位） |
| 3 | 多标签 tags | 候选（与 scene 正交） |
| 4 | 分享链接 | ✗ 不做（ROI 低） |
| 5 | 导出图片 | 候选 |
| 6 | 预生成音频 | 候选：构建期神经 TTS，~30-40MB 懒加载；引入前评估构建复杂度与体积 |
| 7 | 反向查找 | 候选（需索引反转，工程量大） |
| 8 | 变体级收藏 | 候选 |
| 9 | 内容贡献渠道 | 候选：GitHub Issues 表单 + PR，不做 CMS |
| 10 | 快捷键 | 候选（Tab 流已完整，非必需） |

## 9. 决策日志（append-only）

> 仅记方向变更：日期 + 方向 + 原因，≤2 行。机制归 §3-§7；日常交付不记。

- **2026-04-22** · 大简化定调：所有语言平等、tone 全局固定、Stationery 替代 chips 墙 / legend / pill、UI 锁英文。
- **2026-04-26** · addressee slot 撤除（命中率过低，拨动无效）；确立阈值机制（≥10 cell 再考虑恢复）。
- **2026-04-28** · 默认锚点 zh → en：受众主体不懂中文。
- **2026-04-29** · phrases.json 拆 per-phrase 文件：单文件无法支撑独立生成 / review / diff。
- **2026-04-29** · 引入 `reviewed` 字段。
- **2026-06-10** · 移除 `reviewed`（反转上条）：审核流程未成形，字段成噪音。
- **2026-06-10** · 翻译四规则入 README；全库审计删 211 变体。
- **2026-06-11** · 场景体系"小而多"（11 场景）；排序 = 逻辑分块 > 频率，高频不沉底。
- **2026-06-11** · 同义对保留标准形，删 casual 重复；每格保证中性默认（无正式语域的概念除外）。
- **2026-06-12** · RTL 仅内容级 `dir="auto"`，不做全局 RTL 布局。
- **2026-06-12** · 字体退出 SW precache（反转）：CJK 子集全量数十 MB，改运行时 CacheFirst。
- **2026-06-12** · TTS 无 voice 不渲染（弃禁用 + tooltip）；voice 质量启发式排序；Starred only 会话级。
- **2026-06-12** · Fraunces full → standard 轴（-120KB，弃 SOFT/WONK）；CJK 声明移出阻塞 CSS。Lighthouse 56→88。
- **2026-06-12** · 元原则：性能数字非铁律，按实测校准并记日志。
- **2026-06-12** · 性别控件恢复（阈值触发：两轴各 60）。
- **2026-06-13** · tone 四档 → 三档：close 命中 0.5%，并入 casual，旧持久化值迁移。
- **2026-06-27** · 引入 Dependabot 自动合并（dev 落点；minor+patch 单 PR；major 手动审）。
- **2026-06-28** · major 也自动合并（反转）：维护者不审 diff，"手动审" = 永不合。
- **2026-06-28** · 引入测试（反转"不用测试框架"）：major 自动合并使肉眼验失效；当天捕获 SW 注册失效、按钮嵌套两回归。
- **2026-06-28** · 对比度补齐 AA：新增 `--gold-ink` / `--on-accent`；color-contrast 入门禁。
- **2026-06-28** · 语言选择改造：chip 墙 → 句行 + 分组弹层；修 anchor 硬编码 bug。
- **2026-06-29** · 双轨化：语言操作入表格列头；亮模式次要文字提对比；trigger 高亮改亮色。
- **2026-06-29（二）** · 收敛：句行面板两视图常驻为主控件；表头仅换列；LangMenu 重做视觉。
- **2026-07-02** · 工程收口：列序 = 选择顺序；popover 原语；弹层条件挂载；分组从数据派生。
- **2026-07-02（二）** · 功能冻结，进入设计迭代期，立 §10 账本。
- **2026-07-03** · 换列动画用内容级联（"新墨写入"），弃 FLIP / View Transitions：表格列几何过渡工程不成立。
- **2026-07-03（二）** · 性能再校准：修 CLS 回归（0.115→0）+ 水合分级，Perf 59→96；确立首屏 swap-safe 栈；否决 `font-display: optional`。
- **2026-07-03（三）** · wavy 下划线当日回退（用户否决）：与拼写检查语义冲突（规则 4 由此确立）。
- **2026-07-03（四）** · 字体角色制（用户反馈触发）：角色 token 唯一入口，opsz 替代字重。
- **2026-07-07** · R13–R18 实验整体撤销，定格 R12（用户裁决）；确立一轮一验（规则 7）。

## 10. 设计迭代账本

> 功能冻结后的打磨账本。两周期已闭环；现行规则一轮一验（§2 规则 7）。

### 原则

- 仅打磨已有功能：不新增功能（§8）、不改首屏形态、不造新交互物件
- 每轮流程：审计截图 → 设计 → 实现 → 浏览器验证 → 测试全绿 → 提交 → 用户裁决 → 通过才开下一轮
- 动手前重截当前状态，不凭记忆
- 浮层一律走 popover 原语（§4.8）；AA 是底线

### 周期存档

- **R1–R8（2026-07-02～03）**：换列级联、收藏反馈、发音墨晕、TOC 进度线、面板键盘手感、复制金线；触屏可供性、404 印章、表格行高 348→302px、回顶钮。
- **R9–R12（2026-07-03）**：雕版工艺 + 暗色（R9，同时修 CLS 回归、Perf 59→96）、浮层 / Toast / 卡片统一（R10）、字体角色制（R11）、版面家具（R12）。R13–R18 六轮实验于 07-07 整体否决回退（§9），提交存于 git 历史。

### 轮次日志

- **打印样式 · 2026-07-08** — `global.css` 尾部单个 `@media print` 块，屏幕零影响：交互 chrome 全隐、`content-visibility` 打印强制 visible、sticky 表头改 static（原生 thead 分页重复）、场景标题不跨页。⚠️ 覆盖 svelte 作用域样式需 `!important`。
- **R12 · 2026-07-03** — 版面家具：Nº 编号、Footer 收笔线、暖色 `::selection`（暗色需专用 token）、`scrollbar-color`（不用 `::-webkit-scrollbar`，会强制 macOS 常显滚动条）。
- **R11 · 2026-07-03** — 字体角色制落地（§5.1）：tokens、八组件归口、死代码清除；截图对比验证。
- **R10 · 2026-07-03** — 浮层内衬光、章节留白、Toast 纸条化、卡片角线；noise 层实测结案；wavy 下划线回退。
- **R9 · 2026-07-03** — 五个工艺层 + 性能修复。教训：性能回归藏在功能迭代后，开新周期先重测基线。
- **R8 · 2026-07-03** — 表格行高 348→302px（截图对比法）。
- **R7 · 2026-07-03** — 回顶钮；列宽比方案排除。
- **R6 · 2026-07-03** — TocSide 改判（滚动只点亮 rail，hover/focus 才展开）；StickyBar 移动端单行。
- **R5 · 2026-07-03** — 触屏 copy 常显、404 印章、scene id 唯一化、slot-options 去重。
- **R4 · 2026-07-03** — 面板键盘手感（键盘开 → 搜索聚焦、typo 建议）+ 复制金线（background-size 而非 SVG stroke，SVG 多行会断）。
- **R3 · 2026-07-03** — 首星跳动修复、发音墨晕、TOC 进度线。教训：条目写自推测，动手前先读现状。
- **R2 · 2026-07-03** — 换列级联（`$freshLang`）+ 收藏反馈（pop + 金屑 + 星数微标）。
- **R1 · 2026-07-02** — 全状态审计（11 截图）建账；浮层近实纸化、断行修辞、`lang` 裸码修复。

## 11. 附录

### A. 约定

- 命名：文件 kebab-case；组件 PascalCase；store camelCase（用时加 `$`）；CSS 类 kebab-case 松散 BEM；类型 PascalCase，Zod 导出类型加 `T` 前缀
- Commit：Conventional Commits 松散版，**英文**，三个月后可读
- 决策记录在 §9，不开 ADR 目录

### B. 构建史

M0 骨架（v0.1.0）→ M1 对齐 demo（v0.1.1）→ M2 深色 + 收藏（v1.0.0）→ M3 语音 + PWA（v1.0.0）→ M4 打磨 → M5 内容扩充（持续；规模以 `pnpm coverage` 为准，演进史见 [GitHub Releases](https://github.com/Chimelight/distant-friends/releases)）。早期三版 demo 已不在仓库，不是任何基准。

### C. 文档版本史

- **v1.0–v1.5**（2026-04）— 初版；变体系统；addressee 撤除 + 阈值机制
- **v2.0**（2026-06-12）— 确立事实层 / 意图层分层，删事实复制品 -350 行，设决策日志
- **v2.1–v2.3**（2026-07-02~08）— 设迭代账本；决策日志严格时序；一轮一验入册
- **v2.4–v2.6**（2026-07-10）— 修 5 处过期事实；清事实层复制 -220 行；废 as-built 快照；设阅读地图 + CLAUDE.md；立无时间戳写法规则
- **v3.0–v3.1**（2026-07-11）— 全文重写：新大纲 + 紧凑年表 + 陷阱归位；§2 设计哲学与七规则
- **v4.0**（2026-07-11）— 重写为"设计文献"：交互章按信笺解剖组织，文学化语体
- **v4.1**（2026-07-11）— **工程化改写**（结构与编号同 v4.0）：删除全部文学化表达与隐喻式标题，恢复组件名标题，§1 改定义清单，§2 决策规则入表，§8 未来项入表；信笺隐喻保留为一行判断标准
- **v4.2**（2026-07-11）— 撤 todo 清单（开放项 / 手测清单，用户裁决）；导言、§1、§2 自然语化：去标签式条目与符号速记，信息与编号不变

*文档版本 v4.2 · 2026-07-11*
