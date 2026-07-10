# 致 · 远 · 方 — 设计与开发文档

> 一份多语言日常问候对照站。给与世界各地朋友保持联系的人。

本文档是项目**意图层**的真相源。**按任务选读**（阅读地图见 §0 末尾），不必全文读完；动 §0/§13/§15 之前必读 §0。

---

## 0. 本文档的维护规则

真相分两层，不要混：

1. **事实层以代码和数据为唯一真相**——目录结构、schema 字段、场景列表、token 数值、UI 文案，一律看源文件（`src/lib/schema.ts` / `src/data/scenes.json` / `src/styles/tokens.css` / `src/content/ui/en.json`…）。本文档不复制这些内容，只给路径。历史教训：曾经复制过的每一份事实都烂掉过（"8 种语言"、"6 个场景"、"960px 阈值"都在文档里多活了一个多月）。
2. **意图层以本文档为唯一真相**——为什么这么做、红线、被否决的方案、踩过的坑。代码说不出"为什么"，这是本文档存在的理由。

改动代码后的维护义务：

- 推翻既有设计决策 → 在 §13 决策日志**追加**一条（永不改写旧条目，反转本身是信息）。**追加 = 接在列表末尾**，全表严格时间升序，同日多条以（二）（三）标次序——插入中段会毁掉日志的先后语义（v2.3 曾为此返工重排）。**新条目 ≤3 行**：方向 + 原因，机制细节归 §6/§15，条目只给指针（v2.4 起；旧长条目不追改）
- 完成一轮设计迭代 → §15 轮次日志**一行**收束该轮（含该轮独有教训）；开放项勾销；周期闭环后压缩进「周期存档」一段。**同一事实不三处记账**：细节归轮次日志，方向性因果归 §13，条目正文不复述
- 完成里程碑任务 → §11 打勾；里程碑整体完成后压缩成一行
- 其余章节（尤其 §6）**不承载**实现细节：只写意图、约束、⚠️陷阱与源码指针，像素/数值规格一律不入册（v2.4 起废除"as-built 快照"体例——快照必烂，且以权威口吻误导）

**阅读地图**（v2.5 起，废除"全文读完再动手"——按任务选读）：

- 改内容（短语 / 语言 / 场景）→ §5 + README
- 设计打磨轮 → §15 + §13 末尾数条 + 相关 §6 小节 + §2
- 性能 → §9 · 无障碍 → §8 + §7.2 · 部署 / CI / 依赖 → §10
- 动文档自身（§0 / §13 / §15）→ 本节全部

---

## 1. 项目愿景

**它是什么**
一个温暖、精致、离线可用的日常问候短语对照站，覆盖 60+ 条朋友间常用短语 × 23 种语言（可扩展）。点击即复制、可听发音、可收藏、深色浅色切换。

**它不是什么**
- 不是旅游短语手册（"去机场怎么走"）
- 不是语言学习工具（没有练习、测验）
- 不是翻译器（不接入翻译 API）
- 不是社交/UGC 平台（只作者编辑内容）

**核心用户**
1. 作者本人（日常在光遇等社区结识外国朋友）
2. 作者的朋友们（可能不懂中文，所以 UI 主语言是英文）
3. 未来：任何想用它的人

**核心价值**
在跨语言友情里，**准确的温度比准确的语法更重要**。宁可少而精，也不要多而滥。

---

## 2. 不可妥协的设计原则

这五条是红线，后续所有决策以此为准绳。**方向性原则（1-4）不动摇；具体数字指标是初版估计（也是 AI 写的），以实测为准修订——修订记入 §13 决策日志。**

1. **美学优先。** 编辑体/信笺感。绝不允许"AI 网页模板"的观感（Inter 字体、紫色渐变、通用圆角卡片）。
2. **内容是主角。** UI 消隐让位给短语本身。装饰元素存在是为了衬托文字，不是秀技。
3. **一次加载，永久可用。** PWA 离线优先，任何功能在无网环境下都能用（TTS 除外，取决于浏览器）。
4. **键盘可达 + 屏幕阅读器友好。** 不能因为美学牺牲可访问性。AA 级对比度起步。
5. **轻而快。** 性能预算见 §9（按实测校准）。

---

## 3. 技术选型

### 3.1 核心栈

| 层 | 选择 | 备注 |
|---|---|---|
| 静态生成器 | **Astro** | Islands 架构、零 JS 默认、GH Pages 兼容 |
| 交互组件 | **Svelte** | 只用于有状态 islands，bundle 极小 |
| 语言 | **TypeScript** | strict 开 |
| Schema | **Zod** | 构建时显式校验（§4 / §5.6，不走 Content Collections） |
| 跨组件状态 | **nanostores** | 持久化状态用 `@nanostores/persistent` |
| 样式 | **Vanilla CSS + CSS Variables** | 不用 Tailwind/CSS-in-JS |
| PWA | **@vite-pwa/astro** | Workbox 内核 |
| 字体 | **@fontsource-variable/fraunces** + **@fontsource/instrument-sans** | 自托管，离线可用 |
| 包管理 | **pnpm** | 比 npm 快且磁盘省 |
| 部署 | **GitHub Pages** | 通过 GitHub Actions |

版本号以 `package.json` 为准——每周 Dependabot 自动升级（§10.4），写死必烂。

### 3.2 不选的方案及理由

- **Next.js / Nuxt**：重，static export 在 GH Pages 上路径处理复杂，SSR 能力用不上。
- **SvelteKit adapter-static**：可行，但 Astro 在内容驱动站点上文档和 Content Collections 更顺手。
- **纯 HTML/CSS/JS**：当前 demo 的路子。扩展到 PWA + 深色模式 + 收藏 + 40+ 短语时会乱；没有类型安全。
- **React**：bundle 更大、hydration 重，Svelte 在这种小组件上更优雅。
- **Tailwind**：会诱导"通用型"样式思维，本项目需要手工雕琢，vanilla CSS 更匹配。

### 3.3 不引入的依赖

**不用**：图标库（图标自己写 SVG，总共五六个）、UI 库（组件自己写）、动画库（Svelte transition 够了）、状态管理大件（nanostores 就够）。

测试框架原本也在"不用"之列（"项目太小，肉眼验 + 手动清单"）——但在放开依赖 major 自动合并后，"肉眼验"等于不验。已反转：引入 Playwright + axe-core 做冒烟 / 无障碍 / 离线回归，见 §10.5 与 §13（2026-06-28）。

---

## 4. 项目结构

```
distant-friends/
├── public/            # favicon、og-image、PWA icons
├── src/
│   ├── components/    # astro/（纯静态）+ svelte/（交互 islands）
│   ├── data/          # phrases/（每短语一文件）+ phrases.ts 聚合 + languages.json + scenes.json
│   ├── lib/           # schema / stores / filter / tts / scroll / clipboard / storage
│   ├── content/ui/    # UI chrome 字符串（en.json）
│   ├── styles/        # tokens / global / typography
│   └── pages/         # index + 404
├── scripts/           # new-phrase / coverage / export-review
└── .github/workflows/ # Pages 部署
```

完整文件清单以仓库为准（§0 规则 1）。

**数据文件的位置说明**：`src/data/` 而不是 `src/content/collections/`。原因：内容数据由显式 Zod 校验把关（`src/lib/schema.ts`，构建时跑），不需要 Content Collections；短语按 per-phrase 文件组织（`phrases/<id>.json`，由 `scripts/_load-phrases.mjs` / `src/data/phrases.ts` 聚合），单条短语可独立生成、review、diff。

---

## 5. 数据模型

### 5.1 设计原则

五条硬原则：

1. **所有语言平等**。不存在"源语言"，每种语言都是同一概念的一个 realization。中文、英文、日文、泰文都是 `languages.json` 里并列的一员。
2. **锚点列是用户选择，不是数据属性**。任何一种语言都可以被用户拉到锚点列，切换不影响数据。
3. **语境维度全局固定**。Tone 就是 `casual / neutral / polite` 三档（2026-06-13 起，原四档），不扩展。每种语言只在它真实有区分的层级上填变体，没有就不填。
4. **缺翻译不是错误**。构建时列出覆盖率报告，运行时该格显示占位纹样，不 hard fail。
5. **结构便于 AI 协作**。`languages.json` + `scenes.json` 两个扁平文件，加 `phrases/` 下每条短语一个 JSON：单条短语可独立生成、review、diff，AI 一次改一个文件不殃及全库。（v0.1 曾用单一 `phrases.json`，随短语数量增长拆分为 per-phrase 文件。）

### 5.2 文件组织

两个扁平 JSON + 一个短语目录 + 一个 UI 文件：

```
src/data/
├── phrases/           # 每条短语一个 JSON 文件（<id>.json，含各语言 gloss + variants）
├── phrases.ts         # 聚合模块：import.meta.glob 读取 phrases/ 全部文件
├── languages.json     # 语言元信息（code/native/tts/rtl）
└── scenes.json        # 有序场景列表

src/content/ui/
└── en.json            # UI chrome 字符串（v1 只出英文）
```

### 5.3 Schema — 语言（`languages.json`）

字段定义见 `src/lib/schema.ts` 的 `Language`。语义要点：

- `defaultOn`：首次访问时默认勾选的语言（加上 anchor 后控制在 5 以内）
- `defaultAnchor`：标记哪一种是首次访问的锚点（仅一个为 true；v0.2.0 起为英文）
- 语言不声明 `dimensions`——tone 三档对所有语言统一；哪些变体有 tone 标签取决于该语言该短语下的实际内容

