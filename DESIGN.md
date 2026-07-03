# 致 · 远 · 方 — 设计与开发文档

> 一份多语言日常问候对照站。给与世界各地朋友保持联系的人。

本文档是项目**意图层**的真相源。交给 Claude Code 时，请它全文读完再动手。

---

## 0. 本文档的维护规则

真相分两层，不要混：

1. **事实层以代码和数据为唯一真相**——目录结构、schema 字段、场景列表、token 数值、UI 文案，一律看源文件（`src/lib/schema.ts` / `src/data/scenes.json` / `src/styles/tokens.css` / `src/content/ui/en.json`…）。本文档不复制这些内容，只给路径。历史教训：曾经复制过的每一份事实都烂掉过（"8 种语言"、"6 个场景"、"960px 阈值"都在文档里多活了一个多月）。
2. **意图层以本文档为唯一真相**——为什么这么做、红线、被否决的方案、踩过的坑。代码说不出"为什么"，这是本文档存在的理由。

改动代码后的维护义务：

- 推翻既有设计决策 → 在 §13 决策日志**追加**一条（永不改写旧条目，反转本身是信息）
- 完成里程碑任务 → §11 打勾；里程碑整体完成后压缩成一行
- 其余章节（尤其 §6 规格）**不要求**跟随实现细节更新——已实现功能以源码为准

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

| 层 | 选择 | 版本 | 备注 |
|---|---|---|---|
| 静态生成器 | **Astro** | 7.x | Islands 架构、零 JS 默认、GH Pages 兼容 |
| 交互组件 | **Svelte** | 5.x | 只用于有状态 islands，bundle 极小 |
| 语言 | **TypeScript** | 6.x | strict 开 |
| Schema | **Zod** | via Astro Content Collections |
| 跨组件状态 | **nanostores** | 持久化状态用 `@nanostores/persistent` |
| 样式 | **Vanilla CSS + CSS Variables** | 不用 Tailwind/CSS-in-JS |
| PWA | **@vite-pwa/astro** | Workbox 内核 |
| 字体 | **@fontsource-variable/fraunces** + **@fontsource/instrument-sans** | 自托管，离线可用 |
| 包管理 | **pnpm** | 比 npm 快且磁盘省 |
| 部署 | **GitHub Pages** | 通过 GitHub Actions |

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

**字段说明**

短语级：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 稳定短语 ID，kebab-case |
| `scene` | string | 场景 id，必须存在于 `scenes.json` |
| `order` | number | 场景内排序 |
| `trans` | object | key = 语言 code |

每个 `trans[lang]` 对象：

| 字段 | 类型 | 说明 |
|---|---|---|
| `gloss` | string | 该语言对这个概念的小标签（"问候" / "une salutation"）。显示在锚点列大字下方作小字注脚 |
| `variants` | array | 该语言的所有说法，至少一条 |

每个 variant 对象：

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `text` | string | ✓ | 翻译正文 |
| `rom` | string? |  | 罗马音 / 拼音，仅非拉丁字母语言 |
| `tone` | `casual \| neutral \| polite`? |  | 语境档位。不填 = 通用/默认 |
| `speakerGender` | `m \| f`? |  | 说话者性别（葡语 Obrigado/Obrigada 等） |
| `addresseeGender` | `m \| f`? |  | 听话者性别（西语 amigo/amiga 等） |
| `addresseeCount` | `one \| many`? |  | 对几人说（"大家再见" 设 `many`） |
| `region` | string? |  | 区域变体（`BR` / `PT` / `MX` 等），仅少数场景用 |
| `note` | string? |  | 自由文案，跟 UI locale 同步（v1 写英文） |

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

**加一条新短语**

实际流程基本都是"让 AI 给一份 JSON 贴进去"：

1. 给 AI 一个 prompt：短语概念、所属场景、需要翻译的语言列表、参考其他条目结构
2. AI 输出一个完整的短语对象
3. 存为 `src/data/phrases/<id>.json`（或用 `pnpm run new-phrase` 脚本生成骨架）
4. `pnpm dev` 自动热更，Zod 报错能立刻看到

风格要求见 `README.md` 的 Translation philosophy 四条规则（朋友间温度、只填真实区分、friendly-foreigner 语域、变体宁缺毋滥）。

**加一种新语言**

1. 在 `languages.json` 里追加一条（code/native/tts 等）
2. 给 AI 一个大 prompt：`phrases/` 当前全部内容 + "请给每条短语补上这种语言的 `trans[<new-code>]`"
3. AI 返回逐文件的翻译，你 review 后合入

**加一个新场景**

1. `scenes.json` append 一项
2. 新短语的 `scene` 字段指向它
3. 若要重排，调整数组顺序即可

**辅助脚本（`scripts/`）**

- `new-phrase.mjs` — 交互式询问 id/scene/order，生成 `phrases/<id>.json` 骨架文件（含全部语言的空占位）等你填内容
- `coverage.mjs` — 打印覆盖率矩阵，例如：

  ```
  phrase                  zh  en  ja  ko  es  pt  fr  de
  greeting-hello          ✓   ✓   ✓   ✓   ✓   ✓   ✓   ✓
  catch-miss-seeing       ✓   ✓   ✓   ✓   ✓   ✓   ✓   ·
  affection-care          ✓   ✓   ✓   ✓   ·   ·   ·   ·
  ```

这两个脚本非常简单，Claude Code 在 M0/M1 顺手加。

---

## 6. 功能规格

> **本章地位**：已实现小节的交互细节与像素值以组件源码为准（§0 规则）；本章保留的是设计意图、约束和"实现注意 ⚠️"陷阱——这些读不出于代码。规格在实现后即视为"as-built 快照"，不随重构逐行维护。

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

> v1.5 起 `addressee` slot（friend / woman / man / everyone）从 Stationery 撤掉。原因：当前数据下 addresseeGender 命中率 0、addresseeCount 仅 7/77，控件存在但拨动无变化，反而违反"美学优先"+"内容是主角"。schema 字段保留，相关 tag（"to a woman" / "to everyone"）改在 VariantRow tag line 被动展示。详见 §5.7。

**实现注意 ⚠️**：popover 内的选项 button 关闭态必须 `tabindex="-1"`，展开时才改为 `tabindex="0"`。否则即使视觉上 opacity:0，Tab 键焦点也会进入隐藏选项，浏览器自动滚动把它带进视口，造成"按 Tab 莫名弹窗"的 bug（demo 早期踩过）。`closeAllSlots()` 函数里要把所有 popover 子按钮 tabindex 重置为 -1。

