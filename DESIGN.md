# 致 · 远 · 方 — 设计与开发文档

> 一份多语言日常问候对照站。给与世界各地朋友保持联系的人。

本文档是项目**意图层**的真相源，按任务选读（地图见 §0），不必全文读完。

---

## 0. 本文档的维护规则

真相分两层，不要混：

1. **事实层以代码和数据为唯一真相**——目录结构、schema 字段、场景列表、token 数值、UI 文案，一律看源文件。本文档不复制这些内容：复制品必烂，且以权威口吻误导。
2. **意图层以本文档为唯一真相**——为什么这么做、红线、被否决的方案、踩过的坑。代码说不出"为什么"，这是本文档存在的理由。

写法三律：

- 正文只写**无时间戳的当下真相**：新认识改写进句子的自然位置，不打"（某日澄清）"式补丁——补丁会沉积成地层。日期与来历归 git 和账本（§10 / §11 / 附录 D）
- **同一事实只在主场出现一次**（主场划分见文档地图）；其他位置至多一个替代整段复述的指针，指针不作来历装饰
- 像素与数值不入册，一律看源码

维护义务：

- 推翻既有设计决策 → §10 末尾**追加**一条（≤2 行：方向 + 原因）。永不改写旧条目——反转本身是信息；全表严格时间升序，同日多条以（二）（三）标次序
- 完成一轮设计迭代 → §11 轮次日志一行收束，开放项勾销，周期闭环后压缩进存档
- 其余章节在主场改写正文，不留补丁

**文档地图**——每节一个职责：

| § | 唯一职责 |
|---|---|
| 1 / 2 | 愿景与用户 / 五条红线 |
| 3 | 数据模型：原则、schema 语义、筛选语义、内容工作流 |
| 4 | 功能与交互：意图、约束、⚠️ 陷阱 |
| 5 | 设计系统：字体角色、颜色语义、间距动效 |
| 6 / 7 | 技术选型 / 结构、部署与 CI |
| 8 | 质量门禁：性能预算 + 可访问性承诺 |
| 9 | 未来可能与已否决 |
| 10 / 11 / 附录 D | 三本账：决策、设计迭代、文档版本——日期只住这里 |
| 12 | 附录：约定、手测清单、构建史、版本史 |

按任务选读：改内容 → §3 + README；设计打磨轮 → §11 + §10 末尾 + 相关 §4 节 + §2；性能 / 无障碍 → §8；部署与 CI → §7；动文档自身 → 本节。

---

## 1. 项目愿景

**它是什么**：一个温暖、精致、离线可用的日常问候短语对照站，60+ 条朋友间常用短语 × 23 种语言（可扩展）。点击即复制、可听发音、可收藏、深浅色切换。

**它不是什么**：不是旅游短语手册（"去机场怎么走"），不是语言学习工具（无练习测验），不是翻译器（不接翻译 API），不是社交 / UGC 平台（只作者编辑内容）。

**核心用户**：① 作者本人（日常在光遇等社区结识外国朋友）；② 作者的朋友们——**同时来自多个国家**，可能不懂中文（UI 主语言是英文的由来）；③ 未来任何想用它的人。

国别多样决定了主形态：一条短语横向对照几位朋友的语言就是核心任务，多列对照表是面向朋友的日常工具，不是作者的策展视图；5 列上限只是版面约束。

**核心价值**：在跨语言友情里，**准确的温度比准确的语法更重要**。宁可少而精，不要多而滥。

---

## 2. 不可妥协的红线

方向性原则（1–4）不动摇；数字指标以实测为准修订，修订记入 §10。

1. **美学优先。** 编辑体 / 信笺感。绝不允许"AI 网页模板"观感（Inter 字体、紫色渐变、通用圆角卡片）。
2. **内容是主角。** UI 消隐让位给短语本身；装饰为衬托文字存在，不是秀技。
3. **一次加载，永久可用。** PWA 离线优先，任何功能无网可用（TTS 取决于浏览器）。
4. **键盘可达 + 屏幕阅读器友好。** 不因美学牺牲可访问性，AA 起步。
5. **轻而快。** 性能预算见 §8。

---

## 3. 数据模型

### 3.1 五条硬原则

1. **所有语言平等**：不存在"源语言"，每种语言都是同一概念的一个 realization。
2. **锚点列是用户选择，不是数据属性**：任何语言都能拉到锚点列，切换不影响数据。
3. **语境维度全局固定**：tone 只有 `casual / neutral / polite` 三档，不扩展；每种语言只在真实有区分的层级填变体。
4. **缺翻译不是错误**：构建时出覆盖率报告，运行时该格显示占位纹样，不 hard fail。
5. **结构便于 AI 协作**：两个扁平 JSON + 每短语一个文件，单条短语可独立生成、review、diff，AI 一次改一个文件不殃及全库。

### 3.2 文件组织

```
src/data/
├── phrases/           # 每条短语一个 JSON（<id>.json）
├── phrases.ts         # import.meta.glob 聚合
├── languages.json     # 语言元信息（code / native / name / group / tts / rtl / bcp47）
└── scenes.json        # 有序场景列表（数组顺序 = 页面顺序）

src/content/ui/en.json # UI chrome 字符串（只出英文）
```

放在 `src/data/` 而非 Content Collections：内容由显式 Zod 校验把关（`src/lib/schema.ts`），Astro 构建开始时 parse，任何 schema 错误立即失败——线上数据永远合法。