### 5.4 Schema — 场景（`scenes.json`）

当前场景列表以 `src/data/scenes.json` 为准（数组顺序 = 页面顺序）。字段语义：

- `em` 字段：标题里要斜体强调的那个词（跟 demo 视觉一致，给"Warm **_Wishes_**"这种排印）
- 顺序就是页面显示顺序（TOC 和内容都按数组顺序）

### 5.5 Schema — 短语（`phrases/<id>.json`）

核心数据在这里。每个文件一个短语对象（文件名 = 短语 id）：

```json
{
  "id": "greeting-hello",
  "scene": "greetings",
  "order": 1,
  "trans": {
    "zh": {
      "gloss": "问候",
      "variants": [
        { "text": "你好",  "rom": "nǐ hǎo"  },
        { "text": "嗨",    "rom": "hāi",     "tone": "casual" },
        { "text": "您好",  "rom": "nín hǎo", "tone": "polite", "note": "Honorific; to elders or strangers." }
      ]
    },
    "en": {
      "gloss": "a greeting",
      "variants": [
        { "text": "Hello" },
        { "text": "Hi", "tone": "casual" }
      ]
    },
    /* …one block per language, 23 in total */
  }
}
```

字段定义、类型与约束以 `src/lib/schema.ts` 为准（§0 规则 1）。语义要点：`gloss` 是该语言对这个概念的小标签（"问候" / "une salutation"），显示在锚点列大字下方作注脚；`variants` 至少一条；变体的全部维度字段（`tone` / `speakerGender` / `addresseeGender` / `addresseeCount` / `region` / `rom` / `note`）可选——只填真实区分（§5.1 原则 3）。

**rom / tone / note 都跟 variant 绑定**（不属于 UI 文案），原因是它们是在描述"这个翻译"，不是在描述"界面"。判断标准：如果删掉所有翻译，这段文字还有意义吗？没有 → 跟 variant 走。

### 5.6 Zod schema（`src/lib/schema.ts`）

Schema 本体直接看源文件——它就是事实层真相（§0）。这里只记设计点：枚举集中定义（`Tone` / `Gender` / `Count`），variant 全部维度字段 optional（"只填真实区分"），`trans` 用 `z.record` 以便语言可增删。

**运行时点**：在 Astro 构建开始时（`astro.config.mjs` 的 integration hook 或 `pages/index.astro` 顶部脚本）读三个文件、跑 Zod parse。任何 schema 错误立即 throw，构建失败——这保证线上数据永远合法。

### 5.7 变体筛选逻辑（`src/lib/filter.ts`）

UI 状态影响变体显示的维度：`anchor`（哪种语言放锚点列）、`tone`（`any` 或某一档）、speaker/addressee 性别。

实现见 `src/lib/filter.ts`。规则：tone=`any` 返回全部；指定档位时优先精确命中，无命中则回退到未标 tone 的默认变体。

**关键原则**：筛选失败时优雅降级，不返回空数组。这保证 UI 里永远有东西显示。

**addressee 维度故意省略**。`speakerGender` / `addresseeGender` / `addresseeCount` 仍然在 schema 上保留，但只作为**被动描述标签**通过 VariantRow 的 tag line 渲染（"he writes" / "to a woman" / "to everyone"），不参与筛选。原因（v1 当时）：三个轴命中率太低（speakerGender 2/77、addresseeGender 0/77、addresseeCount 7/77），做成显眼的 UI 控件让用户拨了发现没变化反而更糟。`scripts/coverage.mjs` 持续打印三个轴的命中数；约定 speakerGender / addresseeGender 累积超过 ~10 个 cell 时再考虑加回 UI 控件（Stationery 第三句 *signed by [me · he · she]* + addressee 槽位）。**2026-06-12：两轴各 60（阈值的 6 倍），控件已恢复——Stationery 第二句扩展为 *I write — [tone] — to [a friend·him·her], as [myself·a man·a woman]*，筛选规则：排除显式标了相反性别的变体，未标的保留，绝不清空格子。**

### 5.8 UI 字符串（`src/content/ui/en.json`）

跟具体翻译无关的所有界面文本，内容以源文件为准。v1 只有英文一份，未来可加 `zh.json` 做 UI 中文化（store 已就绪）。设计点：tone 档位的展示文案（"tenderly" / "casually"…）属于 UI 字符串而非数据，因为它描述界面措辞而非翻译本身。

### 5.9 内容作者工作流

加短语 / 加语言 / 加场景的操作步骤与风格四规则见 `README.md`（Add a phrase / language / scene + Translation philosophy）——那里是唯一维护的版本，此处不复述。本文档只记意图：实际流程都是"让 AI 生成 JSON、review 后合入"，per-phrase 文件保证 AI 一次改一个文件不殃及全库（§5.1 原则 5）。辅助脚本：`pnpm new-phrase`（骨架生成）、`pnpm coverage`（覆盖率矩阵，含 gender 轴命中数——§5.7 阈值机制的数据源）。

---

## 6. 功能规格

> **本章地位**：只记设计意图、约束与"实现注意 ⚠️"陷阱——这些读不出于代码；交互细节与一切像素/数值规格以组件源码为准（§0 规则）。**v2.4 起废除"as-built 快照"体例**——快照必烂，且以权威口吻误导（TocSide 面板不透明度曾以过期值在此存活一周）。

### 6.1 语言选择（双轨：表头 + Stationery 面板）

经多轮迭代（2026-06-28~29）：chip 墙 → 信笺句行 + 弹层（清算 §13 04-22 遗留）→ 用户嫌"弹层多一步"，把桌面操作搬进表格列头 → 再反馈"表头加/删不便、列表没风格、句行别藏"，**收敛为：Stationery 句行面板是主控件（两视图都在），桌面表格列头额外提供「快速换列」**。

- **列序 = 选择顺序（2026-07-02）**：`$selectedLangs` 的**数组顺序就是列顺序**（anchor 恒为首列；句行、"Anchored in"选项、卡片语言块全部镜像列序）。添加追加到末尾；**换列是数组原位替换**——点哪列换哪列，用户对列的空间记忆不被打断。⚠️ 消费端不得把它当无序集合再按 languages.json 顺序重排（最初实现如此，换到数据集尾部的语言会"跳列"）。
- **Stationery 句行（主控件，两视图都在）**：信笺第一句 `for friends who read English · 中文 … ▾`——母语名**直立** serif（CJK 在 italic 下是丑的伪斜体），anchor 标 accent 色（避免与下一句"Anchored in"读着冗余）。点开 `LangMenu` 多选面板：搜索 + 分组 + 英文名 + 实心 gold 点标记 + 「Clear」一键清空（除 anchor）。满 5 时 header 提示 + pulse（不再 shake）；header 在可滚动面板内 **sticky**，滚到底也看得见。
- **桌面表格列头（快速换列）**：每个 `<th>` 是按钮（母语名 + 英文 exonym 注释 + hover ▾），点开同一个 `LangMenu`；点一门**未显示**的语言 = **把该列原位换成它**（`switchColumn`，是 anchor 列则 anchor 跟随）。**只换列**——加/删/搜索都回到上面的面板（用户反馈表头加删不顺手）。表头 `sticky`（StickyBar 下方留一档呼吸空间，不贴顶），滚动时列语言常驻。
- **共享组件 `LangMenu`**：搜索（match native/name/code，**大小写 + 变音符折叠**——"francais"命中 Français；**选完自动清空**回全列表）+ 区域分组（**组名与顺序从数据首现顺序派生**，⚠️ 不得硬编码组清单——新组的语言会静默消失在所有菜单里）+ 母语名（直立 serif）+ 英文 exonym（serif italic 小字；`name===native` 不重复）+ `marked`/`disabledCodes`/`anchorCode` 标记。**2 列网格、无边框、暖色 hover/选中**。Stationery 面板与列头/锚点弹层共用。
- **Popover 原语（`lib/popover.ts`，2026-07-02）**：所有浮层（SlotPicker × Stationery/StickyBar、语言面板、列头弹层）共享单一 `openPopover` store + `use:popover` action——**同刻只开一层**（开新层自动关旧层）、点外关闭、**Esc 关闭并把焦点还给触发器**。⚠️ 撤销了此前"每组件各挂 document 监听 + trigger stopPropagation"的协调（会让两层同开、Esc 后焦点掉到 body）；popover id 须**实例唯一**（同名 slot 在 Stationery 与 StickyBar 各有一份，用 `$props.id()` 后缀）。弹层**条件挂载**（`{#if}`），不再 `visibility:hidden` 常驻——11 场景 × 5 列的隐藏菜单曾在 DOM 里驻留 ~1200 个按钮，也免了整套 `tabindex` 杂技。
- 不可删 anchor（它是一列）/ 最后一门。默认勾选 `defaultOn`；默认 anchor 从 `defaultAnchor`（en）**派生**（stores 不再硬编码 `'zh'`，与 §13 2026-04-28 一致）。状态 `$selectedLangs` 持久化，**初始化在 stores 模块层**（不再依赖 LanguagePicker 恰好先挂载）。
- **无障碍**：触发器 `aria-expanded`（`aria-haspopup` 只留给真菜单 SlotPicker），选项 `aria-pressed` toggle + `aria-label`（英文名 + showing/anchor）；母语名 `lang` + `dir`——**BCP-47 tag 从数据取**（`langTag`，mizo 在 languages.json 里带 `bcp47: lus`）；SlotPicker 菜单**方向键巡航**（↑↓ 环绕 + Home/End，键盘打开聚焦当前选中项，选毕焦点回触发器）；满 5 / 删 anchor 被拒时 **`aria-live` 播报**（纯视觉 pulse 读屏听不见）；trigger 与 popover **兄弟不嵌套**；trigger hover/focus 用更亮的 `--paper-up` 高亮——**不能用变暗染色**，否则 accent 文字在其上掉破 4.5。axe 全 A/AA 绿（面板开 / 列菜单开 / light / dark / 卡片视图）。