**关键设计意图**：这句话替代了 v2 版本的 chips 墙、legend 说明条、单元格里的 pill 标签三件东西。界面从"有很多控件的后台"降维到"一封写了一半的信"。

### 6.3 视图切换（ViewToggle）

- 两种视图：`table` / `cards`
- 用户主动切换会覆盖默认，存 `$view: 'table' | 'cards' | 'auto'` 持久化
- `auto` 根据视口宽度（≥ 640px → table；v0.1.1 起从 960 下调）自动切
- Toggle 按钮：Masthead 右上角，位于 `position: absolute; top: 24px; right: 24px`，药丸形状的 chip group，两个短 sans 小字按钮 `[Cards] [Table]`（字号 10px，letter-spacing .22em，大写）
- **实现**：通过 `body[data-view]` 属性驱动。规则：
  - `body[data-view="table"] .view-desktop { display: block }` + `.view-mobile { display: none }`
  - `body[data-view="cards"] .view-desktop { display: none }` + `.view-mobile { display: block }`
- **卡片视图的宽度约束（关键）**：`body[data-view="cards"] .card-list { max-width: 720px; margin: 0 auto }` + 场景标题也 `max-width: 720px` 居中。shell 本身仍然 1240px（Masthead / Stationery / Footer 保持原居中），只是卡片容器收窄到 720px，自然在右侧留出 ~260px 空间给 TocSide 落座
- 切换用 Svelte transition 淡入淡出（160ms）
- 响应 `prefers-reduced-motion: reduce` 时关闭过渡

### 6.4 场景目录导航（TocTop + TocSide）

TOC 在不同阅读阶段以两种形态出现，互不重叠。所有状态切换共享一个全局阈值 `scrolled`（滚动超过 420px），来自 `src/lib/scroll.ts` 的 `$scrolled` nanostore。

#### 6.4.1 TocTop — 首屏横向目录页

位置：文档流内，在 Stationery 之下、`<main>` 之上，shell 居中。

```
No. I. Greetings · II. Catching Up · III. Gratitude · IV. Farewells · V. Reactions · … · XI. Holidays
```

- **视觉**：Fraunces 斜体 14px，金色 Roman 编号（opacity 0.85）+ `--ink-mute` 场景名；场景之间用极小的 `•` 实心圆点（3px，`--line` 色）分隔
- **布局**：flex-wrap, justify-content: center, gap 24px
- **交互**：点击 smooth scroll 到对应场景；hover 时数字和场景名都变 accent
- **显隐**：`$scrolled === false` 时可见；`true` 时 `opacity: 0 + pointer-events: none` 淡出（400ms），但保留文档流位置（不跳动）
- **移动端**：font-size 保持 14px；如果溢出就换行（已在 flex-wrap 处理）

#### 6.4.2 TocSide — 滚动后右侧 sidebar

位置：`position: fixed`，垂直居中，右侧锚定在 shell 右内缘（shell max-width 1240px，公式 `right: max(14px, calc((100vw - 1240px) / 2 + 32px))`）。

**显隐规则**：

- 表格视图下：**始终隐藏**（table 已有场景小标题 + 短语密度高，不需要额外导航）
- 卡片视图 + `$scrolled === true` 时才显示
- 卡片视图 + 视口 <640px（真移动）：隐藏，滚动导航由其他机制兜底
- CSS 选择器：`body[data-view="cards"].scrolled .toc { display: flex }`，其他情况 `.toc { display: none }`

**容器**：

- `width: fit-content` + `max-width: 240px`——跟最长场景名自适应，不留大块空白
- `padding: 32px 28px 32px 30px`
- 默认无背景、无边框、无投影——只是几列罗马数字浮在右侧留白里
- 展开态（`.on`）才加 barely-there 羊皮纸层：
  - `background: rgba(245, 237, 217, 0.22)`
  - `box-shadow: 0 0 0 1px rgba(212,198,168,.22), 0 12px 32px -24px rgba(138, 98, 67, .08)`
  - **无 backdrop-filter**（不要毛玻璃，跟纸质气质冲突）
- 过渡：`transition: background .42s ease, box-shadow .5s ease`

**装饰骨架**：

- 竖向 rail：`::before`，`right: 48px`（即在容器右内侧 48px 处）、`top: 44px / bottom: 44px`、`width: 1px`
  - 背景用三段式渐变：`transparent → --gold(16%) → --line(50%) → --gold(84%) → transparent`
  - 默认 opacity 0.35；展开时 0.6
- 上下两端各一个金色 `❋` fleuron 装饰：`::after` 在顶端、`.toc-fleuron-bottom` 元素在底端，都位于 rail 右端延长线上（`right: 48px, transform: translateX(50%)`）
  - 只在展开状态 opacity 0.75，收起时完全隐形

**每个场景项（`.toc-item`）**：

- `display: flex; flex-direction: row-reverse; text-align: right`——数字在右，场景名在左
- 数字（`.num`）：
  - Fraunces 斜体 14px，`font-variation-settings: "opsz" 48, "SOFT" 100`（小字号下用大光轴 + 软转角，更手写）
  - 颜色 `--gold`，默认 opacity 0.8
  - width 22px，text-align center
  - **无背景**——数字"站在" rail 的右侧，不穿过它
- 场景名（`.ttl`）：
  - Fraunces 斜体，`font-weight: 350`（可变字体中间值），`font-size: 14px`，`color: --ink-soft`
  - 收起状态：`opacity: 0, transform: translateX(10px), pointer-events: none`（保留布局宽度但不可见不可点）
  - 展开状态：`opacity: 1, transform: translateX(0), pointer-events: auto`
  - stagger：场景行依次显现，每行延迟 +40ms（场景数从 6 涨到 11 后依然成立，总时长 ~0.44s）
- Active（当前场景）：
  - `.num` 颜色 → `--accent`，opacity 1.0
  - `.ttl` 颜色 → `--ink`，`font-weight: 500`（比默认 350 明显加粗）
  - `.toc-item.active::before` 绝对定位小横线：`right: -10px, width: 0 → 8px`，赤陶色，展开时才出现（.1s delay）
  - 三处视觉线索同时标出当前位置：颜色、字重、短线

**扩展/收起触发**：