### 3.3 Schema 语义

字段定义与约束看 `src/lib/schema.ts`，这里只记语义：

- 语言：`defaultOn` 首访默认勾选（加 anchor 控制在 5 内）；`defaultAnchor` 首访锚点（仅一个为 true，当前为英文）——stores 从它派生默认值，不硬编码语言
- 场景：`em` 是标题里要斜体强调的词（"Warm **_Wishes_**"式排印）
- 短语：`id`（kebab-case，即文件名）+ `scene` + `order` + `trans`（key = 语言 code）；每个 `trans[lang]` = `gloss`（该语言对概念的小标签，锚点列大字下的注脚）+ `variants`（至少一条）
- 变体的维度字段全部可选（`tone` / `speakerGender` / `addresseeGender` / `addresseeCount` / `region` / `rom` / `note`）——只填真实区分
- **rom / tone / note 跟变体绑定**，不属 UI 文案。判断标准：删掉所有翻译，这段文字还有意义吗？没有 → 跟变体走

最小示例：

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

### 3.4 筛选语义（`src/lib/filter.ts`）

- tone=`any` 返回全部；指定档位优先精确命中，无命中回退到未标 tone 的默认变体。**筛选失败优雅降级，绝不返回空数组**——UI 里永远有东西显示。
- 性别维度：`speakerGender` / `addresseeGender` 参与筛选（Stationery 第二句的槽位）；规则是排除显式标了相反性别的变体，未标的保留。`addresseeCount` 只作被动标签。
- 这两轴曾因命中率过低撤出 UI，靠**成熟度阈值机制**恢复：`pnpm coverage` 打印各轴命中数，累积 ~10 个 cell 以上才配拥有控件——**拨了没变化的控件比没有控件更糟**，这是撤与恢复共用的判据。
- tone 档位的展示文案（"casually"…）属 UI 字符串，不属数据——它描述界面措辞，不描述翻译。

### 3.5 内容工作流

操作步骤与风格四规则见 `README.md`（Add a phrase / language / scene + Translation philosophy，唯一维护版本）。意图一句话：让 AI 生成 JSON、review 后合入。辅助脚本 `pnpm new-phrase`（骨架生成）、`pnpm coverage`（覆盖率矩阵）。

---

## 4. 功能与交互

> 本章只记设计意图、约束与"实现注意 ⚠️"陷阱——这些读不出于代码；交互细节与一切像素 / 数值以组件源码为准。

### 4.1 语言选择（双轨）

**Stationery 句行面板是主控件（两视图都在），桌面表格列头额外提供快速换列。**

- **列序 = 选择顺序**：`$selectedLangs` 的数组顺序就是列序（anchor 恒为首列；句行、"Anchored in"选项、卡片语言块全部镜像列序）。添加追加到末尾；**换列是数组原位替换**——点哪列换哪列，用户对列的空间记忆不被打断。⚠️ 消费端不得把它当无序集合按 languages.json 顺序重排——换到数据集尾部的语言会"跳列"。
- **句行**：信笺第一句 `for friends who read English · 中文 … ▾`。母语名直立 serif，anchor 标 accent 色（化解与"Anchored in"的重复）。点开 `LangMenu` 多选面板：搜索 + 分组 + 英文名 + 「Clear」一键清空（除 anchor）；满 5 时 header 提示 + pulse，header 在可滚动面板内 sticky。
- **列头**：每个 `<th>` 是按钮（母语名 + 英文注名 + hover ▾），点开同一个 `LangMenu`；点一门未显示的语言 = **原位换列**（`switchColumn`，anchor 列则 anchor 跟随）。**只换列**——加 / 删 / 搜索都回面板。表头 sticky，与 StickyBar 之间留呼吸空间。
- **LangMenu（共享组件）**：搜索折叠大小写与变音符（"francais" 命中 Français），选完自动清空回全列表；区域分组——⚠️ **组名与顺序从数据首现顺序派生，不得硬编码组清单**，否则新组的语言会静默消失；母语名直立 serif + 英文 exonym 斜体小字（`name===native` 不重复）；2 列网格、暖色 hover、无通用边框。
- **Popover 原语（`lib/popover.ts`）**：所有浮层共享单一 `openPopover` store + `use:popover` action——同刻只开一层、点外关闭、Esc 关闭并把焦点还给触发器。⚠️ 不得退回"每组件各挂 document 监听 + stopPropagation"——两层会同开、Esc 后焦点掉 body。popover id 须实例唯一（同名 slot 在 Stationery 与 StickyBar 各一份）。弹层**条件挂载**（`{#if}`），不作 `visibility:hidden` 常驻——常驻隐藏菜单曾在 DOM 驻留 ~1200 个按钮，还要整套 tabindex 杂技。
- 不可删 anchor（它是一列）/ 最后一门。`$selectedLangs` 持久化，初始化在 stores 模块层——不依赖某个组件恰好先挂载。
- **无障碍**：触发器 `aria-expanded`（`aria-haspopup` 只给真菜单）；选项 `aria-pressed` + `aria-label`；母语名 `lang` + `dir`，BCP-47 从数据取（`langTag`）；菜单方向键巡航（↑↓ 环绕 + Home/End，键盘打开聚焦当前项）；满 5 / 删 anchor 被拒时 `aria-live` 播报（纯视觉 pulse 读屏听不见）；trigger 与 popover 兄弟不嵌套。⚠️ trigger 高亮用更亮的 `--paper-up`——任何比 `--bg` 暗的染色都会让 accent 文字掉破 4.5。