### 6.2 Stationery · 手写体预设句（Stationery + SlotPicker）

顶部两行斜体衬线句子，像信件开头题词：

> *Anchored in* **Chinese**.
> *I write* — **in any tone** — *to* **a friend**, *as* **myself**.

加粗的四个词（anchor / tone / addressee / speaker）是 `<SlotPicker>` 实例：

- **视觉**：斜体 Fraunces，赤陶色文字，下方虚线（dashed underline）+ 小 `▾`
- **交互**：点击展开一个 popover 菜单（斜体选项列表，当前值带赤陶色小圆点）
- **关闭**：点击外部 / Esc / 选中某项
- **状态变化反馈**：选中后 slot 文字更新 + 一个 `.pulse` 短动画（350ms）+ 主视图重渲染
- **键盘可用**：Tab 聚焦，Enter/Space 展开，方向键移动选项，Enter 选定

**Slot 值域**

| Slot | 值 |
|---|---|
| `anchor` | 当前已选语言（防绕过 5 种上限） |
| `tone` | `any` / `casual` / `neutral` / `polite`（文案 "in any tone" / "casually" / "evenly" / "politely"） |
| `addressee` | `any` / `m` / `f`（"a friend" / "him" / "her"）— 2026-06-12 恢复 |
| `speaker` | `any` / `m` / `f`（"myself" / "a man" / "a woman"）— 2026-06-12 新增 |

**默认状态**：`anchor=en`（v0.2.0 起，原 zh）/ `tone=any`。所有文案从 `ui/en.json` 读。

性别/对象控件的撤除与恢复史见 §5.7 与 §13（04-26 / 06-12），此处不复述。

**实现注意 ⚠️**：popover 内的选项 button 关闭态必须 `tabindex="-1"`，展开时才改为 `tabindex="0"`。否则即使视觉上 opacity:0，Tab 键焦点也会进入隐藏选项，浏览器自动滚动把它带进视口，造成"按 Tab 莫名弹窗"的 bug（demo 早期踩过）。`closeAllSlots()` 函数里要把所有 popover 子按钮 tabindex 重置为 -1。

**关键设计意图**：这句话替代了 v2 版本的 chips 墙、legend 说明条、单元格里的 pill 标签三件东西。界面从"有很多控件的后台"降维到"一封写了一半的信"。

### 6.3 视图切换（ViewToggle）

- 两种视图：`table` / `cards`；用户主动切换覆盖默认，存 `$view: 'table' | 'cards' | 'auto'` 持久化
- `auto` 按视口宽度自动切（≥640 → table；v0.1.1 起从 960 下调，阈值在 `ViewToggle.svelte`）
- Toggle 按钮：Masthead 右上角药丸 chip group（Label 角色，§7.1）
- **实现**：`body[data-view]` 属性驱动 `.view-desktop` / `.view-mobile` 互斥显隐
- **卡片视图的宽度约束（关键意图）**：卡片容器与场景标题收窄到 720px 居中，shell 本身保持 1240px——右侧自然留出 ~260px 给 TocSide 落座
- 切换淡入淡出；尊重 `prefers-reduced-motion`

### 6.4 场景目录导航（TocTop + TocSide）

TOC 在不同阅读阶段以两种形态出现，互不重叠。所有状态切换共享一个全局阈值 `scrolled`（滚动超过 420px），来自 `src/lib/scroll.ts` 的 `$scrolled` nanostore。

#### 6.4.1 TocTop — 首屏横向目录页

位置：文档流内，在 Stationery 之下、`<main>` 之上，shell 居中。

```
No. I. Greetings · II. Catching Up · III. Gratitude · IV. Farewells · V. Reactions · … · XI. Holidays
```

- **视觉**：Fraunces 斜体（Index 角色，§7.1），金色 Roman 编号 + `--ink-mute` 场景名，极小实心圆点分隔
- **交互**：点击 smooth scroll 到对应场景；hover 变 accent
- **显隐**：`$scrolled === false` 时可见；`true` 时淡出但保留文档流位置（不跳动）
- **移动端**：flex-wrap 换行兜底

#### 6.4.2 TocSide — 滚动后右侧 sidebar

位置：`position: fixed`，垂直居中，右侧锚定在 shell 右内缘（窄视口有保底边距）。

**显隐规则**（阈值以 `TocSide.svelte` 的媒体查询为准）：

- 卡片视图：`scrolled` 且视口 ≥640 显示——卡片列 720px 居中，右侧留白天然容得下 rail
- 表格视图：`scrolled` 且视口 ≥1024 显示——再窄 rail 会挤压最右译文列（本节旧文"表格视图始终隐藏"有误，v2.4 按源码勘正）
- 更窄（真移动）：隐藏，导航由回顶钮兜底

**形态意图**：

- 静息态是"几列罗马数字浮在留白里"——无背景、无边框、无投影；数字站在一条竖向 rail 侧（金色渐变细线 + 上下两枚 ❋ fleuron，fleuron 只在展开时现身）
- 展开态铺一层**实纸**面板（`--surface-toc-panel`；R1 起近实纸——半透明会让面板下的表格文字透叠不可读）；**无 backdrop-filter**（毛玻璃与纸质气质冲突，对照 §6.11）
- 场景名收起时保留布局宽度（展开不引起横向跳动），展开时逐行 stagger 显现
- Active 场景三重线索同时标出：编号变 accent、场景名加重、右侧赤陶短横线

**扩展/收起（R6 改判，2026-07-03）**：hover / focus 展开，离开 400ms 后收起（`focusout` 用 `relatedTarget` 判断是否仍在 TOC 内）；**滚动不展开**——展开面板需 ~1816px 视口才不叠到表格末列，"滚动自动展开"在真实屏幕上必然盖住内容。静息 rail（数字 + 活动 accent + 阅读进度线）即滚动反馈；展开只表达用户意图。

**点击**：任一条目 smooth scroll 到对应场景。

#### 6.4.3 Active 场景追踪

`src/lib/scroll.ts` 维护 `$activeScene` nanostore（滚动 RAF 里按场景块位置判定），TOC 组件订阅并更新 `.active` 类。

### 6.5 复制（VariantRow）

- 整个 variant 行点击即复制
- 成功：行内右上角 `copy` 灰字变成 `✓ copied` 赤陶斜体（1.4s）+ 全局 Toast 底部弹出
- 失败：fallback 到 `document.execCommand('copy')` + 隐藏 textarea hack
- 复制的是纯 `text` 字段（不带 rom、tag、note）
- 可访问性：`role="button"` + `aria-label="Copy [text]"`，键盘聚焦 + Enter/Space 触发

**实现注意 ⚠️**：`.copy-hint` 元素本身要是**空 span**，"copy" 和 "✓ copied" 两种文字都通过 `::before { content: '...' }` 切换，避免 innerText + ::before 同时出现导致文字堆叠（这是 demo 早期踩过的坑）。

### 6.6 语音朗读（SpeakButton）

- 每个 variant 行右侧（copy hint 旁边）有一个 speaker 图标，hover/focus 显示
- `window.speechSynthesis`，BCP 47 code 来自 `languages.json[lang].tts`
- 点击播放 → 图标变活跃态；再点停止
- 检测浏览器是否有对应语言的 voice（精确 BCP 47 → 同语种前缀回退）；无 voice 或语言无 tts code（mizo）时按钮**不渲染**——死图标是噪音不是功能（原方案"禁用+tooltip"已弃）
- `rate = 0.9`, `pitch = 1`
- **不把 TTS 做主交互**（很多用户静音浏览），但能用时有价值

### 6.7 星标收藏（StarButton）

- 每条短语锚点列右上角小星星按钮（table 和 card 视图都是这个位置）
- 点击 toggle，存 `$starred: Set<phraseId>` 持久化
- Stationery 下方出现 "Starred only" 小开关 chip；开启后只渲染收藏的短语
- 无收藏时该 chip 不显示
- 收藏维度是短语级（phraseId），不细化到 variant——保持简单

### 6.8 深色模式（ThemeToggle）

- 三态：`light` / `dark` / `system`（默认 system）
- 存 `$theme` 持久化
- 实现：`<html data-theme="dark|light">` + CSS 变量两套
- **防 FOUC**：在 `<head>` 里放一个 inline script，阻塞式读 localStorage 并设置 `data-theme`，早于 stylesheet 应用
- Toggle 按钮放在 Masthead 右上（小 sun/moon 图标）

### 6.9 锚点列（Anchor Column / Card Head）

**表格视图**

- 固定第一列，淡金棕底 + 右侧浅色 border
- 表头显示当前锚点语言的本地名（如 "中文" / "Français"）
- 每行内容三层：大字（Headword 角色，§7.1）取该短语在锚点语言下筛选后的**第一条变体**；小斜体 rom（如有）；小斜体 gloss

**卡片视图**

- 卡片顶部同样三层结构，border-bottom 虚线分隔，下面是其他语言块

**缺锚点语言翻译时**：大字显示淡色斜体 `—`，其他列正常显示。这保证锚点语言缺数据不阻断整行。

### 6.10 译文列（TranslationCell + VariantRow）