- **Hover on TOC**：展开并保持，鼠标离开 400ms 后收起
- **Focus 进入任一 `.toc-item`**：展开；`focusout` 后 400ms 收起（用 `relatedTarget` 判断是否仍在 TOC 内）
- **滚动不展开**（R6 改判，2026-07-03）：展开面板需 ~1816px 视口才不叠到表格末列，"滚动自动展开"在真实屏幕上必然盖住内容。静息 rail（数字 + 活动 accent + 阅读进度线）即滚动反馈；展开只表达用户意图（hover/focus）

**点击**：任一 `.toc-item` → `scrollIntoView({ behavior: 'smooth', block: 'start' })` 到对应场景

#### 6.4.3 Active 场景追踪

在 `src/lib/scroll.ts` 里维护 `$activeScene: string` nanostore。在滚动 RAF 回调里遍历所有 `.scene-block`，取 `boundingClientRect.top <= 120px` 的最后一个作为当前 active。所有 TOC 组件订阅这个 store 并更新 `.active` 类。

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

- 固定第一列，金棕色底（`rgba(166,130,74,.06)`）+ 右侧浅色 border
- 表头显示当前锚点语言的本地名（如 "中文" / "Français"）
- 每行内容三层：
  1. 大字 Fraunces 22px，该短语在锚点语言下筛选后的**第一条变体**
  2. 小斜体 rom（如果有）
  3. 小斜体 gloss（该语言对这个概念的小标签，如 "问候" / "une salutation"）

**卡片视图**

- 卡片顶部同样三层结构，border-bottom 虚线分隔，下面是其他语言块

**缺锚点语言翻译时**：大字显示淡色斜体 `—`，其他列正常显示。这保证锚点语言缺数据不阻断整行。

### 6.10 译文列（TranslationCell + VariantRow）

- 每格竖向堆叠 1-N 个 variant 行，行之间用虚线 `border-top: 1px dashed` 分隔
- 每行结构：
  - 大字 Fraunces 19px，variant.text
  - 小斜体 rom
  - 小斜体 tag line（仅在 `tone=any` 时显示，把 variant 的 tone/gender 渲染成 "— casually" / "he writes"）
  - 小 sans 斜体 note（深衬线左竖线分隔）
  - 右上角 copy hint（hover 时出现 50% 透明）
- 无变体（被筛选干净）时单元格显示斜纹纹样 `repeating-linear-gradient` 占位

### 6.11 顶部细 bar（StickyBar）

当 `$scrolled === true`（滚动超 420px）时，视口顶部淡入一条浮动控制条。目的：在阅读深处能继续调整语气 / 对象偏好，不用滚回顶。

**布局**

```
[致·远·方]   │   I write — [in any tone] — to [a friend]
```

- `position: fixed; top: 0; left: 0; right: 0`，跨全宽
- 高度约 44px，padding `10px 24px`
- 背景：`rgba(235, 225, 204, 0.94)` + `backdrop-filter: blur(14px) saturate(1.2)`（毛玻璃在**这里**是对的——浮动工具栏跟内容是"不同层级"，玻璃感合理；TocSide 不是工具栏，那里才不用 blur。α 自 R1 提到 0.94：blur 只是增强，可读性不得依赖 backdrop-filter 支持）
- 上边缘下方一层极淡的暖色渐变作"透出阴影"

**内部元素**

- 左：`<button class="sb-mark">致 · 远 · 方</button>`——点击 smooth scroll 回顶
- 细竖线分隔
- 中：缩略版 stationery —— "I write — [tone] — to [addressee], as [speaker]"。**不含 anchor slot**（锚点语言切换频率极低，留在 stationery）。addressee/speaker 槽位随 2026-06 性别控件恢复而加入（v1.5 曾整体撤掉）。所有 slot 是 `<SlotPicker>` 实例，跟主 stationery 共享同一个 store，任一处修改两处同步。

**响应式**

- ≤820px：隐藏 mark 和左分隔，只保留句子
- ≤640px：更小字号（13px），允许 flex-wrap

**隐现动画**

- 默认 `opacity: 0; transform: translateY(-100%); pointer-events: none`
- `.on` 状态：`opacity: 1; transform: translateY(0); pointer-events: auto`
- `transition: opacity .32s ease, transform .32s cubic-bezier(.2, .9, .2, 1)`
- 淡出时顺手关闭所有 SlotPicker popover（`closeAllSlots()`）

**不做**：TOC 圆点快捷跳转（之前 demo 有过，后删除——TocSide 已经覆盖导航需求，重复）

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

### 7.1 字体

```css
--font-serif: "Fraunces", "Noto Serif JP", "Noto Serif KR", ui-serif, Georgia, serif;
--font-sans:  "Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
```

- **Fraunces** 做 display + 短语文本（Latin + Cyrillic 它自带，CJK 回退到 Noto Serif JP/KR）
- **Instrument Sans** 做 UI 小字、标签、元信息
- 字重：Fraunces 300/400/500，Instrument Sans 400/500
- 斜体：Fraunces 带独特可变轴（SOFT / WONK），少量使用做点缀

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
- [ ] 键盘能完整操作：Tab 切换、Enter/Space 触发、Esc 关 toast
- [x] 尊重 `prefers-reduced-motion`
- [x] 文档语言 `<html lang="en">`（UI 主语言是英文）
- [ ] 标题层级合理：`h1` 只一个（masthead）

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

### M3 · 语音 + PWA — v1.0.0 上线（剩离线实测）
- [x] `SpeakButton.svelte` + `src/lib/tts.ts` 封装（rate 0.9；行内 hover 显现，与 copy hint 同列）
- [x] Voice 检测：`voiceschanged` 后按 tts code 匹配（精确 → 同语种前缀回退）；无 voice 或语言无 tts code（mizo）时按钮直接不渲染（比禁用+tooltip 更干净）
- [x] `manifest.webmanifest` + 图标（192 / 512 / maskable 512，由 favicon.svg 栅格化生成）
- [x] Service Worker precache：shell（html/css/js/svg，数据已打包进 JS）；字体改为运行时 CacheFirst——CJK Noto 拆分成上百个子集文件，全量 precache 会有几十 MB，按需缓存更合理
- [x] 离线测试 — 自动化（`tests/offline.spec.ts`，§10.5）。修复了 Astro 7 升级打破的 SW 注册（registerSW 不再自动注入，改由 Layout 在 PROD 手动挂载）