### 4.2 Stationery · 手写体预设句

顶部两行斜体衬线句子，像信件题词：

> *Anchored in* **Chinese**.
> *I write* — **in any tone** — *to* **a friend**, *as* **myself**.

加粗词是 `<SlotPicker>` 实例：斜体 Fraunces、赤陶色、虚线下划线 + 小 ▾；点开斜体选项 popover，选中后 pulse 反馈；Tab / Enter / 方向键完整可用。

| Slot | 值域 |
|---|---|
| `anchor` | 当前已选语言（防绕过 5 上限） |
| `tone` | `any` / `casual` / `neutral` / `polite` |
| `addressee` | `any` / `m` / `f`（"a friend" / "him" / "her"） |
| `speaker` | `any` / `m` / `f`（"myself" / "a man" / "a woman"） |

默认 `anchor=en` / `tone=any`；文案从 `ui/en.json` 读。这句话替代了 chips 墙、legend 说明条、单元格 pill 三件东西——界面从"有很多控件的后台"降维成"一封写了一半的信"。

**⚠️** popover 选项 button 关闭态必须 `tabindex="-1"`，展开才改 0——否则视觉上 opacity:0 时 Tab 焦点仍会进入隐藏选项，浏览器自动滚动把它带进视口（"按 Tab 莫名弹窗"）。`closeAllSlots()` 须重置全部子按钮。

### 4.3 视图切换（ViewToggle）

- `table` / `cards` + `auto`（按视口宽度自动切，阈值在 `ViewToggle.svelte`）；用户主动切换覆盖默认，`$view` 持久化
- `body[data-view]` 驱动 `.view-desktop` / `.view-mobile` 互斥显隐；Toggle 按钮在 Masthead 右上角（Label 角色）
- **卡片视图宽度约束（关键意图）**：卡片容器与场景标题收窄 720px 居中，shell 保持 1240px——右侧自然留出 ~260px 给 TocSide 落座
- 切换淡入淡出，尊重 `prefers-reduced-motion`

### 4.4 场景目录（TocTop + TocSide）

两形态互不重叠，共享全局 `$scrolled` 阈值（`src/lib/scroll.ts`）。

**TocTop**（首屏横向目录，文档流内、Stationery 之下）：Fraunces 斜体（Index 角色），金色 Roman 编号 + `--ink-mute` 场景名，极小圆点分隔；点击平滑滚动；scrolled 后淡出但保留文档流位置（不跳动）；移动端 flex-wrap 换行。

**TocSide**（滚动后右侧 sidebar，fixed 垂直居中，锚定 shell 右内缘）：

- **显隐**（阈值以 `TocSide.svelte` 为准）：卡片视图 scrolled 且 ≥640 显示——卡片列 720px 居中，右侧留白容得下 rail；表格视图 scrolled 且 ≥1024——再窄 rail 会挤压最右译文列；更窄隐藏，导航由回顶钮兜底
- **形态**：静息态是"几列罗马数字浮在留白里"——无背景、无边框；数字站在竖向 rail 侧（金色渐变细线 + 上下两枚 ❋ fleuron，仅展开时现身）。展开态铺**实纸**面板（`--surface-toc-panel`）——半透明会让面板下的表格文字透叠不可读；**无 backdrop-filter**，毛玻璃与纸质气质冲突
- 场景名收起时保留布局宽度（展开不横向跳动），展开逐行 stagger；active 三重线索同时标出：编号变 accent、场景名加重、右侧赤陶短线
- **hover / focus 展开，离开片刻收起；滚动不展开**——展开面板需极宽视口才不叠到表格末列，"滚动自动展开"在真实屏幕必然盖住内容。静息 rail（数字 + 活动 accent + 阅读进度线）即滚动反馈；展开只表达用户意图
- **Active 追踪**：`scroll.ts` 维护 `$activeScene`（滚动 RAF 里按场景块位置判定），TOC 组件订阅

### 4.5 复制（VariantRow）

- 整个变体行点击即复制**纯 `text`**（不带 rom / tag / note）；成功行内 `✓ copied` + 全局 Toast；失败 fallback 到 `execCommand` + 隐藏 textarea
- `role="button"` + `aria-label="Copy [text]"`，键盘 Enter/Space 可触发

**⚠️** `.copy-hint` 须是空 span，"copy" / "✓ copied" 都走 `::before content` 切换——innerText 与 ::before 并存会文字堆叠。

### 4.6 语音朗读（SpeakButton）

`speechSynthesis`，BCP-47 code 取自 `languages.json[lang].tts`；voice 检测精确匹配 → 同语种前缀回退，按质量启发式排序（Natural / Enhanced / Google 加分）；**无 voice 或语言无 tts code 时按钮不渲染**——死图标是噪音不是功能。不做主交互（很多用户静音浏览），能用时有价值。

### 4.7 星标收藏（StarButton）

锚点列右上角星标（两视图同位），`$starred: Set<phraseId>` 持久化；有收藏时 Stationery 下出现 "Starred only" 开关 chip（开关状态会话级），无收藏不显示。收藏是短语级，不细化到变体——保持简单。

### 4.8 深浅色（ThemeToggle）

`light / dark / system` 三态持久化；`<html data-theme>` + 两套 CSS 变量。**防 FOUC**：`<head>` 里 inline script 阻塞式读 localStorage 设置 `data-theme`，早于样式表应用。按钮在 Masthead 右上。