- 每格竖向堆叠 1-N 个 variant 行，行间虚线分隔
- 每行结构：大字（Entry 角色，§7.1）variant.text；小斜体 rom；tag line（仅 `tone=any` 时显示，把 tone/gender 渲染成 "— casually" / "he writes"）；note（Aside 角色）；右上角 copy hint（hover 显现）
- 无变体（被筛选干净）时单元格显示斜纹纹样占位

### 6.11 顶部细 bar（StickyBar）

当 `$scrolled === true` 时，视口顶部淡入一条浮动控制条。目的：在阅读深处能继续调整语气 / 对象偏好，不用滚回顶。

**布局**：`[致·远·方] │ I write — [in any tone] — to [a friend], as [myself]`。左侧 mark 点击回顶；中间是缩略版 Stationery——**不含 anchor slot**（锚点切换频率极低，留在 Stationery）。所有 slot 是 `<SlotPicker>` 实例，与主 Stationery 共享 store，任一处修改两处同步。

**表面**：近实纸底 + `backdrop-filter` 毛玻璃——浮动工具栏与内容是"不同层级"，玻璃感在**这里**是对的（TocSide 不是工具栏，那里才不用 blur）；α 自 R1 提高到近实纸，可读性不得依赖 backdrop-filter 支持。

**响应式**：窄屏隐藏 mark 只留句子，更窄允许换行。淡出时顺手关闭所有 SlotPicker popover（`closeAllSlots()`）。

**不做**：TOC 圆点快捷跳转（TocSide 已覆盖导航需求，重复）。

### 6.12 PWA

- `manifest.webmanifest`：name / short_name / start_url / display=standalone / theme_color
- Service Worker（`@vite-pwa/astro`）：precache shell（html/css/js/svg——短语数据经 `import.meta.glob` 打包进 JS，无需单独缓存）；**字体不进 precache**——CJK Noto 按 unicode-range 拆成上百个子集文件（全量几十 MB），改为首次使用时 CacheFirst 运行时缓存
- 更新策略：`autoUpdate`（后台下载、下次访问生效）
- 离线：完整功能可用（TTS 依赖浏览器）
- **不做**：自定义 install prompt（让浏览器原生 UI 来，不抢焦点）

### 6.13 不做的（本期）

搜索框、快捷键、分享链接、反向查找、导出图片、多 UI locale（结构已就绪但只出英文）、标签（tags）系统、变体级收藏、用户主动编辑偏好加入更多维度（如 speaker gender 控件）。记录在 §12 供未来考虑。

---

## 7. 设计系统

### 7.1 字体与全局字体规范（2026-07-03 R11 起为角色制）

字族栈与角色 token 数值以 `src/styles/tokens.css` 为准（§0 规则 1）。设计意图：

**基因**：Masthead 的辨识度来自 Fraunces 的大光轴刻（高笔画对比）+ 克制字重（400）+ 斜体点缀。R11 审计结论（用户反馈触发）：这个基因此前只活在首屏，表内/列表按组件各自配字，散点字号（8.5–10.5px 五档标签）读作"中下水平"。整改为**角色制**——全站字体按角色归口 tokens，基因以递减强度渗透正文层级：

| 角色 | 用途 | 规格要点 |
|---|---|---|
| Display | Masthead 标题、场景标题、404 | Fraunces 400，auto opsz（大字号天然高对比），负字距 |
| Headword 头词 | 锚点列大字、卡片头字 | **wght 440 + opsz 34**（`--opsz-headword`）——以光轴替代加粗取得分量 |
| Entry 词条 | 变体正文 19px | 400 + **opsz 24**（`--opsz-entry`），比 auto 高一档的笔画对比 |
| Aside 旁注 | rom / gloss / 语域行 / 英文注名 / 空态 | serif italic 12–12.5px `--ink-mute`（R8"一个注音声部"延续） |
| Index 索引 | 语言菜单母语名（直立 15.5px）、TOC 条目（italic 14px） | 直立防 CJK 伪斜体（§6.1） |
| Label 标签 | 全部 sans 小帽标签：表头注名、卡片语言标、菜单分组头、copy 提示、视图切换、面板标 | **统一一档** `--label-size/weight/track`（10px / 500 / 0.2em / UC）。登记例外：Footer 署名（12px/0.3em，署名是独立角色）、StickyBar 紧凑变体（9px/0.18em） |

- **Fraunces** 只自带 Latin（西里尔文实际由 Noto Serif SC 的 cyrillic 子集承担——本节旧文"自带 Cyrillic"有误，R11 勘正）；CJK 回退 Noto Serif SC/JP/KR；**首屏 UI 标签**（印章、语言句行母语名）用 `--font-serif-local`（栈内无晚到字体，见 §9）
- **Instrument Sans** 做 UI 小字标签，只用 400/500
- SOFT/WONK 轴已随 M4 size pass 移除（§13 2026-06-12）；**opsz 是仅存的表现轴，角色 token 是唯一入口——组件不得自设 `font-variation-settings` 裸值**（CJK 回退字体无 opsz 轴、自动忽略，安全）

### 7.2 颜色 tokens

全部数值以 `src/styles/tokens.css` 为准（light / dark / system-follow 三个块）。设计点：

- 命名分两层：原色（bg / paper / paper-up / ink / ink-soft / ink-mute / accent / gold / `gold-ink` / `on-accent` / line）+ 语义 surface（`--surface-stickybar` 等基于原色组合的叠加层）
- 暖纸色系：背景米色、墨色文字、赤陶 accent、金色装饰——"信笺"气质的来源
- `--gold` 是**装饰色**（图标 / 描边 / 填充），当文字读不过 AA（在最暗的 `--bg` 上仅 2.7）；文字金用更深的 `--gold-ink`。`--on-accent` 是落在 accent 填充上的文字色（如 anchored chip），随主题反向（浅色near-white / 深色near-black）
- 暗色不是反色，是"夜里的同一张纸"：纸面压暗、墨色提亮、accent 提亮一档

两套都需过 WCAG AA（正文 4.5:1，大字 3:1），且**对比度已纳入 CI 门禁**——axe 在 light + dark 两个主题各扫一遍（§10.5）。注意基准背景是最暗的 `--bg #EBE1CC`（比 `--paper` 还深），文字落在它上面对比度最低，早期只对 paper-up 验证时漏掉了这一档。

### 7.3 间距与动效

- 基础间距 4/8/12/16/20/24/32/48/72（px）
- 圆角 3px（卡片/表格）、999px（chip）、50% 不用

**动效 tokens**（数值见 `tokens.css`）：时长按用途分档（hover / switch / feedback / reveal / entrance），easing 三种（`--ease-out` 主通用、`--ease-spring` 带轻微 overshoot、linear 仅用于机械感属性）。TOC 的两个 JS 时序常量（idle 1400ms / hover-release 400ms）在 `scroll.ts`。

**关键动画命名 tokens**：

- `@keyframes rise` — 卡片首屏入场（opacity 0→1 + translateY 8px→0，stagger 30ms）
- `@keyframes pulse` — slot 被切换后的短暂高亮（背景赤陶色 0→22%→0，350ms）
- `@keyframes nudge` — 语言面板满 5 时 header 提示的轻微横移（±2px，400ms；chip 时代的 shake 已随 chip 墙移除）
- **TOC 场景名 stagger**：场景行依次出现，每行延迟 +40ms

所有动画必须尊重 `prefers-reduced-motion: reduce`——统一做法是在 `global.css` 里用 `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`。

### 7.4 组件清单

以 `src/components/` 目录为准（astro/ 纯静态 4 个，svelte/ 交互 islands）。各组件的设计意图见 §6 对应小节。

---

## 8. 可访问性清单

- [x] 所有交互有可见 `:focus-visible` 状态（accent 色 outline）
- [x] icon-only 按钮必有 `aria-label`
- [x] Toast 用 `role="status"` + `aria-live="polite"`
- [x] 语言切换元素用 `aria-pressed`
- [x] 译文元素加 `lang="xx"`，辅助屏幕阅读器选对发音
- [x] 颜色对比度 AA 级（正文 4.5:1，大号 3:1）
- [x] 不用颜色作为唯一信息载体（例：复制成功也有 ✓ 符号和文字）
- [x] 键盘能完整操作：Tab 切换、Enter/Space 触发、Esc 关浮层并归还焦点（popover 原语 §6.1；R4 键盘流入冒烟测试。Toast 无 Esc——瞬态 `role="status"` 非交互件，无此要求）
- [x] 尊重 `prefers-reduced-motion`
- [x] 文档语言 `<html lang="en">`（UI 主语言是英文）
- [x] 标题层级合理：`h1` 只一个（masthead；构建产物验证 =1）

---

## 9. 性能目标

2026-06-12 按实测校准（初版的"首屏 <150KB 含字体 / LCP <1.5s / 四项 ≥95"是建站前的估计，与自托管特色衬线 + 23 语言数据的现实不符）；**2026-07-03（R9）再校准**——修复 06-28 语言改造引入的 CLS 回归并做水合分级后，实测（本机 headless、同法前后对比）59→96，预算相应收紧：

- **Lighthouse**（slow-4G 模拟）：Accessibility / Best Practices / SEO = 100，**Performance ≥ 90**（R9 实测 96）
- **CLS** ≈ 0（字面意义的 0——首屏不允许任何字体 swap 重排）、**TBT** < 100ms
- **阻塞 CSS** < 20KB（CJK @font-face 声明必须保持异步加载）
- **首屏关键传输**（HTML + 阻塞 CSS + 预载字体）< 250KB
- 不为分数牺牲首访字体身份：Fraunces 不用 `font-display: optional`；**CJK 也不用**——R9 实测 optional 触发 Chrome 预取全部 unicode-range 相交子集（48→97 请求），模拟慢网 FCP 翻倍（§13）