### M4 · 打磨（进行中）
- [x] Accessibility audit：axe-core 自动化（**全 WCAG 2.1 A/AA 含对比度**，light+dark 双主题、CI 门禁）。修复 SlotPicker nested-interactive，并把次要小字 / gold 文字 / anchored chip 的对比度补齐到 AA（§7.2）。剩：完整键盘穿行手测
- [x] Lighthouse 实测（slow-4G 模拟）：A11y / BP / SEO 三项 100，Performance 88——达成 §9 校准后预算
- [x] 所有交互的 `prefers-reduced-motion` 处理（在 `global.css` 全局兜底）
- [x] OG image 设计（1200×630）+ meta tags（v0.1.0 已就位 Open Graph + Twitter Card）
- [x] `README.md`：项目说明 + 使用说明 + 数据扩展指南 + 翻译协作哲学
- [x] `404.astro` 简短优雅的 not-found（"This letter went astray."）
- [~] 测试矩阵：Playwright 跨浏览器工程已就绪（chromium/firefox/webkit，`pnpm test:all`，§10.5）。剩真机手测 iOS Safari / Android Chrome

### M5 · 内容扩充（持续）
按需追加短语、语言、场景。工作流见 §5.9。
每次 push main → 自动部署。每次加新语言后跑一遍 `pnpm run coverage` 确认矩阵。