### 4.9 锚点列与译文列

**锚点列**：固定首列，淡金棕底 + 右侧浅 border；表头显示锚点语言本地名。每行三层：大字（Headword 角色）取该短语筛选后的**第一条变体**、小斜体 rom、小斜体 gloss。缺锚点翻译显示淡斜体 `—`，不阻断整行。

**译文列**：每格竖向堆叠变体行，行间虚线分隔。行 = 大字（Entry 角色）+ rom + tag line（仅 `tone=any` 时显示，渲染成 "— casually" / "he writes"）+ note（Aside 角色）+ 右上角 copy hint（hover 显现）。被筛空的格子显示斜纹纹样占位。

卡片视图的卡片头复用锚点列三层结构，下接其他语言块（顺序镜像列序）。

### 4.10 StickyBar

scrolled 后视口顶部淡入：`[致·远·方] │ I write — [tone] — to [addressee], as [speaker]`。左侧 mark 点击回顶；**不含 anchor slot**——锚点切换频率极低，留在 Stationery。slot 与主 Stationery 共享 store，双向同步。

**表面**：近实纸底 + `backdrop-filter` 毛玻璃——浮动工具栏与内容是"不同层级"，玻璃感只在这里成立（TocSide 不是工具栏，那里不用）；blur 只是增强，可读性不得依赖它。

窄屏隐藏 mark 只留句子；淡出时顺手 `closeAllSlots()`。不做 TOC 圆点跳转——TocSide 已覆盖导航。

### 4.11 PWA

- manifest + SW（`@vite-pwa/astro`，`autoUpdate` 后台更新下次生效）；precache 只含 shell（短语数据经 `import.meta.glob` 打包进 JS）
- **字体不 precache**——CJK Noto 按 unicode-range 拆上百个子集（全量几十 MB），改运行时 CacheFirst
- 离线全功能可用（TTS 取决于浏览器）；不做自定义 install prompt，交给浏览器原生 UI

**⚠️** Astro 7 下 `@vite-pwa/astro` 不再自动注入 `registerSW`——由 Layout 在 PROD 手动挂载，否则离线**静默失效**；离线测试守着这条。

---

## 5. 设计系统

### 5.1 字体（角色制）

字族栈与角色 token 数值以 `src/styles/tokens.css` 为准。

**基因**：Masthead 的辨识度来自 Fraunces 的大光轴刻（高笔画对比）+ 克制字重 + 斜体点缀。**角色制**让这个基因以递减强度渗透正文层级——全站字体按角色归口 tokens，**组件不得自设 `font-variation-settings` 裸值**：各自配字必然散成杂拼。

| 角色 | 用途 | 意图 |
|---|---|---|
| Display | Masthead、场景标题、404 | 大字号天然高对比，负字距 |
| Headword 头词 | 锚点列大字、卡片头字 | 以光轴替代加粗取得分量 |
| Entry 词条 | 变体正文 | 比 auto 高一档的笔画对比 |
| Aside 旁注 | rom / gloss / 语域行 / 注名 / 空态 | 一个注音声部：serif italic 小字 `--ink-mute` |
| Index 索引 | 语言菜单母语名、TOC 条目 | 母语名直立——CJK 在 italic 下是丑的伪斜体 |
| Label 标签 | 全部 sans 小帽标签 | 统一一档；登记例外仅 Footer 署名与 StickyBar 紧凑变体 |

- **Fraunces** 只自带 Latin（西里尔由 Noto Serif SC 的 cyrillic 子集承担）；CJK 回退 Noto Serif SC/JP/KR；首屏 UI 标签用 `--font-serif-local`（swap-safe 栈，§8.1）
- **Instrument Sans** 做 UI 小字标签，只用 400/500
- **opsz 是唯一的表现轴**（无 SOFT/WONK）；CJK 回退字体无 opsz 轴、自动忽略，安全

### 5.2 颜色 tokens

数值以 `tokens.css` 为准（light / dark / system 三块）。命名两层：原色（bg / paper / paper-up / ink / ink-soft / ink-mute / accent / gold / gold-ink / on-accent / line）+ 语义 surface（`--surface-*` 叠加层）。

- 暖纸色系——背景米色、墨色文字、赤陶 accent、金色装饰，"信笺"气质的来源
- `--gold` 是**装饰色**，当文字远不过 AA——文字金用更深的 `--gold-ink`；`--on-accent` 是 accent 填充上的文字色，随主题反向
- 暗色不是反色，是"夜里的同一张纸"：纸面压暗、墨色提亮、accent 提亮一档
- 两套均过 WCAG AA（正文 4.5:1，大字 3:1），对比度在 CI 门禁内（light + dark 各扫一遍）。⚠️ 基准背景是页面底色 `--bg`（比 `--paper` 还深），文字落其上对比度最低——只对 paper-up 验证会漏掉这档

### 5.3 间距与动效