**达成策略（已落地）**
- Fraunces standard 轴（wght+opsz），拉丁两支 + Instrument Sans latin 预载防 swap 位移
- CJK @font-face 异步加载 + 系统宋体/明朝体兜底；**首屏 UI 标签（印章、语言句行母语名）用 `--font-serif-local`**——栈里没有晚到的 webfont，就没有重排（短语内容保持 Noto 身份）
- 岛屿水合分级：滚动后才可见/操作后才出现的岛（StickyBar/TocSide/Toast/StarFilter）`client:idle`，首屏可点的保持 `client:load`
- 场景块 `content-visibility: auto`
- 短语数据随 JS 打包 SSG 输出，不走 client fetch；SW 预缓存 shell
- 无第三方脚本、无 analytics

---

## 10. 部署

### 10.1 GitHub Pages 配置

若仓库名为 `distant-friends`（非 `<user>.github.io`），需在 `astro.config.mjs` 配：

```js
export default defineConfig({
  site: 'https://<user>.github.io',
  base: '/distant-friends',
  // ...
});
```

### 10.2 Actions workflow

见 `.github/workflows/`。要点：pnpm + Node 22、`upload-pages-artifact` → `deploy-pages`，仓库 Settings → Pages → Source 选 **GitHub Actions**。实际分支策略后来演化为 dev → main（Vercel preview）→ release（Pages），见 README Deploy 节。

### 10.3 自定义域名（可选）

`public/CNAME` 文件写入域名，DNS 配 CNAME 到 `<user>.github.io`。配了自定义域后 `base` 要去掉。

### 10.4 依赖自动更新（Dependabot）

`.github/dependabot.yml` + `.github/workflows/dependabot-auto-merge.yml`：每周一扫描 npm 依赖与 workflow 引用的 Actions，对 **`dev`** 开 PR（非默认分支——让升级走正常 dev→main→release 管线再到部署，且 dev 不落后于 main）。自动合并的**唯一门禁**是 `pnpm build` + `pnpm check`（后者抓 build 漏掉的类型破坏），绿灯就 squash 合并——**patch / minor / major 一视同仁**（无人工审）；构建或类型检查失败则 PR 留红叉、不合并。minor+patch 合成单个 PR，major 单独成 PR（一个破坏性 major 只挡自己、不拖累整批）。两点约束：dependabot.yml 从默认分支 main 读取，故首次 dev→main 提升后才激活；auto-merge workflow 须位于 PR 的 base 分支（dev）才会触发。仓库 `allow_auto_merge` 关闭，故用直接 squash 合并而非队列式 auto-merge，门禁内置于 workflow 步骤、不依赖分支保护的 required checks。

### 10.5 测试与 CI

`tests/`（Playwright）+ `playwright.config.ts`：对 `astro preview` 的**生产构建**跑端到端测试——冒烟（渲染、复制+toast、SlotPicker、主题切换、星标过滤）、axe-core 无障碍扫描（WCAG 2.1 A/AA 结构性）、离线（Service Worker 缓存 shell 后断网仍可用）。`pnpm test` 跑 chromium（门禁用）；`pnpm test:all` 跑 chromium/firefox/webkit 跨浏览器矩阵（需先 `pnpm exec playwright install firefox webkit`）。

两处接入：`ci.yml` 在人工 PR 与 dev/main push 上跑；`dependabot-auto-merge.yml` 把 `pnpm test` 加进自动合并门禁，让 major 自动合并能挡住运行时/渲染回归（不只编译错误）。引入当天即抓到两个真实回归：Astro 7 升级打破了 PWA 的 SW 注册（离线实际失效）、SlotPicker 按钮嵌套（nested-interactive + 非法 HTML）——均已修。

axe 跑**全量 WCAG 2.1 A/AA（含 `color-contrast`）**，light + dark 各一遍。引入当天先把 color-contrast 暂排除（十余处次要小字 < 4.5:1，留作调色板设计决定），随后判定其确为可读性失误并补齐到 AA（§7.2 / §13 2026-06-28 第三条）：ink-mute/accent 微调、`--gold-ink`（装饰金 `--gold` 不变、文字金加深）、`--on-accent`（accent 填充上的文字）。现对比度也在门禁内。

---

## 11. 里程碑与任务清单

### M0 · 项目骨架 — ✅ v0.1.0（2026-04-25）

依赖配置、目录结构、lib 五件套（schema/filter/stores/scroll/clipboard/storage）、Actions 部署。明细见 v0.1.0 release 与当时的 git 历史。

### M1 · 对齐 v3 demo — ✅ v0.1.0 / v0.1.1

7 语言 × 11 短语迁移、全部样式 token、Astro 静态四件 + Svelte 交互十二件、双视图集成。验收时的手测清单保留在附录 F（回归测试可复用）。过程中的方案修订（ViewToggle 阈值 960→640、TocSide 双视图显示等）已并入 §6 各节与决策日志。

### M2 · 深色模式 + 收藏 — ✅ v0.2.0 / v1.0.0

三态 ThemeToggle（v0.2.0）；收藏 + "Starred only" 过滤、AA 对比度脚本验证（v1.0.0）。会话级过滤、starred 持久化等设计取舍见 §6.7 与 §13。

### M3 · 语音 + PWA — ✅ v1.0.0

TTS（无 voice 不渲染）、manifest + 图标、SW precache shell、离线自动化测试。取舍与踩坑见 §6.6 / §6.12 / §13（06-12、06-28）。

### M4 · 打磨 — 基本完成

axe 全 A/AA 含对比度双主题入 CI 门禁、Lighthouse 达 §9 校准预算、reduced-motion 全局兜底、OG image、README、404、跨浏览器测试工程就绪（§10.5）。**剩**：完整键盘穿行手测；真机手测 iOS Safari / Android Chrome（与 §15 开放项合并执行）。

### M5 · 内容扩充（持续）
按需追加短语、语言、场景。工作流见 §5.9。
每次 push main → 自动部署。每次加新语言后跑一遍 `pnpm run coverage` 确认矩阵。