内容演进史以 [GitHub Releases](https://github.com/Chimelight/distant-friends/releases) 为准（§0 规则 1）；方向性决策见 §13。当前规模：23 种语言 × 63 条短语（v1.0.0，2026-06-12 发布）。

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
- **2026-06-13** · **tone 收为三档**（casual / neutral / polite，弃 close/"tenderly"）：close 档全库命中率 0.5%（14/2596），用户拨到 tenderly 几乎所有格子都走 fallback——会动但无效的选项是温柔的陷阱。14 个 close 变体并入 casual（亲昵语义由 note 承载）；持久化的旧值迁移为 casual。
- **2026-06-12** · **性能指标按实测校准**（确立元原则：§2 数字指标非铁律——初版是建站前的 AI 估计；方向性原则 1-4 不动摇，数字以实测修订并记日志）：§9 改为 A11y/BP/SEO=100 + Perf≥85（slow-4G 模拟）、阻塞 CSS <20KB、首屏关键传输 <250KB；明确不用 `font-display: optional` 换分数。
- **2026-06-12** · **性别控件恢复**（反转 v1.5 的撤除，按当时定下的阈值机制触发）：两轴各 60 个标注变体后，Stationery 第二句恢复 addressee 槽位并新增 speaker 槽位。筛选语义：排除显式相反性别，未标保留，空则回退——格子绝不因偏好清空。被动 tag line 在对应筛选激活时隐藏（信息已由槽位表达）。
- **2026-06-27** · **依赖更新自动化**：引入 Dependabot（每周）对 `dev` 开 PR——minor+patch 合为单 PR，`pnpm build`+`pnpm check` 绿灯后自动 squash 合并；major 单独 PR 手动审。落点选 dev 而非默认分支 main：升级照走 dev→main→release 两道人工 PR 再到部署，dev 不落后于 main。仓库 `allow_auto_merge` 关闭，故用直接 squash 合并而非队列式 auto-merge，门禁内置于 workflow 步骤、不依赖分支保护 required checks。详见 §10.4。
- **2026-06-28** · **major 也自动合并**（反转上条的"major 手动审"）：维护者不审 PR diff，"手动审"实际等于永不合、依赖烂在 PR 里。改为 build+check 绿灯即 squash 合并，patch/minor/major 一视同仁；构建/类型检查是唯一关卡，编译或类型不过的留红叉。major 仍单独成 PR（不并入分组），故单个破坏性 major 只挡自己、不拖累整批。残余风险：能构建但有运行时回归的 major 会漏网（项目无测试套件）——靠 dev→main（Vercel preview）→release（Pages）两道预览兜底。
- **2026-06-28** · **引入测试**（反转 §3.3"不引入测试框架"）：上条放开 major 自动合并后，"肉眼验"形同虚设——补上 Playwright + axe-core（冒烟 / 无障碍 / 离线），接入 `ci.yml` 与自动合并门禁（§10.5），把上条的"残余风险"收口。当天即抓到两个真实运行时回归并修复：①Astro 7 升级后 `@vite-pwa/astro`（peer 仅到 Astro 5）不再注入 `registerSW`，PWA 离线**静默失效**——改由 Layout 在 PROD 手动挂载 `registerSW.js`；②SlotPicker 外层 `<button>` 套内层 `<button>`（nested-interactive + 非法 HTML）——拆为 wrapper + 兄弟 popover。axe `color-contrast` 暂排除出门禁：十余处次要小字 < 4.5:1，是否为严格 AA 调暖色调色板属设计决定，待定。
- **2026-06-28** · **对比度补齐 AA**（落实上条"待定"）：判定低对比确为可读性失误而非有意——最暗背景是页面底色 `--bg #EBE1CC`（比 `--paper` 深），早期 AA 脚本只对 paper-up 验证故漏掉这一档；gold 当文字仅 2.7，根本不可读。改法保留暖色身份：ink-mute `#786E5E→#6B6254`、accent（light `#AC4F2B→#A04928` / dark `#D47649→#DA7A4B`）微调；新增 `--gold-ink`（装饰金 `--gold` 不动、17 处文字金改用更深的 gold-ink）；新增 `--on-accent`（accent 填充上的文字，随主题反向）修好 anchored chip。axe `color-contrast` 重新纳入门禁，light+dark 全 A/AA 绿。
- **2026-06-28** · **语言选择改造**（清算 2026-04-22「Stationery 替代 chips 墙」遗留的最后一块）：23 个母语名 chip 墙 → 信笺句行「for friends who read 中文 · English … ▾」+ 点开的分组弹层（5 区域组、母语名 + 英文 exonym、`●` 选中、anchor 赤陶标记、满 5 时 header 提示替代 shake）。一并解决识别（认不出母语文字）、可扫（分组）、违和（chip 墙 vs 信笺三句）。数据加 `name`/`group` 字段（Zod 同步），组件 `LangChips`→`LanguagePicker`（trigger 与 panel 兄弟不嵌套、关闭态 `visibility:hidden`、mizo 用合法 BCP-47 `lus`）。详见 §6.1。顺带修一个先存 bug：`stores.ts` 默认 anchor 硬编码 `'zh'`，与数据 `defaultAnchor=en` 及 §13(04-28) 决策矛盾——改为从 `defaultAnchor` 派生，首访锚点回到 en。
- **2026-06-29** · **语言选择双轨化 + 表格交互**（迭代上条）：用户反馈信笺弹层"好看但操作麻烦、多一步、不能一眼看全"。遂把桌面的语言操作搬进**表格列头**——点列头切换该列语言 / 删列 / "+"添列，表头加英文注释 + sticky；Stationery 语言句行收为**移动端（卡片视图）专用**（`body[data-view]` 切换）。新增共享 `LangMenu`（搜索 + 分组 + 英文名），Stationery 面板补搜索 / 一键清空 / 实心选中态。同轮修三处：①阿拉伯语**非锚点列**真正 RTL（之前只有锚点列有 `dir`；th/cell 补 `dir` + VariantRow/SpeakButton 改逻辑属性）；②亮模式发淡——次要文字 ink-soft/ink-mute 提对比一档（6.9→8.4 / 4.6→5.8，AA 是地板不是"醒目"）；③trigger hover/focus 的变暗染色让 accent 文字掉破 4.5（任何比 `--bg` 暗的背景都会）——改用更亮的 `--paper-up` 高亮。详见 §6.1。
- **2026-06-29（续）** · **语言选择再收敛 + LangMenu 重做视觉**（看预览后的第二轮反馈）：①**桌面句行别藏**——撤销"表格视图 `display:none`"，句行面板两视图都在、作**主控件**；②**sticky 表头别贴顶**——`top` 44→58 + padding 加大，留呼吸；③**搜索选完自动清空**回全列表（不用手删词）；④**表头加/删不便**——表头收为**只快速换列**，加 / 删 / 搜索都回面板；⑤**"UI 没风格、字体怪"**——母语名 italic 在 CJK 上是伪斜体，遂 LangMenu 重做：母语名**直立** serif、英文 exonym serif italic 小字、2 列网格、gold 分组标题、暖色 hover/选中、去掉通用 chip 边框。anchor 在句行标 accent 色化解与"Anchored in"的重复。
- **2026-07-03** · **换列动画取"新墨写入"，弃 FLIP / View Transitions**：表格列的几何过渡在工程上不成立——`<col>` 宽度不可过渡、"一列"是散布在各行的单元格集合、View Transitions 需给 11 表 × 5 列命名快照，成本与收益倒挂。改为内容层面的连续性：换入的语言以列头先行、逐行 38ms 级联的墨迹写入（`$freshLang` 瞬态 + CSS 动画，reduced-motion 全局兜底），语义也更贴信笺——"换一门语言"是重写一栏字，不是挪家具。收藏同轮补仪式感（pop + 金屑绽放 + 场景星数微标），见 §15 R2。
- **2026-07-02（二）** · **进入存量设计迭代期，立账本（§15）**：功能冻结后转入对现有页面/UI/交互/体验的持续多轮打磨，明确跨会话进行——工作账本立于 §15（每轮从账本继续、完成勾销、新发现登记）。R1 审计后落地三项：浮层表面近实纸化（TocSide 面板 22%→93%、StickyBar 0.86→0.94——半透明曾让面板下的表格文字透叠不可读，且可读性不得依赖 backdrop-filter）、移动端 Stationery 断行修辞（标点/分隔点不再孤悬行首）、VariantRow 的 `lang` 裸码残留。
- **2026-07-03（二）** · **性能预算按 R9 实测再校准 + 首屏字体政策**（用户指令开启第二设计周期，性能重测发现 06-28 语言改造把 CJK/西里尔母语名放上首屏后 CLS 涨到 0.115、从未重测）：①CLS 修复**否决了 `font-display: optional` 方案**——实测 Chrome 对 optional 字体预取全部 unicode-range 相交子集（48→97 请求），模拟慢网 FCP 5.6s→12.8s，比病本身更糟；改立**首屏 swap-safe 栈**规则：首屏 UI 标签（印章、语言句行母语名）用 `--font-serif-local`（Fraunces 预载安全 + 本地宋体/明朝体，无晚到 webfont），短语内容保持 Noto。②Instrument Sans latin 入预载。③岛屿水合分级：滚动后才可见/操作后才出现的岛降 `client:idle`，首屏可点的（TocTop）保持 `client:load` 防死点击。同法前后对比 Perf 59→96、FCP 5.6→1.1s、LCP 6.8→2.7s、CLS 0.115→0；§9 预算收紧至 Perf ≥ 90、CLS = 0。
- **2026-07-02** · **语言交互工程收口**（对 06-27~29 批次的代码 review 后重构，行为修正 + 结构清理一次做完）：①**列序 = 选择顺序**——`$selectedLangs` 数组顺序即列序，**换列原位替换**（此前消费端按 languages.json 顺序重排，把首列换成泰语会让新列跳到最右、原列位被后邻顶上，与"switch column to"的心智模型矛盾；冒烟测试恰好选了数据集顺序靠前的 Korean 而漏测）；②**Popover 原语**（`lib/popover.ts`）——单一 `openPopover` store 替代三套"document 监听 + stopPropagation"（旧方案两层可同开、Esc 后焦点掉 body）；同刻一层、Esc 归还焦点、SlotPicker 菜单方向键、满 5/删 anchor 被拒的 `aria-live` 播报——这些是 axe 静态扫描的盲区，靠键盘穿行冒烟测试守；③**弹层条件挂载**——撤销 55 份常驻隐藏菜单（~1200 个 DOM 按钮）与整套 `tabindex` 杂技；④**数据驱动收尾**——分组顺序从数据首现派生（原硬编码组清单会让新组语言静默消失）、BCP-47 进 languages.json（`bcp47` 字段 + `langTag`，替代三份复制的 mizo 特例，并修掉 `lang="mizo"` 漏网两处）、搜索折叠变音符、LangMenu 文案入 `ui/en.json`、store 初始化上移模块层。§6.1 同步改写。

---

## 14. 附录

### A. Demo 参考文件

按重要性排序：

- **`distant-friends-v3.html`** — 视觉与交互的最终参考。**这是 M1 验收的视觉基准**。包含：
  - 7 种语言 × 11 条短语的完整数据（覆盖 tone 四档 / speakerGender / addresseeCount 所有维度）
  - Masthead + Stationery（手写体两行预设句，三个 SlotPicker）
  - LangChips（5 种上限 + shake 反馈 + 锚点赤陶色高亮）
  - ViewToggle（Masthead 右上角药丸）
  - TocTop（首屏横向目录页）
  - TocSide（滚动后右侧 sidebar，collapse/expand，hover + 滚动活动触发，4 档 stagger）
  - StickyBar（顶部浮条，mark + 缩略 stationery，无 anchor）
  - PhraseTable（桌面表格，按场景分 block，锚点列 + 变体列）
  - PhraseCards（卡片视图，`.card-list` max-width 720px 居中）
  - VariantRow（含 rom / tag line / note / copy hint）
  - 完整的 `visibleVariants()` 过滤逻辑
  - Toast 复制反馈
  - 纸纹 SVG 滤镜、暖色 vignette、`@keyframes rise/pulse/shake`、全部色板
- `distant-friends-v2.html` — 过程版。展示场景 chips + 单元格 pill 标签的方案。**已被推翻**（视觉过于数据面板化），保留作为"避免变成这样"的反面教材。
- `distant-friends.html`（v1）— 最初版。展示基础表格/卡片视图 + 单变体结构，没有场景导航、变体系统、锚点切换。作为"最小干净版"的视觉起点。

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

- **v1.0**（2026-04-21）— 初版：5 场景、单变体结构、per-phrase 文件夹、中文 source + 英文 gloss
- **v1.1**（2026-04-22）— 加入变体系统（register / gender / count 维度）、UI i18n 结构、per-phrase 文件夹 + per-language trans 文件
- **v1.2**（2026-04-22）— 大幅简化：所有语言平等、tone 四档固定、手写体 Stationery 替代所有 chips/pills、扁平三文件数据结构、UI 锁英文、每语言有自己的 gloss、语言数量上限 5 种
- **v1.3**（2026-04-23）— 交互与视觉收尾：TOC 拆为 TocTop（首屏）+ TocSide（滚动后 sidebar，collapse/expand hover 展开）双形态；StickyBar 简化为 mark + tone + addressee；ViewToggle 提前到 M1（与卡片宽度约束 720px 强绑定）；`scroll.ts` 作为全局滚动状态中心；新增语义化 surface tokens；踩坑案例文档化（copy hint / SlotPicker tabindex）；shell 宽度 1180 → 1240px
- **v1.5**（2026-04-26）— addressee slot（friend / woman / man / everyone）从 Stationery 和 StickyBar 整体撤掉：当前数据下 addresseeGender 命中率 0、addresseeCount 仅 9% 且只对单条短语有效，控件存在却拨动无效违反"内容是主角"原则。schema 字段（`speakerGender` / `addresseeGender` / `addresseeCount`）保留，VariantRow tag line 被动展示（"he writes" / "to a woman" / "to everyone"）。`scripts/coverage.mjs` 升级输出三个轴的命中数 + 距阈值（10）的差距，作为未来何时恢复 UI 控件的触发指标。`visibleVariants()` 简化为只接受 tone。
- **v2.0**（2026-06-12）— 文档体例重构：确立"事实层=代码、意图层=本文档"的真相分层（§0 维护规则）；删除全部事实复制品（文件树细节、languages/scenes/en.json/Zod/token 数值快照、组件清单表、workflow YAML）约 -350 行；§6 规格声明为 as-built 快照；已完成里程碑压缩为单行（M1 验收清单移附录 F 作回归手测）；删除已完成使命的"启动 Prompt 模板"章；新设 §13 append-only 决策日志并回填 2026-04 以来的方向性决策。

### F. 手测回归清单（源自 M1 验收）

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

## 15. 设计迭代账本（跨会话，进行中）

> **本节地位**：功能已冻结（§12 基本全部「不做」），2026-07-02 起进入**存量设计迭代期**——对页面 / UI / 交互 / 体验做持续多轮打磨，跨会话进行。这里是**工作账本**：每轮从最高优先的未勾项继续，新发现随时登记，完成即勾掉并在 §13 记决策因果。排序按 影响 × 确定性；动手前先重截当前状态（视觉问题以截图证据为准，不凭记忆）。

### 迭代原则

- 打磨的是**已有**功能的设计——不新增功能（§12 红线不动）
- 信笺气质是底色：暖纸、衬线、极简。改动要让它更像一封信，而不是更像一个 app
- 浮层语言已统一为 popover 原语（§6.1）——新浮层复用它，不再发明第四种协调机制
- AA 是地板（§7.2 门禁）；键盘/读屏行为 axe 扫不到，靠冒烟测试钉 + 手测
- 每轮闭环：审计（截图）→ 设计 → 实现 → 真实浏览器驱动验证 → 测试全绿 → 提交

### 待办（按优先级粗排）

**高频功能细节强化（用户指定的最高优先方向，2026-07-02）**——语言选择、TOC、收藏、发音、复制这些每次访问都会碰的小功能，不止样式：交互手感、状态反馈、以及适度"炫技"（现代 CSS / 平台能力的漂亮运用，优雅降级），让常用之处给人"这项目不一般"的印象：

- [x] **换列/加删列的连续性动画**（R2）：落地为**「新墨写入」**而非 FLIP/View Transitions——换列/加列/换 anchor 时，该列（两视图皆然）以列头先行、逐行 38ms 级联的墨迹节奏写入（`$freshLang` 瞬态 + CSS `ink-in`）。技术判断记 §13：table 列宽不可过渡、单元格分散于行使 FLIP 不可行，55 个命名元素让 View Transitions 快照成本过高；"内容写入"比"几何滑动"更信笺。
- [x] **收藏的仪式感**（R2）：星标 pop（spring 缩放）+ 六点金屑绽放（box-shadow 粒子，CSS-only，reduced-motion 全局降级为瞬时填充）；场景标题旁星数微标（两视图，金星 + 计数）。空态经查**已有处理**——StarFilter 在星数归零时自动解除过滤（先存 $effect），无需文案；"金角记号"弃——anchor 格角上的实心金星本身就是行标记，再加一枚是冗余。
- [x] **首次星标的布局跳动**（R3）：StarFilter 改 `transition:slide`（320ms，`prefersReducedMotion` 时 0）——首星时内容区不再瞬间下顶 40px，随绽放动画从容展开；末星取消同样滑出。
- [x] **发音的可感反馈**（R3，账本原文有两处与现状不符）：经查 SpeakButton **本就有**播放反馈（accent 变色 + 双声波脉冲、点击停止、aria-label 切换），tts.ts 的 **voice 优选也早已实现**（natural/neural/premium/siri 加分、Google 网络声加分、离线只留 local）——审计时想当然了。本轮实际补的：墨晕涟漪（`::before` 呼吸环，播放中持续外扩）增强可感性 + `aria-pressed` 切换语义；reduced-motion 全套豁免。
- [x] **TOC 阅读进度**（R3）：rail 上叠一道金→赤陶渐变的进度线，`animation-timeline: scroll(root)` 纯 CSS 驱动，`@supports` 门控（不支持的浏览器完全不见）；静息 rail 低调可见（0.45），展开加深（0.85）。位置随用户自己的滚动映射，无 vestibular 顾虑。
- [x] **语言面板的键盘/搜索手感**（R4）：键盘打开（Enter/Space，`click.detail===0` 判定）焦点直落搜索框——面板与列头两个入口一致；搜索框 ↓ 落列表首项；方向键按阅读序游走（↑ 越过首项回搜索、Home/End）；空态给**最近似建议**（Levenshtein ≤3 取前 3，"koraen"→Korean），选项渲染抽成 snippet 复用。几何 2D 游走（跨分组按列对齐）弃：组间列数不连续，阅读序更可预测。
- [x] **复制的笔触反馈**（R4）：copied 时一道金线在原文正下方左→右画出（RTL 文本从右画，`:dir()`），copied 消退时回收。落地为 inline span 的 background-size 过渡而非账本原设想的 SVG stroke——SVG 定位在多行文本上会断、repeat-x 波浪随 size 动画变形；渐变金（gold→gold-ink→gold）保留一点墨色不匀。

其余（既有登记）：

- [x] **表格行解剖与密度**（R8）：变体内部四声部收成两声部——tag 与 note 合到**一行一个语域**（serif italic 12px、金色 "—" 起笔、两者共存时 "·" 相连），note 原本的 sans+左边框"第三种声音"撤销；变体间整宽虚线改 26px 短刻线（inline-start 对齐文字起笔）；内距 18→15。最密行高 348→302px（-13%），密度差随行高压缩而缓和。rom/text 字号比（12.5/19）复核后不动；anchor 列宽 R7 已证伪。
- [x] **触屏可供性**（R5）：copy 提示在 `@media (hover: none)` 下常显（opacity 0.4），与 SpeakButton 的既有 hover-none 处理（0.45）同一语汇。SpeakButton 经查本就处理了——账本原文又写重了一半。
- [x] **TocSide 与表格的空间关系**（R6）：算清了几何——展开面板不撞表格需要视口 ≥1816px，"滚动自动展开"在真实屏幕上必然把面板滑过末列。**行为改判**：滚动只点亮静息 rail（数字 + 活动 accent + 进度线即滚动反馈），展开只由 hover/focus 触发（用户主动、短暂、不透明覆盖可接受）。顺带删掉整套 idle 计时器。
- [x] **StickyBar 移动端**（R6）：≤640 只剩 "I write — [tone]" + 主题切换（ViewToggle 本就 <640 隐藏），去掉 flex-wrap——单行成立，两行吃掉四分之一屏的情况不再出现。遗留小项：≤820 seal 隐藏后移动端没有回顶部入口（记于下一条）。
- [x] **导航一致性**（R6，评估后不动）：TocTop 与 TocSide 已共享词汇（serif 斜体 + 罗马数字 + gold/accent 活动态），且是同一导航的先后两段（顶部索引 420px 后淡出、侧栏接棒）——差异是功能性分工，不是失调。为改而改违背 §2。
- [x] **移动端回顶部**（R7）：独立纸质圆钮（40px、paper 面、gold-ink ↑、拇指位右下），≤820 且已滚动时出现——塞回窄条的方案几何算不过（320px 视口必然与居中 prose 挤压），独立按钮反而干净。冒烟 +1。
- [x] **404 品牌连续性**（R5）：致·远·方 印章落到 404 顶部，参数与 Masthead chip 对齐（13px / 0.6em 字距 / 同 padding，`text-indent` 抵消字距尾隙）；"footer 同款落款"评估后弃——404 文案已自足，再加落款反而堆砌。
- [x] **重复 scene id**（R5）：两视图 id 改为 `scene-table-*` / `scene-cards-*`（文档级唯一，验证 0 重复）；`data-scene` 仍是跨视图共享键，jumpTo 的 offsetParent 挑可见视图机制保留（这是它的本职，不是 workaround）。
- [x] **SlotPicker options 复制**（R5）：tone/speaker/addressee 选项数组抽到 `lib/slot-options.ts`，Stationery 与 StickyBar 共用。
- [ ] **打印样式**（⚠️ 边界项，默认不做）：信纸气质适合打印，但接近新功能——待用户拍板再动。

### 第二周期 · 整体审美升级（2026-07-03 起，用户指令）

用户指令：**完全升级现有设计样式——更精致、更艺术品、更惊艳，同时性能优化也非常好。** 方向判读：不是换气质（§2 信笺红线不动），而是把「好的排印」推进到「印刷艺术品」——雕版工艺、纸张物性、手写墨性、光线氛围四个层次。性能约束贯穿全周期：零新依赖、零新网络资源（只用 CSS 渐变/阴影/原生排印能力），每轮收尾 Lighthouse 同法对比，不降反升。

R9 开轮审计（重截 11 张全状态截图 + Lighthouse 重测）发现**性能真实回归**：CLS 0.115（预算 ≈0）——06-28 语言改造把 CJK/孟加拉母语名放上首屏（信笺句行、印章），CJK 字体异步到达后重排推移 TocTop 整块；改造后从未重测。修复项与工艺项并列入本轮。

工艺待办（按 影响 × 确定性）：

- [x] **雕版扉页**（R9，Masthead + 404 印章同步）：印章药丸去通用化（999px 圆角是"AI 模板"语汇残留 → 双线方章 + text-indent 光学居中）；标题下分隔从「单线 + 小方块」升级为「让位中央的双 hairline + 金菱」（扉页 rule 语汇）
- [x] **纸张物性**（R9，表格 + 卡片）：table-wrap/card 从「平贴在背景上」到「搁在桌面的纸」——暖影抬升 + 顶缘内衬光（`--shadow-paper`/`--paper-edge` tokens，明暗各一套）
- [x] **手写墨线**（R9，SlotPicker + LanguagePicker 触发器）：机械等距 dashed 下划线 → 原生 wavy text-decoration 墨线（逐行断行正确、零资源）。⚠️ 两处断行陷阱：slot 的 caret 用 `display:inline-block` 隔离出下划线（.tie nowrap 罩住不会孤悬）；语言触发器的 caret **不能** inline-block（原子内联重开断行机会、▾ 孤悬行首）——用 `\2060` WORD JOINER 粘住 + 末位 unit 不发零宽空格
- [x] **首屏入场编排**（R9）：mark → tagline → stationery → TocTop 依次 rise（delay 0.05/0.16/0.27/0.38s，一次性）；**title 不参与**——LCP 元素做 opacity 入场会推迟 LCP 记录点
- [x] **暗色烛光**（R9）：vignette 暖光入 tokens（`--vignette-top/bottom`），暗色提到 0.17/0.13（暗底上的暖 radial 读作"光"而非"色"）；金饰微光评估后弃——vignette 已够，再加即堆砌
- [x] **性能修复**（R9，方案中途反转，详 §13 2026-07-03（二））：CLS 0.115→0 靠**首屏 swap-safe 字体栈**（`--font-serif-local`：印章 + 句行母语名），原计划的 `font-display: optional` 实测触发子集预取风暴（48→97 请求、FCP 翻倍）被否；Instrument Sans latin 入预载；StickyBar/TocSide/Toast/StarFilter 降 `client:idle`（TocTop 保持 load 防死点击）。同法对比 Perf 59→96、FCP 5.6→1.1s、LCP 6.8→2.7s、CLS 0.115→0、测试 18/18 绿
- [ ] 后续轮候选：场景标题章节页化（rule 工艺、num 字法）、Toast/浮层工艺统一、noise 混合层合成成本实测（fixed + `mix-blend-mode: multiply` 全屏层滚动重合成开销）、卡片视图 registration 角线呼应、真实移动设备的入场编排手感复核

### 轮次日志

- **R9 · 2026-07-03（第二周期开轮）** — 五个工艺层一次落地（雕版扉页、纸张物性、手写墨线、入场编排、暗色烛光）+ 性能修复（Perf 59→96、CLS 归零）。教训两则：①**性能回归会躲在功能迭代后面**——06-28 语言改造把 CJK 放上首屏引入 CLS 0.115，五轮设计打磨都没碰性能测量，开新周期首件事重测基线才暴露；②**`font-display: optional` 对多子集 CJK 是陷阱**——Chrome 会把所有 unicode-range 相交子集预取回来"备下次"，48→97 请求，比 swap 位移本身伤害更大；修 CLS 的正解是让首屏栈里没有晚到的字体，而不是改晚到字体的显示策略。
- **R8 · 2026-07-03** — 表格行解剖落地（基线 348px → 302px，截图对比法：改前后同区域同参数）。**账本至此只剩「打印样式」一项，属边界项、待用户拍板；设计迭代第一大周期收官。**
- **R7 · 2026-07-03** — 移动端回顶部圆钮落地；表格解剖做了数值勘察（列宽比是死胡同，方向修正进条目）。**账本至此仅剩两项：表格行解剖（大项）与打印样式（边界项，待用户拍板）。**
- **R6 · 2026-07-03** — TocSide 交互改判（滚动亮 rail、悬停展开，几何论证记条目内）、StickyBar 移动端单行、导航一致性以克制结案。新发现：移动端回顶部缺口。
- **R5 · 2026-07-03** — 清尾轮：触屏 copy 常显提示、404 印章、scene id 唯一化、slot options 去重。四项皆小，合并一轮。
- **R4 · 2026-07-03** — 高频块收尾：语言面板键盘手感（键盘开→搜索聚焦、↓ 入列表、阅读序游走、typo 建议）+ 复制金线（画出/回收）。冒烟 +2（键盘流、typo 建议）。**高频功能细节强化块至此全部完成。**
- **R3 · 2026-07-03** — 首星布局跳动（slide 过渡）、发音墨晕涟漪 + `aria-pressed`、TOC 阅读进度线（scroll-driven CSS）。教训两则：①账本条目写自审计推测，动手前先读现状——发音的反馈与 voice 优选本就存在，实际工作量是条目描述的三分之一；②**实现注意 ⚠️**：lightningcss 会把独立的 `animation-timeline` 合并进 `animation` 简写——规范禁止 timeline 出现在简写里，浏览器随之丢弃整条声明（症状：动画完全不生效且无报错）。解法：`animation-timeline: var(--xx)` 经自定义属性间接引用，压缩器即无法折叠。
- **R2 · 2026-07-03** — 高频功能细节第一对：**换列的"新墨写入"**（`$freshLang` 瞬态居 stores，换列/加列/换 anchor 三个入口标记；表格列头先行、逐行级联，卡片视图 lang-block 同语汇）+ **收藏仪式感**（星标 spring pop + 金屑绽放、场景星数微标、空态确认已有兜底）。冒烟测试加星数微标断言。
- **R1 · 2026-07-02** — 全面审计（桌面/移动 × 明/暗 × 表格/卡片 × 悬停/弹层/Toast/404，11 张全状态截图）+ 建账。落地三项：
  - **浮层表面可读性**：TocSide 展开面板原是 22%/40% α 的"羊皮纸低语"，但它在 <1440 视口叠在表格末列上——文字叠文字不可读；改近实纸（light 0.93 / dark 0.94）+ 边框投影提一档，读作"搁在纸上的便签"。StickyBar α 0.86→0.94——backdrop-filter 只是增强，可读性不能依赖它。
  - **移动端断行**：句行分隔点曾折成行首「·Deutsch」、逗号孤悬「, as myself」——名字+点收为不可断单元（零宽空格连接），slot 与前后词/标点收为 `.tie` nowrap 词组，断行只发生在词组之间。
  - **`lang` 残留**：VariantRow `lang={langCode}` 是裸数据码（mizo→非法 tag），补 `langTagOf`；prop 本身保留数据码（SpeakButton 的 TTS voice 匹配用）。

---

*文档版本 v2.1 · 最后更新 2026-07-03（v1.2.0 发布；设计迭代第一周期 R1–R8 收官，第二周期 R9 落地）*