- 间距与圆角数值见 `tokens.css`；圆角只有两档语义（微圆卡片 / 药丸 chip），正圆不用
- **动效 tokens**：时长按用途分档（hover / switch / feedback / reveal / entrance），easing 三种（`--ease-out` 主通用、`--ease-spring` 轻微 overshoot、linear 仅机械感属性）；TOC 的 JS 时序常量在 `scroll.ts`
- **命名动画**：`rise`（卡片入场）、`pulse`（slot 切换高亮）、`nudge`（满 5 提示横移）、TOC 场景名 stagger
- 所有动画尊重 `prefers-reduced-motion`——`global.css` 一条全局兜底覆盖全部动画与过渡
- ⚠️ **首屏大文本块的入场动画只用位移、不用透明度**——LCP 元素做 opacity 入场会把绘制记录点推迟到动画之后
- ⚠️ **lightningcss 会把独立的 `animation-timeline` 合并进 `animation` 简写**——规范禁止 timeline 入简写，浏览器随之丢弃整条声明（动画不生效且无报错）。解法：经自定义属性间接引用（`animation-timeline: var(--xx)`），压缩器即无法折叠

---

## 6. 技术选型

| 层 | 选择 | 备注 |
|---|---|---|
| 静态生成器 | **Astro** | Islands 架构、零 JS 默认、GH Pages 兼容 |
| 交互组件 | **Svelte** | 只用于有状态 islands，bundle 极小 |
| 语言 | **TypeScript** | strict 开 |
| Schema | **Zod** | 构建时显式校验（§3.2），不走 Content Collections |
| 跨组件状态 | **nanostores** | 持久化用 `@nanostores/persistent` |
| 样式 | **Vanilla CSS + CSS Variables** | 不用 Tailwind / CSS-in-JS |
| PWA | **@vite-pwa/astro** | Workbox 内核 |
| 字体 | **@fontsource-variable/fraunces** + **@fontsource/instrument-sans** | 自托管，离线可用 |
| 包管理 | **pnpm** | 快且省磁盘 |
| 部署 | **GitHub Pages** | 经 GitHub Actions |

版本号以 `package.json` 为准——每周 Dependabot 自动升级（§7.4），写死必烂。

**不选的方案**：Next.js / Nuxt（重，static export 路径复杂，SSR 用不上）；SvelteKit adapter-static（可行，但 Astro 在内容站上更顺手）；纯 HTML/CSS/JS（无类型安全，规模化会乱）；React（bundle 大、hydration 重）；Tailwind（诱导通用型样式思维，本项目需要手工雕琢）。

**不引入的依赖**：图标库（自己写 SVG，总共五六个）、UI 库、动画库（Svelte transition 够了）、状态管理大件。测试是唯一的例外：Playwright + axe-core 做冒烟 / 无障碍 / 离线回归（§7.5）——它原本也在"不用"之列，放开依赖 major 自动合并后"肉眼验"等于不验，遂反转。

---

## 7. 结构、部署与 CI

### 7.1 目录骨架

```
distant-friends/
├── public/            # favicon、og-image、PWA icons
├── src/
│   ├── components/    # astro/（纯静态）+ svelte/（交互 islands）
│   ├── data/          # 数据文件（§3.2）
│   ├── lib/           # schema / stores / filter / tts / scroll / clipboard / storage / popover / slot-options
│   ├── content/ui/    # UI chrome 字符串
│   ├── styles/        # tokens / global / typography
│   └── pages/         # index + 404
├── scripts/           # new-phrase / coverage / export-review
├── tests/             # Playwright（冒烟 / axe / 离线）
└── .github/workflows/ # 部署 + CI + dependabot 自动合并
```

### 7.2 GitHub Pages

仓库名非 `<user>.github.io` 时在 `astro.config.mjs` 配 `site` + `base`；配自定义域（`public/CNAME` + DNS CNAME）后 `base` 去掉。

### 7.3 Actions 与分支

pnpm + Node 22、`upload-pages-artifact` → `deploy-pages`，Pages Source 选 GitHub Actions。分支策略 dev → main（Vercel preview）→ release（Pages），细节见 README。

### 7.4 依赖自动更新（Dependabot）

每周一扫描 npm 依赖与 Actions 引用，对 **dev** 开 PR（升级走 dev → main → release 管线，dev 不落后于 main）。自动合并的唯一门禁是 `pnpm build` + `pnpm check` + `pnpm test`，绿灯即 squash 合并——**patch / minor / major 一视同仁，无人工审**；不过则留红叉。minor+patch 合成单 PR，major 单独成 PR——一个破坏性 major 只挡自己。仓库 `allow_auto_merge` 关闭，故门禁内置于 workflow 步骤，不依赖分支保护。

⚠️ `dependabot.yml` 从默认分支读取；auto-merge workflow 须位于 PR 的 base 分支（dev）才会触发。

### 7.5 测试与 CI

`tests/`（Playwright）对 `astro preview` 的**生产构建**跑：冒烟（渲染、复制 + toast、SlotPicker、主题、星标过滤、键盘穿行）、axe 全量 WCAG 2.1 A/AA 含 `color-contrast`（light + dark 各一遍）、离线（SW 缓存后断网仍可用）。`pnpm test` 跑 chromium（门禁）；`pnpm test:all` 跑三浏览器矩阵。接入 `ci.yml`（人工 PR 与 dev/main push）与 dependabot 门禁——键盘 / 读屏行为是 axe 静态扫描的盲区，靠冒烟测试钉住。

---

## 8. 质量门禁

### 8.1 性能预算

按实测校准（初版数字是建站前的估计，与自托管特色衬线 + 23 语言数据的现实不符；校准史在 §10）：

- **Lighthouse**（slow-4G 模拟）：A11y / BP / SEO = 100，**Performance ≥ 90**
- **CLS** ≈ 0（字面意义的 0——首屏不允许任何字体 swap 重排）、**TBT** < 100ms
- **阻塞 CSS** < 20KB（CJK @font-face 声明保持异步加载）、**首屏关键传输** < 250KB
- 不为分数牺牲首访字体身份：任何字体都不用 `font-display: optional`——⚠️ 实测它触发 Chrome 预取全部 unicode-range 相交子集，模拟慢网 FCP 反而翻倍