内容演进史以 [GitHub Releases](https://github.com/Chimelight/distant-friends/releases) 为准，当前规模以 `pnpm run coverage` 输出为准（§0 规则 1——本行曾复制过"X 语言 × Y 短语"快照，照例烂掉了）；方向性决策见 §13。

---

## 12. 未来可能（不承诺，供参考）

按优先级粗排，择机引入：

1. ~~**UI 中文化**~~ — ✗ **不做**（2026-06-28）：受众主体是不懂中文的国际朋友（§1，默认锚点 zh→en 即此故），UI 锁英文是自洽的。切换结构（`ui/zh.json` + `$uiLocale` store + SlotPicker）保留但不补译文
2. **搜索框** — 输入任一语言或拼音定位到短语行（fuse.js 模糊搜索）
3. **多标签（tags）** — 短语可挂多个标签（`#morning` `#emotion-joy`），与 scene 正交
4. ~~**分享链接**~~ — ✗ **不做**（2026-06-28，ROI 偏低）：`?anchor=ja&langs=zh,en&tone=casual&addr=friend&phrase=greeting-hello` 一键复刻朋友看到的视图
5. **导出为图片** — 一条短语做成可发到微博/IG 的卡片（html2canvas）
6. **预生成音频** — Web Speech 的质量天花板取决于用户设备装了什么 voice。构建期用神经 TTS（如 Azure/Google 一次性批量）把全部变体烧成静态音频（~2200 条 × 10-20KB ≈ 30-40MB），懒加载 + 运行时缓存：所有浏览器一致的高质量发音，且仍符合离线原则。代价：构建管线复杂度 + 资产体积，引入前需单独评估
7. **反向查找** — 朋友发来一句外语查意思（需要把数据索引反转，工程量大）
8. **变体级收藏** — 目前收藏到 phrase 级，未来可深入到 variant
9. **内容贡献渠道** — 如果开放，用 GitHub Issues 表单模板 + PR 流程（不做 CMS）

---

## 13. 决策日志（append-only）

> 记录"改变方向"的决策：被推翻的旧方案、确立的新规则。**只追加，不改写**——反转本身是信息。日常功能交付不记（git/release 已覆盖）。

- **2026-04-22** · 大简化定调：所有语言平等（无源语言）、tone 四档全局固定、手写体 Stationery 替代 chips 墙/legend/pill 三件套、UI 锁英文。
- **2026-04-26** · addressee slot 从 Stationery/StickyBar 撤除（命中率太低，控件拨动无效违反"内容是主角"）；确立**成熟度阈值机制**：coverage 脚本跟踪 gender 轴命中数，≥10 再考虑恢复控件。
- **2026-04-28** · 默认锚点 zh → en：新增 7 种语言后，受众主体是不懂中文的国际朋友。
- **2026-04-29** · **反转 v1.2 的"扁平三文件"**：phrases.json 拆为 per-phrase 文件（`phrases/<id>.json` + glob 聚合）。短语量增长后，单文件无法支撑独立生成/review/diff。
- **2026-04-29** · 引入 `reviewed` 字段标记母语者审核状态。
- **2026-06-10** · **移除 `reviewed` 字段**（反转上条）：审核提升流程始终未成形，字段沦为噪音；review 支持改由 `pnpm review` 对照表承担。
- **2026-06-10** · 翻译四规则确立（README Translation philosophy）：温度优先 / 只填真实区分 / **friendly foreigner 不装母语者**（禁深度俚语，聊天惯例记号除外）/ **变体宁缺毋滥**（同义采样=滥）。当日依此完成全库审计，删 211 个变体。
- **2026-06-11** · 场景体系重构：合并→拆分反复后定为"**小而多**"（11 个场景，最大 9 条）；排序原则修正为**逻辑分块优先、块内按频率、高频词不沉底**（非机械频率排序）；got-it 并入 i-see、"没关系"挪入 Gratitude 与"对不起"配对、节日单独成场景。
- **2026-06-11** · 砍同义对时**标准形存活、casual 重复出局**（"I'm fine 事件"）：每格必须有中性默认，除非概念本身无正式语域（cool/oops/笑声）。
- **2026-06-12** · 阿拉伯语（首个 RTL）：不做全局 RTL 布局，仅在短语文本元素加 `dir="auto"`——内容级 RTL，界面仍 LTR。
- **2026-06-12** · 字体**不进** SW precache（反转 §6.12 原方案）：CJK Noto 按 unicode-range 拆 ~100 个子集，全量几十 MB；改运行时 CacheFirst。
- **2026-06-12** · TTS：无可用 voice 时按钮不渲染（弃"禁用+tooltip"）；voice 按质量启发式排序（Natural/Enhanced/Google 加分）而非取第一个匹配；"Starred only" 状态会话级不持久化。
- **2026-06-12** · **字体性能权衡**（M4 size pass）：Fraunces full 轴 → standard 轴（-120KB 关键路径，代价：放弃 SOFT/WONK——全站唯一用例是 TocSide 数字的软转角）；CJK 三套 @font-face 声明（112KB gz）移出阻塞 CSS 异步加载，字体栈补系统宋体/明朝体兜底；预加载两支拉丁 Fraunces 消除 swap 位移。Lighthouse：56/96/100/100 → 88/100/100/100（模拟慢速 4G）。剩余 LCP 3.6s 为自托管特色衬线的固有成本。
- **2026-06-12** · **性能指标按实测校准**（确立元原则：§2 数字指标非铁律——初版是建站前的 AI 估计；方向性原则 1-4 不动摇，数字以实测修订并记日志）：§9 改为 A11y/BP/SEO=100 + Perf≥85（slow-4G 模拟）、阻塞 CSS <20KB、首屏关键传输 <250KB；明确不用 `font-display: optional` 换分数。
- **2026-06-12** · **性别控件恢复**（反转 v1.5 的撤除，按当时定下的阈值机制触发）：两轴各 60 个标注变体后，Stationery 第二句恢复 addressee 槽位并新增 speaker 槽位。筛选语义：排除显式相反性别，未标保留，空则回退——格子绝不因偏好清空。被动 tag line 在对应筛选激活时隐藏（信息已由槽位表达）。
- **2026-06-13** · **tone 收为三档**（casual / neutral / polite，弃 close/"tenderly"）：close 档全库命中率 0.5%（14/2596），用户拨到 tenderly 几乎所有格子都走 fallback——会动但无效的选项是温柔的陷阱。14 个 close 变体并入 casual（亲昵语义由 note 承载）；持久化的旧值迁移为 casual。
- **2026-06-27** · **依赖更新自动化**：引入 Dependabot（每周）对 `dev` 开 PR——minor+patch 合为单 PR，`pnpm build`+`pnpm check` 绿灯后自动 squash 合并；major 单独 PR 手动审。落点选 dev 而非默认分支 main：升级照走 dev→main→release 两道人工 PR 再到部署，dev 不落后于 main。仓库 `allow_auto_merge` 关闭，故用直接 squash 合并而非队列式 auto-merge，门禁内置于 workflow 步骤、不依赖分支保护 required checks。详见 §10.4。
- **2026-06-28** · **major 也自动合并**（反转上条的"major 手动审"）：维护者不审 PR diff，"手动审"实际等于永不合、依赖烂在 PR 里。改为 build+check 绿灯即 squash 合并，patch/minor/major 一视同仁；构建/类型检查是唯一关卡，编译或类型不过的留红叉。major 仍单独成 PR（不并入分组），故单个破坏性 major 只挡自己、不拖累整批。残余风险：能构建但有运行时回归的 major 会漏网（项目无测试套件）——靠 dev→main（Vercel preview）→release（Pages）两道预览兜底。
- **2026-06-28** · **引入测试**（反转 §3.3"不引入测试框架"）：上条放开 major 自动合并后，"肉眼验"形同虚设——补上 Playwright + axe-core（冒烟 / 无障碍 / 离线），接入 `ci.yml` 与自动合并门禁（§10.5），把上条的"残余风险"收口。当天即抓到两个真实运行时回归并修复：①Astro 7 升级后 `@vite-pwa/astro`（peer 仅到 Astro 5）不再注入 `registerSW`，PWA 离线**静默失效**——改由 Layout 在 PROD 手动挂载 `registerSW.js`；②SlotPicker 外层 `<button>` 套内层 `<button>`（nested-interactive + 非法 HTML）——拆为 wrapper + 兄弟 popover。axe `color-contrast` 暂排除出门禁：十余处次要小字 < 4.5:1，是否为严格 AA 调暖色调色板属设计决定，待定。
- **2026-06-28** · **对比度补齐 AA**（落实上条"待定"）：判定低对比确为可读性失误而非有意——最暗背景是页面底色 `--bg #EBE1CC`（比 `--paper` 深），早期 AA 脚本只对 paper-up 验证故漏掉这一档；gold 当文字仅 2.7，根本不可读。改法保留暖色身份：ink-mute `#786E5E→#6B6254`、accent（light `#AC4F2B→#A04928` / dark `#D47649→#DA7A4B`）微调；新增 `--gold-ink`（装饰金 `--gold` 不动、17 处文字金改用更深的 gold-ink）；新增 `--on-accent`（accent 填充上的文字，随主题反向）修好 anchored chip。axe `color-contrast` 重新纳入门禁，light+dark 全 A/AA 绿。
- **2026-06-28** · **语言选择改造**（清算 2026-04-22「Stationery 替代 chips 墙」遗留的最后一块）：23 个母语名 chip 墙 → 信笺句行「for friends who read 中文 · English … ▾」+ 点开的分组弹层（5 区域组、母语名 + 英文 exonym、`●` 选中、anchor 赤陶标记、满 5 时 header 提示替代 shake）。一并解决识别（认不出母语文字）、可扫（分组）、违和（chip 墙 vs 信笺三句）。数据加 `name`/`group` 字段（Zod 同步），组件 `LangChips`→`LanguagePicker`（trigger 与 panel 兄弟不嵌套、关闭态 `visibility:hidden`、mizo 用合法 BCP-47 `lus`）。详见 §6.1。顺带修一个先存 bug：`stores.ts` 默认 anchor 硬编码 `'zh'`，与数据 `defaultAnchor=en` 及 §13(04-28) 决策矛盾——改为从 `defaultAnchor` 派生，首访锚点回到 en。
- **2026-06-29** · **语言选择双轨化 + 表格交互**（迭代上条）：用户反馈信笺弹层"好看但操作麻烦、多一步、不能一眼看全"。遂把桌面的语言操作搬进**表格列头**——点列头切换该列语言 / 删列 / "+"添列，表头加英文注释 + sticky；Stationery 语言句行收为**移动端（卡片视图）专用**（`body[data-view]` 切换）。新增共享 `LangMenu`（搜索 + 分组 + 英文名），Stationery 面板补搜索 / 一键清空 / 实心选中态。同轮修三处：①阿拉伯语**非锚点列**真正 RTL（之前只有锚点列有 `dir`；th/cell 补 `dir` + VariantRow/SpeakButton 改逻辑属性）；②亮模式发淡——次要文字 ink-soft/ink-mute 提对比一档（6.9→8.4 / 4.6→5.8，AA 是地板不是"醒目"）；③trigger hover/focus 的变暗染色让 accent 文字掉破 4.5（任何比 `--bg` 暗的背景都会）——改用更亮的 `--paper-up` 高亮。详见 §6.1。
- **2026-06-29（续）** · **语言选择再收敛 + LangMenu 重做视觉**（看预览后的第二轮反馈）：①**桌面句行别藏**——撤销"表格视图 `display:none`"，句行面板两视图都在、作**主控件**；②**sticky 表头别贴顶**——`top` 44→58 + padding 加大，留呼吸；③**搜索选完自动清空**回全列表（不用手删词）；④**表头加/删不便**——表头收为**只快速换列**，加 / 删 / 搜索都回面板；⑤**"UI 没风格、字体怪"**——母语名 italic 在 CJK 上是伪斜体，遂 LangMenu 重做：母语名**直立** serif、英文 exonym serif italic 小字、2 列网格、gold 分组标题、暖色 hover/选中、去掉通用 chip 边框。anchor 在句行标 accent 色化解与"Anchored in"的重复。
- **2026-07-02** · **语言交互工程收口**（对 06-27~29 批次的代码 review 后重构，行为修正 + 结构清理一次做完）：①**列序 = 选择顺序**——`$selectedLangs` 数组顺序即列序，**换列原位替换**（此前消费端按 languages.json 顺序重排，把首列换成泰语会让新列跳到最右、原列位被后邻顶上，与"switch column to"的心智模型矛盾；冒烟测试恰好选了数据集顺序靠前的 Korean 而漏测）；②**Popover 原语**（`lib/popover.ts`）——单一 `openPopover` store 替代三套"document 监听 + stopPropagation"（旧方案两层可同开、Esc 后焦点掉 body）；同刻一层、Esc 归还焦点、SlotPicker 菜单方向键、满 5/删 anchor 被拒的 `aria-live` 播报——这些是 axe 静态扫描的盲区，靠键盘穿行冒烟测试守；③**弹层条件挂载**——撤销 55 份常驻隐藏菜单（~1200 个 DOM 按钮）与整套 `tabindex` 杂技；④**数据驱动收尾**——分组顺序从数据首现派生（原硬编码组清单会让新组语言静默消失）、BCP-47 进 languages.json（`bcp47` 字段 + `langTag`，替代三份复制的 mizo 特例，并修掉 `lang="mizo"` 漏网两处）、搜索折叠变音符、LangMenu 文案入 `ui/en.json`、store 初始化上移模块层。§6.1 同步改写。
- **2026-07-02（二）** · **进入存量设计迭代期，立账本（§15）**：功能冻结后转入对现有页面/UI/交互/体验的持续多轮打磨，明确跨会话进行——工作账本立于 §15（每轮从账本继续、完成勾销、新发现登记）。R1 审计后落地三项：浮层表面近实纸化（TocSide 面板 22%→93%、StickyBar 0.86→0.94——半透明曾让面板下的表格文字透叠不可读，且可读性不得依赖 backdrop-filter）、移动端 Stationery 断行修辞（标点/分隔点不再孤悬行首）、VariantRow 的 `lang` 裸码残留。
- **2026-07-03** · **换列动画取"新墨写入"，弃 FLIP / View Transitions**：表格列的几何过渡在工程上不成立——`<col>` 宽度不可过渡、"一列"是散布在各行的单元格集合、View Transitions 需给 11 表 × 5 列命名快照，成本与收益倒挂。改为内容层面的连续性：换入的语言以列头先行、逐行 38ms 级联的墨迹写入（`$freshLang` 瞬态 + CSS 动画，reduced-motion 全局兜底），语义也更贴信笺——"换一门语言"是重写一栏字，不是挪家具。收藏同轮补仪式感（pop + 金屑绽放 + 场景星数微标），见 §15 R2。
- **2026-07-03（二）** · **性能预算按 R9 实测再校准 + 首屏字体政策**（用户指令开启第二设计周期，性能重测发现 06-28 语言改造把 CJK/西里尔母语名放上首屏后 CLS 涨到 0.115、从未重测）：①CLS 修复**否决了 `font-display: optional` 方案**——实测 Chrome 对 optional 字体预取全部 unicode-range 相交子集（48→97 请求），模拟慢网 FCP 5.6s→12.8s，比病本身更糟；改立**首屏 swap-safe 栈**规则：首屏 UI 标签（印章、语言句行母语名）用 `--font-serif-local`（Fraunces 预载安全 + 本地宋体/明朝体，无晚到 webfont），短语内容保持 Noto。②Instrument Sans latin 入预载。③岛屿水合分级：滚动后才可见/操作后才出现的岛降 `client:idle`，首屏可点的（TocTop）保持 `client:load` 防死点击。同法前后对比 Perf 59→96、FCP 5.6→1.1s、LCP 6.8→2.7s、CLS 0.115→0；§9 预算收紧至 Perf ≥ 90、CLS = 0。
- **2026-07-03（三）** · **wavy 墨线当日反转**（R9 落地、R10 撤销，用户否决"感觉不太对"）：slot / 语言触发器的 dashed 下划线曾改原生 `text-decoration: wavy` 求"钢笔划线"感。判因：tight 波浪是拼写检查的既有语义——装饰借形，先撞既有含义；且五处底线同时起伏，信笺该安静。回退 dashed；保留同批的 ▾ WORD JOINER 粘接与末位零宽空格两个断行修复。规则沉淀：装饰性"手写感"改动先问**该形状在通用 UI 里已有什么含义**。
- **2026-07-03（四）** · **字体走角色制**（用户反馈"Masthead 非常精致，其他地方中下水平"触发 R11 全局重审）：此前字体规格散落各组件（sans 标签五档字号 8.5–10.5px × 五种字距；头词靠 wght 500 加粗取分量）。确立：①**角色制 tokens**（§7.1 表）是字体规格唯一入口，组件不得自设裸值；②Masthead 基因的下沉手段是 **opsz 而非字重**——头词 wght 440 + opsz 34、词条 opsz 24，用光轴对比取分量；③sans 小帽标签全站一档（10px/500/0.2em），登记例外只有 Footer 署名与 StickyBar 紧凑变体。顺带勘正 §7.1 旧误（Fraunces 并不自带 Cyrillic）并删除死代码 Legend.astro。
- **2026-07-07** · **R13–R18 实验整体撤销，站点定格在 R12**（用户裁决）：R12 之后的六轮"突破方向"实验——信封开启仪式、信笺句上纸、满版横线信纸首屏、滚动写字/复制盖章、揭页视图切换、草稿信——先经历"退回到最初"（还原至 R8），用户复审原版后改令**回退至 R12**：R9–R12 的雕版工艺、性能修复（CLS 归零、水合分级）、字体角色制、版面家具**保留**，实验性首屏与新交互全部出局。**定界结论：工艺打磨可以持续；"突破式"重造（改首屏形态、造新交互物件）不再自行发起——任何视觉大改先出一轮截图、拿到用户认可再继续，禁止无人验收的批量交付。**全部提交留存于历史/reflog，可按需 cherry-pick。

---

## 14. 附录

### A. Demo 参考文件

三个演进版 demo（v1 最小起点 → v2 数据面板化反面教材 → v3 M1 验收视觉基准）**已不在仓库中**，仅作历史坐标：站点视觉早被 R1–R12 迭代大幅超越，v3 里的 LangChips、shake、tone 四档等元素后来均被推翻（§13）。它们不再是任何验收基准。

### B. 命名约定
- 文件名：kebab-case（`phrase-table.svelte`、`slot-picker.svelte`）
- 组件名：PascalCase（`PhraseTable`、`SlotPicker`）
- Store 名：camelCase，导入后加 `$` 前缀使用（`$selectedLangs`、`$anchor`）
- CSS 类名：kebab-case，BEM 松散（`phrase-table__row`、`chip--anchored`）
- 类型：PascalCase，不加 `I` 前缀（`Phrase` 而不是 `IPhrase`）；Zod schema 导出类型用 `T` 前缀（`TPhrase`）区分于 schema 本身

### C. Git commit 规范
按 Conventional Commits 松散版本：`feat: …` / `fix: …` / `style: …` / `refactor: …` / `docs: …` / `chore: …`。不强制 body，但每条 commit 要能让三个月后的自己看懂。

### D. 决策记录
见 §13 决策日志（in-doc append-only，2026-06-12 起取代原"将来开 ADR 目录"的设想——项目规模下单文件日志足够）。

### E. 本文档的演化

- **v1.0–v1.3**（2026-04-21~23）— 初版到交互收尾：变体系统、所有语言平等、tone 全局固定、Stationery 替代 chips/pills、TOC 双形态、shell 1240px
- **v1.5**（2026-04-26）— addressee slot 撤除 + 成熟度阈值机制（06-12 按阈值恢复；全史见 §5.7 / §13，此处不复述）
- **v2.0**（2026-06-12）— 文档体例重构：确立"事实层=代码、意图层=本文档"的真相分层（§0 维护规则）；删除全部事实复制品（文件树细节、languages/scenes/en.json/Zod/token 数值快照、组件清单表、workflow YAML）约 -350 行；§6 规格声明为 as-built 快照；已完成里程碑压缩为单行（M1 验收清单移附录 F 作回归手测）；删除已完成使命的"启动 Prompt 模板"章；新设 §13 append-only 决策日志并回填 2026-04 以来的方向性决策。
- **v2.1**（2026-07-02）— 新设 §15 设计迭代账本（功能冻结后的跨会话工作账本）；§6.1 按语言交互收口重写。（追记：此版本升级当时未入本册——版本史断链正是 v2.3 要修的病。）
- **v2.2**（2026-07-03）— 第二周期 R9–R12 as-built：§7.1 改写为字体角色制规范、§9 按 R9 实测再校准、§15 周期账本扩充。（追记，同上。）
- **v2.3**（2026-07-08）— 编排重构（R13–R18 实验回退后的文档对账）：§13 恢复严格时间序（只重排不改字——此前后期条目为"插入"而非"追加"，同日序号错乱、07-07 夹在 07-03 之间）；§15 按 §0 压缩规则重构为「原则 + 开放项 + 周期存档 + 轮次日志」，删去与 §13/轮次日志三重记账的 60 余行已勾条目（独有教训并入轮次日志）；第二周期序言从进行时改为存档（消除与 §13 07-07 定界的矛盾指令）；迭代原则补入「一轮一验」；§8/§11 清单对账；本附录补 v2.1/v2.2 断链。
- **v2.4**（2026-07-10）— 体检手术：**修过期事实** 5 处（§6.4.2 TocSide 显隐规则与面板不透明度按源码勘正、§11 M3/M4 状态、§3.1 Zod 备注）；**去多重记账**（§6.2 v1.5 引用块、§5.9 归口 README、§14A/E 压缩）；**清除事实层复制**（§5.5 字段表、§6 各节像素规格、§3.1 版本列）约 -220 行；**§6 体例改判**——废除"as-built 快照"，只留意图 + 陷阱 + 指针；**§0 新增 §13 条目限长**（≤3 行）。
- **v2.5**（2026-07-10）— 入口层：§0 废除"全文读完再动手"，改为按任务**阅读地图**；新增仓库 `CLAUDE.md`（红线 + 会话纪律 + 阅读地图的常驻指针层——只指路不复述，与本册冲突时以本册为准）。经评估**不拆分**本文档：单文件性是 §0 契约与交叉引用的承重墙，增长已被 v2.4 新规封顶。

### F. 手测回归清单（源自 M1 验收）

> 大半项目已由 Playwright 冒烟自动覆盖（§10.5）；本清单供真机 / 视觉手测复用（§15 开放项）。

- [ ] 首屏状态：TocTop 可见、TocSide 不可见、StickyBar 不可见
- [ ] 滚动过 420px：TocTop 淡出、TocSide 淡入（cards@≥640 / table@≥1024）、StickyBar 淡入（含 ViewToggle）
- [ ] Stationery 两个 slot（anchor / tone）都能展开选项并同步到数据
- [ ] 复制任一 variant 行：行内 `✓ copied` + 全局 Toast
- [ ] LanguagePicker 满 5 时点第 6 个：header 提示变 "remove one to add another"（不再 shake；面板不关）；母语名 + 英文副标分组显示
- [ ] Tab 键穿行：不出现"按 Tab 莫名弹窗"
- [ ] TocSide 静息 rail 随滚动出现（数字 + 进度线可见），hover/focus 才展开；鼠标离开 400ms 后收起；滚动本身不展开
- [ ] 切换视图：卡片宽度始终 720px max；TocSide 在 table 视图也显示
- [ ] 收藏一条短语 → "Starred only" chip 出现；过滤后无收藏的场景整块隐藏
- [ ] hover 变体行 → 喇叭图标出现，点击朗读不触发复制
- [ ] 阿拉伯语开启后文本右对齐（dir=auto），rom 仍左对齐

---
## 15. 设计迭代账本

> **本节地位**：功能冻结（§12 基本全部「不做」）后的设计打磨工作账本。两个迭代周期均已闭环（见「周期存档」）；自 2026-07-07 起适用**一轮一验**规则（§13 当日条目）：视觉改动一次只做一轮，先交截图取得用户认可，再开下一轮——禁止无人验收的批量交付。

### 迭代原则

- 打磨的是**已有**功能的设计——不新增功能（§12 红线不动）；不改首屏形态、不造新交互物件（§13 2026-07-07 定界）
- 信笺气质是底色：暖纸、衬线、极简。改动要让它更像一封信，而不是更像一个 app
- **一轮一验**：每轮 = 审计（截图）→ 设计 → 实现 → 真实浏览器验证 → 测试全绿 → 提交 → **交用户裁决，认可后才开下一轮**
- 动手前先重截当前状态——视觉问题以截图证据为准，不凭记忆
- 浮层复用 popover 原语（§6.1），不再发明第四种协调机制
- AA 是地板（§7.2 门禁）；键盘/读屏行为 axe 扫不到，靠冒烟测试钉 + 手测

### 开放项

- [~] **打印样式**（2026-07-08 落地，**待用户裁决**，不合意一个 revert 即撤）：`global.css` 尾部单个 `@media print` 块，屏幕零影响——交互 chrome 全隐、纸面模拟效果让位真实纸张、`content-visibility` 打印强制 visible（否则折叠线下场景不排版）、sticky 表头改 static（原生 thead 分页重复，sticky 会盖行）、场景标题与行不跨页断开。⚠️ 覆盖 svelte 作用域样式需 `!important`
- [ ] **真实设备手测**：iOS Safari / Android Chrome 真机复核（与 §11 M4 的遗留项合并执行）

### 周期存档

> 逐轮明细在下方轮次日志；方向性因果在 §13。此处只留一段话的周期结论（§0 压缩规则）。

- **第一周期 R1–R8（2026-07-02 ～ 07-03，收官）**——高频功能细节强化：换列「新墨写入」、收藏仪式感、发音墨晕、TOC 阅读进度线、语言面板键盘手感、复制金线；清尾：触屏可供性、404 印章、表格行解剖（348→302px）、移动端回顶钮。
- **第二周期 R9–R12（2026-07-03，收官）**——用户指令「更精致、更艺术品、更惊艳，同时保证性能」。存活四轮：雕版工艺 + 暗色烛光（R9，并修复真实性能回归 CLS 0.115→0、Perf 59→96）、浮层/Toast/卡片工艺统一（R10）、全局字体角色制（R11，规范见 §7.1）、版面家具（R12）。**其后的 R13–R18 六轮「突破式」实验（信封仪式、满版信纸首屏、滚动写字、揭页切换、草稿信）于 2026-07-07 被用户整体否决并回退**——经过、定界与教训见 §13 当日条目；提交留存于 git 历史/reflog。

### 轮次日志

- **R12 · 2026-07-03** — 版面家具收笔：Nº 编号字法、Footer 镜像收笔线、暖色 `::selection`（暗色 AA 需专用 `--selection` token）、标准 `scrollbar-color`（`::-webkit-scrollbar` 会强制 macOS 常显滚动条，不用）。18/18 绿。
- **R11 · 2026-07-03** — 全局字体角色制落地（§7.1 重写 + `--opsz-headword/entry`、`--label-*` tokens、八组件归口、Legend.astro 死代码清除）。验证：2× 截图对比（头词/词条的光轴对比肉眼可辨、菜单三声部比例修正）、18/18 绿、Lighthouse 96/100/100/100 与 CLS 0 保持。
- **R10 · 2026-07-03** — 清尾四件（浮层内衬光统一、章节留白 + rule 渐入、Toast 纸条化、卡片角线）+ noise 混合层以实测结案（6× CPU 节流开/关无差异，保留）+ **wavy 墨线按用户反馈当日回退**（教训记 §13：装饰借形先问既有语义）。
- **R9 · 2026-07-03（第二周期开轮）** — 五个工艺层一次落地（雕版扉页、纸张物性、手写墨线、入场编排、暗色烛光）+ 性能修复（Perf 59→96、CLS 归零）。教训三则：①**性能回归会躲在功能迭代后面**——06-28 语言改造把 CJK 放上首屏引入 CLS 0.115，五轮设计打磨都没碰性能测量，开新周期首件事重测基线才暴露；②**`font-display: optional` 对多子集 CJK 是陷阱**——Chrome 会把所有 unicode-range 相交子集预取回来"备下次"，48→97 请求，比 swap 位移本身伤害更大；修 CLS 的正解是让首屏栈里没有晚到的字体，而不是改晚到字体的显示策略；③**首屏大文本块的入场动画只用位移、不用透明度**——LCP 元素做 opacity 入场会把绘制记录点推迟到动画之后。
- **R8 · 2026-07-03** — 表格行解剖落地（基线 348px → 302px，截图对比法：改前后同区域同参数）。第一周期收官。
- **R7 · 2026-07-03** — 移动端回顶部圆钮落地；表格解剖数值勘察（列宽比是死胡同，方向修正进条目）。
- **R6 · 2026-07-03** — TocSide 交互改判（滚动只点亮静息 rail、展开只由 hover/focus 触发——展开面板不撞表格需视口 ≥1816px，"滚动自动展开"在真实屏幕必然盖内容）、StickyBar 移动端单行、导航一致性评估后以克制结案。新发现：移动端回顶部缺口。
- **R5 · 2026-07-03** — 清尾轮：触屏 copy 常显提示、404 印章、scene id 唯一化（`scene-table-*` / `scene-cards-*`）、slot options 抽 `lib/slot-options.ts` 去重。
- **R4 · 2026-07-03** — 高频块收尾：语言面板键盘手感（键盘开→搜索聚焦、↓ 入列表、阅读序游走、Levenshtein typo 建议）+ 复制金线（画出/回收，inline background-size 而非 SVG stroke——SVG 在多行文本上会断）。冒烟 +2。
- **R3 · 2026-07-03** — 首星布局跳动（slide 过渡）、发音墨晕涟漪 + `aria-pressed`、TOC 阅读进度线（scroll-driven CSS）。教训两则：①账本条目写自审计推测，动手前先读现状——发音反馈与 voice 优选本就存在，实际工作量是条目描述的三分之一；②**实现注意 ⚠️**：lightningcss 会把独立的 `animation-timeline` 合并进 `animation` 简写——规范禁止 timeline 出现在简写里，浏览器随之丢弃整条声明（症状：动画完全不生效且无报错）。解法：`animation-timeline: var(--xx)` 经自定义属性间接引用，压缩器即无法折叠。
- **R2 · 2026-07-03** — 高频功能细节第一对：**换列的「新墨写入」**（`$freshLang` 瞬态居 stores，换列/加列/换 anchor 三个入口标记；表格列头先行、逐行 38ms 级联，卡片视图 lang-block 同语汇）+ **收藏仪式感**（星标 spring pop + 金屑绽放、场景星数微标、空态确认已有兜底）。冒烟测试加星数微标断言。
- **R1 · 2026-07-02** — 全面审计（桌面/移动 × 明/暗 × 表格/卡片 × 悬停/弹层/Toast/404，11 张全状态截图）+ 建账。落地三项：浮层表面近实纸化（TocSide 面板 22%→93%、StickyBar 0.86→0.94——半透明让面板下的表格文字透叠不可读，可读性不得依赖 backdrop-filter）；移动端断行修辞（名字+点收为不可断单元、slot 与前后词收 `.tie` nowrap，标点不再孤悬行首）；VariantRow `lang` 裸码残留补 `langTagOf`。

---

*文档版本 v2.5 · 最后更新 2026-07-10（入口层：§0 阅读地图替代"全文读完"、新增 CLAUDE.md 指针层——明细见附录 E）*