**达成策略**：Fraunces standard 轴，拉丁两支 + Instrument Sans latin 预载防 swap 位移；CJK @font-face 异步 + 系统宋体 / 明朝体兜底；**首屏 UI 标签用 `--font-serif-local`**——栈里没有晚到的 webfont 就没有重排（短语内容保持 Noto 身份）；岛屿水合分级（滚动后才可见的岛 `client:idle`，首屏可点的保持 `client:load` 防死点击）；场景块 `content-visibility: auto`；数据随 JS 打包不走 client fetch；无第三方脚本、无 analytics。

### 8.2 可访问性承诺

- 所有交互有可见 `:focus-visible`；icon-only 按钮必有 `aria-label`
- Toast `role="status"` + `aria-live="polite"`；语言切换 `aria-pressed`；译文元素带 `lang`
- 对比度 AA（正文 4.5:1，大字 3:1，双主题门禁）；不用颜色作唯一信息载体
- 键盘完整可操作：Tab / Enter / Space / Esc 关浮层并归还焦点（Toast 是瞬态非交互件，无 Esc 要求）
- 尊重 `prefers-reduced-motion`；`<html lang="en">`；`h1` 只一个
- 阿拉伯语（RTL）：内容级 `dir="auto"`，界面仍 LTR

---

## 9. 未来可能（不承诺）

1. ~~**UI 中文化**~~ — ✗ 不做：受众主体是不懂中文的国际朋友，UI 锁英文自洽。切换结构保留但不补译文
2. **搜索框** — 输入任一语言或拼音定位短语（fuse.js）
3. **多标签（tags）** — 与 scene 正交的标签系统
4. ~~**分享链接**~~ — ✗ 不做（ROI 偏低）：URL 参数复刻朋友看到的视图
5. **导出为图片** — 短语做成可分享卡片
6. **预生成音频** — 构建期神经 TTS 烧静态音频（~30-40MB，懒加载），所有浏览器一致高质量发音且合离线原则；代价是构建复杂度 + 资产体积，引入前单独评估
7. **反向查找** — 朋友发来一句外语查意思（索引反转，工程量大）
8. **变体级收藏**
9. **内容贡献渠道** — GitHub Issues 表单 + PR 流程（不做 CMS）
10. **快捷键** — 表内导航 / 复制的键盘加速（Tab 流已完整可用，非必需）

---

## 10. 决策日志（append-only）

> 只记"改变方向"的决策：日期 + 方向 + 原因，≤2 行。机制细节在 §3-§8 主场；日常交付不记（git / release 已覆盖）。

- **2026-04-22** · 大简化定调：所有语言平等、tone 全局固定、手写体 Stationery 替代 chips 墙 / legend / pill、UI 锁英文。
- **2026-04-26** · addressee slot 撤除（命中率过低，拨动无效违反"内容是主角"）；确立成熟度阈值机制（≥10 cell 再考虑恢复）。
- **2026-04-28** · 默认锚点 zh → en：新增语言后受众主体是不懂中文的国际朋友。
- **2026-04-29** · 单一 phrases.json 拆为 per-phrase 文件——短语量增长后单文件无法支撑独立生成 / review / diff。
- **2026-04-29** · 引入 `reviewed` 字段标记母语者审核。
- **2026-06-10** · 移除 `reviewed` 字段（反转上条）：审核流程始终未成形，字段沦为噪音。
- **2026-06-10** · 翻译四规则确立（README）；当日全库审计删 211 个变体。
- **2026-06-11** · 场景体系定为"小而多"（11 场景）；排序 = 逻辑分块优先、块内按频率、高频不沉底。
- **2026-06-11** · 砍同义对时标准形存活、casual 重复出局；每格必须有中性默认（除非概念本身无正式语域）。
- **2026-06-12** · 阿拉伯语不做全局 RTL，只做内容级 `dir="auto"`。
- **2026-06-12** · 字体不进 SW precache（反转原方案）：CJK 子集全量几十 MB，改运行时 CacheFirst。
- **2026-06-12** · TTS 无 voice 不渲染（弃"禁用 + tooltip"）；voice 按质量启发式排序；Starred only 会话级。
- **2026-06-12** · Fraunces full 轴 → standard 轴（-120KB，弃 SOFT/WONK）；CJK 声明移出阻塞 CSS。Lighthouse 56→88。
- **2026-06-12** · 确立元原则：性能数字非铁律，以实测校准并记日志；方向性原则不动摇。
- **2026-06-12** · 性别控件恢复（阈值机制触发：两轴各 60）：Stationery 第二句加 addressee + speaker 槽位。
- **2026-06-13** · tone 四档收三档：close 档全库命中 0.5%，"会动但无效的选项是温柔的陷阱"；close 并入 casual，旧持久化值迁移。
- **2026-06-27** · 引入 Dependabot 自动合并（对 dev 开 PR，minor+patch 合并单 PR、major 单独手动审）。
- **2026-06-28** · major 也自动合并（反转上条）：维护者不审 PR diff，"手动审"等于永不合；build + check 绿灯即合。
- **2026-06-28** · 引入测试（反转"不用测试框架"）：major 自动合并后肉眼验形同虚设；当天抓到 SW 注册失效与按钮嵌套两个真实回归。
- **2026-06-28** · 对比度补齐 AA：低对比判定为可读性失误而非风格；新增 `--gold-ink` / `--on-accent`，color-contrast 入门禁。
- **2026-06-28** · 语言选择改造：23 门 chip 墙 → 信笺句行 + 分组弹层；顺修默认 anchor 硬编码 bug。
- **2026-06-29** · 双轨化：桌面语言操作搬进表格列头；亮模式次要文字提对比；trigger 高亮改亮色方案。
- **2026-06-29（二）** · 再收敛：句行面板两视图常驻为主控件、表头只换列、LangMenu 重做视觉（直立母语名 + exonym）。
- **2026-07-02** · 语言交互工程收口：列序 = 选择顺序（原位换列）、popover 原语统一浮层、弹层条件挂载、分组从数据派生。
- **2026-07-02（二）** · 进入存量设计迭代期，立 §11 账本：功能冻结，转入跨会话持续打磨。
- **2026-07-03** · 换列动画取"新墨写入"（列头先行、逐行级联），弃 FLIP / View Transitions——表格列几何过渡工程不成立，且"换语言是重写一栏字，不是挪家具"。
- **2026-07-03（二）** · 性能再校准：修复语言改造引入的 CLS 回归（0.115→0）+ 水合分级，Perf 59→96；确立首屏 swap-safe 栈规则，否决 `font-display: optional`。
- **2026-07-03（三）** · wavy 墨线当日反转（用户否决）：tight 波浪是拼写检查的既有语义——装饰借形，先问该形状在通用 UI 里已有什么含义。
- **2026-07-03（四）** · 字体走角色制（用户反馈"Masthead 精致、其他中下水平"触发）：角色 token 是唯一入口，基因用 opsz 而非字重下沉。
- **2026-07-07** · R13–R18 实验整体撤销，站点定格 R12（用户裁决）：工艺打磨可持续；"突破式"重造不再自行发起——视觉大改先出截图拿认可，禁止无人验收的批量交付。

---

## 11. 设计迭代账本

> 功能冻结后的打磨工作账本。两个迭代周期均已闭环；现行规则**一轮一验**（§10 2026-07-07）。

### 迭代原则

- 打磨**已有**功能的设计——不新增功能（§9 红线不动）、不改首屏形态、不造新交互物件
- 信笺气质是底色：改动要让它更像一封信，而不是更像一个 app
- **一轮一验**：每轮 = 审计（截图）→ 设计 → 实现 → 真实浏览器验证 → 测试全绿 → 提交 → 交用户裁决，认可后才开下一轮
- 动手前先重截当前状态——视觉问题以截图证据为准，不凭记忆
- 浮层复用 popover 原语（§4.1），不发明第四种协调机制；AA 是地板

### 开放项

- [~] **打印样式**（已落地，**待用户裁决**，不合意一个 revert 即撤）：`global.css` 尾部单个 `@media print` 块，屏幕零影响——交互 chrome 全隐、纸面模拟让位真实纸张、`content-visibility` 打印强制 visible（否则折叠线下场景不排版）、sticky 表头改 static（原生 thead 分页重复）、场景标题不跨页断开。⚠️ 覆盖 svelte 作用域样式需 `!important`
- [ ] **真实设备手测**：iOS Safari / Android Chrome 真机复核

### 周期存档

- **第一周期 R1–R8（2026-07-02 ～ 07-03）**——高频功能细节强化：换列「新墨写入」、收藏仪式感、发音墨晕、TOC 阅读进度线、语言面板键盘手感、复制金线；清尾：触屏可供性、404 印章、表格行解剖（348→302px）、移动端回顶钮。
- **第二周期 R9–R12（2026-07-03）**——「更精致、更艺术品、更惊艳，同时保证性能」。存活四轮：雕版工艺 + 暗色烛光（R9，并修复 CLS 回归、Perf 59→96）、浮层 / Toast / 卡片工艺统一（R10）、字体角色制（R11）、版面家具（R12）。其后 R13–R18 六轮"突破式"实验于 07-07 被整体否决回退（§10）；提交留存于 git 历史 / reflog。

### 轮次日志

- **R12 · 2026-07-03** — 版面家具收笔：Nº 编号字法、Footer 镜像收笔线、暖色 `::selection`（暗色 AA 需专用 token）、标准 `scrollbar-color`（`::-webkit-scrollbar` 会强制 macOS 常显滚动条，不用）。
- **R11 · 2026-07-03** — 字体角色制落地（§5.1）：角色 tokens、八组件归口、死代码清除；截图对比验证光轴对比肉眼可辨。
- **R10 · 2026-07-03** — 清尾四件（浮层内衬光、章节留白、Toast 纸条化、卡片角线）+ noise 混合层实测结案 + wavy 墨线按用户反馈当日回退。
- **R9 · 2026-07-03** — 五个工艺层落地（雕版扉页、纸张物性、手写墨线、入场编排、暗色烛光）+ 性能修复。教训：性能回归会躲在功能迭代后面——开新周期首件事重测基线。
- **R8 · 2026-07-03** — 表格行解剖 348→302px（截图对比法）。第一周期收官。
- **R7 · 2026-07-03** — 移动端回顶钮；表格解剖勘察（列宽比是死胡同）。
- **R6 · 2026-07-03** — TocSide 交互改判（滚动只点亮静息 rail，展开只由 hover/focus）；StickyBar 移动端单行。
- **R5 · 2026-07-03** — 清尾：触屏 copy 常显、404 印章、scene id 唯一化、slot options 去重。
- **R4 · 2026-07-03** — 语言面板键盘手感（键盘开 → 搜索聚焦、Levenshtein typo 建议）+ 复制金线（inline background-size 而非 SVG stroke——SVG 在多行文本上会断）。
- **R3 · 2026-07-03** — 首星布局跳动修复、发音墨晕、TOC 阅读进度线（scroll-driven CSS）。教训：账本条目写自审计推测，动手前先读现状。
- **R2 · 2026-07-03** — 换列「新墨写入」（`$freshLang` 瞬态 + 逐行级联）+ 收藏仪式感（星标 pop + 金屑 + 场景星数微标）。
- **R1 · 2026-07-02** — 全面审计（11 张全状态截图）+ 建账。落地：浮层近实纸化、移动端断行修辞（标点不孤悬行首）、`lang` 裸码残留修复。

---

## 12. 附录

### A. 命名与提交约定

- 文件 kebab-case；组件 PascalCase；store camelCase（用时加 `$`）；CSS 类 kebab-case 松散 BEM；类型 PascalCase 无 `I` 前缀，Zod 导出类型加 `T` 前缀
- Commit 按 Conventional Commits 松散版（feat / fix / style / refactor / docs / chore），每条要能让三个月后的自己看懂
- 决策记录在 §10（单文件日志足够，不开 ADR 目录）

### B. 手测回归清单

> 大半已由 Playwright 冒烟自动覆盖（§7.5）；本清单供真机 / 视觉手测复用（§11 开放项）。

- [ ] 首屏：TocTop 可见、TocSide / StickyBar 不可见
- [ ] 滚动过阈值：TocTop 淡出、TocSide 淡入（cards@≥640 / table@≥1024）、StickyBar 淡入
- [ ] Stationery 各 slot 展开选择并同步数据；复制任一行出 `✓ copied` + Toast
- [ ] 语言面板满 5 时点第 6 个：header 提示、面板不关；母语名 + 英文注名分组显示
- [ ] Tab 穿行不出现"莫名弹窗"；TocSide hover/focus 才展开、滚动只点亮 rail
- [ ] 切换视图：卡片恒 720px max；收藏后 "Starred only" 出现、过滤后空场景整块隐藏
- [ ] hover 变体行出喇叭，点击朗读不触发复制；阿拉伯语文本右对齐、rom 仍左对齐

### C. 构建史

- **M0 骨架**（v0.1.0）：依赖、目录、lib 五件套、Actions 部署
- **M1 对齐 demo**（v0.1.0/0.1.1）：7 语言 × 11 短语迁移、全部 token、双视图
- **M2 深色 + 收藏**（v0.2.0/v1.0.0）：三态主题、星标过滤、AA 验证
- **M3 语音 + PWA**（v1.0.0）：TTS、manifest、SW precache、离线测试
- **M4 打磨**：axe 双主题门禁、Lighthouse 达预算、README、404。剩：键盘穿行手测、真机手测（§11 开放项）
- **M5 内容扩充**（持续）：规模以 `pnpm coverage` 为准，演进史见 [GitHub Releases](https://github.com/Chimelight/distant-friends/releases)
- 三个演进版 demo（v1 起点 → v2 反面教材 → v3 M1 视觉基准）已不在仓库，站点视觉早被迭代超越，不再是任何基准

### D. 文档版本史

- **v1.0–v1.3**（2026-04-21~23）— 初版到交互收尾：变体系统、所有语言平等、Stationery 替代 chips/pills、TOC 双形态
- **v1.5**（2026-04-26）— addressee slot 撤除 + 成熟度阈值机制
- **v2.0**（2026-06-12）— 体例重构：确立"事实层=代码、意图层=本文档"分层，删全部事实复制品约 -350 行，新设决策日志
- **v2.1**（2026-07-02）— 新设设计迭代账本；语言交互章重写
- **v2.2**（2026-07-03)— 第二周期 as-built：字体角色制、性能再校准
- **v2.3**（2026-07-08）— 编排重构：决策日志恢复严格时序、账本压缩、一轮一验入原则
- **v2.4**（2026-07-10）— 体检手术：修 5 处过期事实、去多重记账、清除事实层复制约 -220 行、废除 as-built 快照体例
- **v2.5**（2026-07-10）— 入口层：阅读地图替代"全文读完"，新增仓库 CLAUDE.md 指针层；评估后不拆分本文档
- **v2.6**（2026-07-10）— 立正文写法规则：无时间戳当下真相，补丁注记禁入正文
- **v3.0**（2026-07-11）— **全文重写**（用户指令）：按顶层设计重排大纲并重新编号，决策日志压缩为紧凑年表（每条 ≤2 行），⚠️ 陷阱归位到所守护的章节，每个事实唯一主场。**新旧编号对照**：数据模型 §5→§3、功能 §6→§4、设计系统 §7→§5、技术选型 §3→§6、结构/部署 §4+§10→§7、性能/无障碍 §9+§8→§8、未来 §12→§9、决策日志 §13→§10、迭代账本 §15→§11、里程碑 §11→附录C、附录 §14→§12（旧账与旧提交里的 § 引用按此表解码）

---

*文档版本 v3.0 · 最后更新 2026-07-11（全文重写：新大纲 + 紧凑年表 + 陷阱归位——明细见附录 D）*
