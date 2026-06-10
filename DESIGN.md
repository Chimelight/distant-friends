# 致 · 远 · 方 — 设计与开发文档

> 一份多语言日常问候对照站。给与世界各地朋友保持联系的人。

本文档是项目的真相源（source of truth）。交给 Claude Code 时，请它全文读完再动手。

---

## 1. 项目愿景

**它是什么**
一个温暖、精致、离线可用的日常问候短语对照站，覆盖约 20–40 条朋友间常用的问候 × 8 种语言（可扩展）。点击即复制、可听发音、可收藏、深色浅色切换。

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

这五条是红线，后续所有决策以此为准绳：

1. **美学优先。** 编辑体/信笺感。绝不允许"AI 网页模板"的观感（Inter 字体、紫色渐变、通用圆角卡片）。
2. **内容是主角。** UI 消隐让位给短语本身。装饰元素存在是为了衬托文字，不是秀技。
3. **一次加载，永久可用。** PWA 离线优先，任何功能在无网环境下都能用（TTS 除外，取决于浏览器）。
4. **键盘可达 + 屏幕阅读器友好。** 不能因为美学牺牲可访问性。AA 级对比度起步。
5. **轻而快。** 首屏 < 150KB（含字体）、LCP < 1.5s、Lighthouse ≥ 95 四项全优。

---

## 3. 技术选型

### 3.1 核心栈

| 层 | 选择 | 版本 | 备注 |
|---|---|---|---|
| 静态生成器 | **Astro** | 4.x | Islands 架构、零 JS 默认、GH Pages 兼容 |
| 交互组件 | **Svelte** | 5.x | 只用于有状态 islands，bundle 极小 |
| 语言 | **TypeScript** | 5.x | strict 开 |
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

**不用**：图标库（图标自己写 SVG，总共五六个）、UI 库（组件自己写）、动画库（Svelte transition 够了）、状态管理大件（nanostores 就够）、测试框架（项目太小，肉眼验 + 手动清单）。

---

## 4. 项目结构

```
distant-friends/                 # 项目根（建议名字，可换）
├── .github/
│   └── workflows/
│       └── deploy.yml           # 推 main 自动构建部署到 gh-pages
├── public/
│   ├── icons/                   # PWA 图标 192/512/maskable
│   ├── og-image.png             # 社交分享图 1200×630
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── astro/               # 纯静态组件，无 JS
│   │   │   ├── Layout.astro
│   │   │   ├── Masthead.astro
│   │   │   ├── Footer.astro
│   │   │   └── Legend.astro     # 场景标题组件（小圆点 + 细线）
│   │   └── svelte/              # 交互 islands
│   │       ├── LangChips.svelte
│   │       ├── Stationery.svelte   # 手写体预设句容器
│   │       ├── SlotPicker.svelte   # 可点击的斜体词（anchor/tone）
│   │       ├── TocTop.svelte       # 首屏横向目录页（未滚动时显示）
│   │       ├── TocSide.svelte      # 右侧 sidebar TOC（滚动后显现 + hover 展开）
│   │       ├── StickyBar.svelte    # 顶部细 bar（mark + tone slot）
│   │       ├── ViewToggle.svelte
│   │       ├── PhraseTable.svelte
│   │       ├── PhraseCards.svelte
│   │       ├── TranslationCell.svelte
│   │       ├── VariantRow.svelte   # 单个变体（text + rom + tag + note + copy）
│   │       ├── SpeakButton.svelte
│   │       ├── StarButton.svelte
│   │       ├── ThemeToggle.svelte
│   │       └── Toast.svelte
│   ├── data/
│   │   ├── phrases.json         # 所有短语 + 每语言 gloss + variants
│   │   ├── languages.json       # 语言元信息（code/native/tts/...）
│   │   └── scenes.json          # 场景有序列表
│   ├── lib/
│   │   ├── schema.ts            # Zod schema + 类型导出
│   │   ├── stores.ts            # nanostores: selectedLangs / anchor / tone / view / theme / starred
│   │   ├── filter.ts            # visibleVariants() 变体筛选逻辑
│   │   ├── scroll.ts            # 全局滚动状态：scrolled / activeScene / tocExpanded（nanostores + RAF listener）
│   │   ├── clipboard.ts         # 带 fallback 的复制工具
│   │   ├── tts.ts               # Web Speech API 封装
│   │   └── storage.ts           # localStorage 工具 + 版本迁移
│   ├── content/
│   │   └── ui/
│   │       └── en.json          # UI chrome 字符串（v1 只出英文）
│   ├── styles/
│   │   ├── tokens.css           # CSS 变量（light + dark）
│   │   ├── global.css           # reset + base
│   │   └── typography.css
│   ├── pages/
│   │   └── index.astro          # 主页（目前唯一页面）
│   └── types.ts                 # 导出的类型别名
├── scripts/
│   ├── new-phrase.mjs           # 交互式新增短语骨架
│   └── coverage.mjs             # 打印各语言覆盖率矩阵
├── astro.config.mjs
├── svelte.config.js
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── README.md
└── DESIGN.md                    # 本文件
```

**数据文件的位置说明**：`src/data/` 而不是 `src/content/collections/`。原因：AI 一次生成一大块 JSON，扁平结构便于整体替换；Content Collections 的嵌套扫描限制反而碍事。Zod 校验在 `src/lib/schema.ts` 显式跑，构建时校验，效果等同。

---

## 5. 数据模型

### 5.1 设计原则

五条硬原则：

1. **所有语言平等**。不存在"源语言"，每种语言都是同一概念的一个 realization。中文、英文、日文、泰文都是 `languages.json` 里并列的一员。
2. **锚点列是用户选择，不是数据属性**。任何一种语言都可以被用户拉到锚点列，切换不影响数据。
3. **语境维度全局固定**。Tone 就是 `close / casual / neutral / polite` 四档，不扩展。每种语言只在它真实有区分的层级上填变体，没有就不填。
4. **缺翻译不是错误**。构建时列出覆盖率报告，运行时该格显示占位纹样，不 hard fail。
5. **扁平结构便于 AI 协作**。三个 JSON 文件装完所有内容数据，AI 一次性输出、整体替换友好。per-phrase 文件夹结构被抛弃。

### 5.2 文件组织

三个扁平 JSON + 一个 UI 文件：

```
src/data/
├── phrases.json       # 所有短语的完整数据（含各语言 gloss + variants）
├── languages.json     # 语言元信息（code/native/tts/rtl）
└── scenes.json        # 有序场景列表

src/content/ui/
└── en.json            # UI chrome 字符串（v1 只出英文）
```

### 5.3 Schema — 语言（`languages.json`）

```json
[
  { "code": "zh", "native": "中文",      "tts": "zh-CN", "rtl": false, "defaultOn": true,  "defaultAnchor": true },
  { "code": "en", "native": "English",   "tts": "en-US", "rtl": false, "defaultOn": true  },
  { "code": "ja", "native": "日本語",    "tts": "ja-JP", "rtl": false, "defaultOn": true  },
  { "code": "ko", "native": "한국어",    "tts": "ko-KR", "rtl": false, "defaultOn": false },
  { "code": "es", "native": "Español",   "tts": "es-ES", "rtl": false, "defaultOn": false },
  { "code": "pt", "native": "Português", "tts": "pt-BR", "rtl": false, "defaultOn": true  },
  { "code": "fr", "native": "Français",  "tts": "fr-FR", "rtl": false, "defaultOn": true  },
  { "code": "de", "native": "Deutsch",   "tts": "de-DE", "rtl": false, "defaultOn": false }
]
```

- `defaultOn`：首次访问时默认勾选的语言（加上 anchor 后控制在 5 以内）
- `defaultAnchor`：标记哪一种是首次访问的锚点（仅一个为 true；当前建议中文）
- 语言不声明 `dimensions`——tone 四档对所有语言统一；哪些变体有 tone 标签取决于该语言该短语下的实际内容

### 5.4 Schema — 场景（`scenes.json`）

```json
[
  { "id": "greetings",   "num": "No. I",    "title": "Greetings",   "em": "Greetings"   },
  { "id": "catching-up", "num": "No. II",   "title": "Catching Up", "em": "Up"          },
  { "id": "gratitude",   "num": "No. III",  "title": "Gratitude",   "em": "Gratitude"   },
  { "id": "affection",   "num": "No. IV",   "title": "Affection",   "em": "Affection"   },
  { "id": "well-wishes", "num": "No. V",    "title": "Warm Wishes", "em": "Wishes"      },
  { "id": "farewells",   "num": "No. VI",   "title": "Farewells",   "em": "Farewells"   }
]
```

- `em` 字段：标题里要斜体强调的那个词（跟 demo 视觉一致，给"Warm **_Wishes_**"这种排印）
- 顺序就是页面显示顺序（TOC 和内容都按数组顺序）

### 5.5 Schema — 短语（`phrases.json`）

核心数据在这里。数组，每条短语一个对象：

```json
[
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
      "ja": {
        "gloss": "挨拶",
        "variants": [
          { "text": "こんにちは", "rom": "konnichiwa", "tone": "neutral", "note": "Daytime standard; works with anyone." },
          { "text": "やっほー",   "rom": "yahhō",      "tone": "close",   "note": "Playful; between close friends." }
        ]
      },
      "pt": {
        "gloss": "uma saudação",
        "variants": [
          { "text": "Olá" },
          { "text": "Oi", "tone": "casual" }
        ]
      }
      /* other languages... */
    }
  }
]
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
| `tone` | `close \| casual \| neutral \| polite`? |  | 语境档位。不填 = 通用/默认 |
| `speakerGender` | `m \| f`? |  | 说话者性别（葡语 Obrigado/Obrigada 等） |
| `addresseeGender` | `m \| f`? |  | 听话者性别（西语 amigo/amiga 等） |
| `addresseeCount` | `one \| many`? |  | 对几人说（"大家再见" 设 `many`） |
| `region` | string? |  | 区域变体（`BR` / `PT` / `MX` 等），仅少数场景用 |
| `note` | string? |  | 自由文案，跟 UI locale 同步（v1 写英文） |

**rom / tone / note 都跟 variant 绑定**（不属于 UI 文案），原因是它们是在描述"这个翻译"，不是在描述"界面"。判断标准：如果删掉所有翻译，这段文字还有意义吗？没有 → 跟 variant 走。

### 5.6 Zod schema（`src/lib/schema.ts`）

```ts
import { z } from 'zod';

export const Tone = z.enum(['close', 'casual', 'neutral', 'polite']);
export const Gender = z.enum(['m', 'f']);
export const Count = z.enum(['one', 'many']);

export const Variant = z.object({
  text: z.string().min(1),
  rom: z.string().optional(),
  tone: Tone.optional(),
  speakerGender: Gender.optional(),
  addresseeGender: Gender.optional(),
  addresseeCount: Count.optional(),
  region: z.string().optional(),
  note: z.string().optional(),
});

export const LangTrans = z.object({
  gloss: z.string(),
  variants: z.array(Variant).min(1),
});

export const Phrase = z.object({
  id: z.string(),
  scene: z.string(),
  order: z.number().int(),
  trans: z.record(z.string(), LangTrans),   // key = lang code
});

export const Language = z.object({
  code: z.string(),
  native: z.string(),
  tts: z.string(),
  rtl: z.boolean().default(false),
  defaultOn: z.boolean().default(false),
  defaultAnchor: z.boolean().default(false),
});

export const Scene = z.object({
  id: z.string(),
  num: z.string(),
  title: z.string(),
  em: z.string(),
});

export const PhrasesFile   = z.array(Phrase);
export const LanguagesFile = z.array(Language);
export const ScenesFile    = z.array(Scene);

export type TPhrase   = z.infer<typeof Phrase>;
export type TVariant  = z.infer<typeof Variant>;
export type TLanguage = z.infer<typeof Language>;
export type TScene    = z.infer<typeof Scene>;
```

**运行时点**：在 Astro 构建开始时（`astro.config.mjs` 的 integration hook 或 `pages/index.astro` 顶部脚本）读三个文件、跑 Zod parse。任何 schema 错误立即 throw，构建失败——这保证线上数据永远合法。

### 5.7 变体筛选逻辑（`src/lib/filter.ts`）

UI 状态有两个维度影响变体显示：`anchor`（哪种语言放锚点列）、`tone`（`any` 或某一档）。

```ts
export function visibleVariants(
  all: TVariant[],
  tone: 'any' | 'close' | 'casual' | 'neutral' | 'polite',
): TVariant[] {
  if (!all?.length) return [];
  let pool = all;

  if (tone !== 'any') {
    const toned = pool.filter(v => v.tone === tone);
    if (toned.length) pool = toned;
    else {
      // no exact match: fall back to untoned (default) variants
      const untoned = pool.filter(v => !v.tone);
      if (untoned.length) pool = untoned;
    }
  }

  return pool;
}
```

**关键原则**：筛选失败时优雅降级，不返回空数组。这保证 UI 里永远有东西显示。

**addressee 维度故意省略**。`speakerGender` / `addresseeGender` / `addresseeCount` 仍然在 schema 上保留，但只作为**被动描述标签**通过 VariantRow 的 tag line 渲染（"he writes" / "to a woman" / "to everyone"），不参与筛选。原因：v1 数据下这三个轴的命中率太低（speakerGender 2/77、addresseeGender 0/77、addresseeCount 7/77），做成显眼的 UI 控件让用户拨了发现没变化反而更糟。`scripts/coverage.mjs` 会持续打印这三个轴的命中数 + 距阈值的差距；当 speakerGender 或 addresseeGender 累积超过 ~10 个 cell 时再考虑加回 UI 控件（届时 Stationery 大概是 *signed by [me · he · she]* 的第三句，或类似 addressee gender 的写法）。

### 5.8 UI 字符串（`src/content/ui/en.json`）

跟具体翻译无关的所有界面文本。v1 只有英文一份，未来可加 `zh.json` 做 UI 中文化。

```json
{
  "masthead": {
    "tagline": "A warm glossary — small enough to hold, tuned to <em>who</em> you're writing to and <em>how</em> you want to sound."
  },
  "stationery": {
    "langsLabel": "Letters",
    "capHint": "up to 5 at a time",
    "anchoredIn": "Anchored in",
    "iWrite": "I write",
    "to": "to",
    "tones": {
      "any":     "in any tone",
      "close":   "tenderly",
      "casual":  "casually",
      "neutral": "evenly",
      "polite":  "politely"
    }
  },
  "actions": {
    "copy":   "copy",
    "copied": "✓ copied",
    "listen": "listen",
    "star":   "starred"
  },
  "filters": {
    "starredOnly": "Starred only"
  },
  "footer": {
    "line1": "Sent with care across rivers and oceans.",
    "sig":   "made for friends, by a friend"
  }
}
```

### 5.9 内容作者工作流

**加一条新短语**

实际流程基本都是"让 AI 给一份 JSON 贴进去"：

1. 给 AI 一个 prompt：短语概念、所属场景、需要翻译的语言列表、参考其他条目结构
2. AI 输出一个完整的短语对象
3. 在 `phrases.json` 末尾 append（或用 `pnpm run new-phrase` 脚本）
4. `pnpm dev` 自动热更，Zod 报错能立刻看到

建议的 AI prompt 模板放在 `README.md` 里，包含：schema 片段 + 几个高质量示例条目 + 语言列表 + 风格要求（朋友间温度、不要直译感、variant 只填有真实区分的维度）。

**加一种新语言**

1. 在 `languages.json` 里追加一条（code/native/tts 等）
2. 给 AI 一个大 prompt：`phrases.json` 当前全部内容 + "请给每条短语补上这种语言的 `trans[<new-code>]`"
3. AI 一次返回整份翻译，你 review 后整体合入

**加一个新场景**

1. `scenes.json` append 一项
2. 新短语的 `scene` 字段指向它
3. 若要重排，调整数组顺序即可

**辅助脚本（`scripts/`）**

- `new-phrase.mjs` — 交互式询问 id/scene，生成骨架对象并追加到 `phrases.json`，再打开编辑器等你填内容
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

### 6.1 语言选择（LangChips）

- 展示全部语言的本地名作为 chip
- 锚点语言用赤陶色 `.anchored` 状态，不可通过 chip 取消（只能通过 Stationery 切换）
- 非锚点的选中语言用深色 `.pressed` 状态
- 未选中 chip 无底色
- 默认勾选来自 `languages.json` 的 `defaultOn` 字段
- **上限 5 种**（含锚点）。点击第 6 个 chip 时：chip 摇头动画（`@keyframes shake`）+ chip 行末尾出现小斜体提示 "up to 5 at a time"（1.8s 后淡出）。不加入选中，不 toast，不 modal
- 至少保留一个语言选中（最后一个取消无效）
- 状态：`$selectedLangs: Set<string>` 持久化
- 键盘：Tab 切换 chip，Enter/Space 切换选中

### 6.2 Stationery · 手写体预设句（Stationery + SlotPicker）

顶部两行斜体衬线句子，像信件开头题词：

> *Anchored in* **Chinese**.
> *I write* — **in any tone** — *to* **a friend**.

加粗的两个词（anchor / tone）是 `<SlotPicker>` 实例：

- **视觉**：斜体 Fraunces，赤陶色文字，下方虚线（dashed underline）+ 小 `▾`
- **交互**：点击展开一个 popover 菜单（斜体选项列表，当前值带赤陶色小圆点）
- **关闭**：点击外部 / Esc / 选中某项
- **状态变化反馈**：选中后 slot 文字更新 + 一个 `.pulse` 短动画（350ms）+ 主视图重渲染
- **键盘可用**：Tab 聚焦，Enter/Space 展开，方向键移动选项，Enter 选定

**两个 slot 的值域**

| Slot | 值 |
|---|---|
| `anchor` | 所有语言 `languages.json` |
| `tone` | `any` / `close` / `casual` / `neutral` / `polite`（文案 "in any tone" / "tenderly" / "casually" / "evenly" / "politely"） |

**默认状态**：`anchor=zh` / `tone=any`。所有文案从 `ui/en.json` 读。

> v1.5 起 `addressee` slot（friend / woman / man / everyone）从 Stationery 撤掉。原因：当前数据下 addresseeGender 命中率 0、addresseeCount 仅 7/77，控件存在但拨动无变化，反而违反"美学优先"+"内容是主角"。schema 字段保留，相关 tag（"to a woman" / "to everyone"）改在 VariantRow tag line 被动展示。详见 §5.7。

**实现注意 ⚠️**：popover 内的选项 button 关闭态必须 `tabindex="-1"`，展开时才改为 `tabindex="0"`。否则即使视觉上 opacity:0，Tab 键焦点也会进入隐藏选项，浏览器自动滚动把它带进视口，造成"按 Tab 莫名弹窗"的 bug（demo 早期踩过）。`closeAllSlots()` 函数里要把所有 popover 子按钮 tabindex 重置为 -1。

**关键设计意图**：这句话替代了 v2 版本的 chips 墙、legend 说明条、单元格里的 pill 标签三件东西。界面从"有很多控件的后台"降维到"一封写了一半的信"。

### 6.3 视图切换（ViewToggle）

- 两种视图：`table` / `cards`
- 用户主动切换会覆盖默认，存 `$view: 'table' | 'cards' | 'auto'` 持久化
- `auto` 根据视口宽度（≥ 960px → table）自动切
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
No. I. Greetings · II. Catching Up · III. Gratitude · IV. Affection · V. Warm Wishes · VI. Farewells
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
  - stagger：6 行依次显现，每行延迟 +40ms（0.04s、0.08s、0.12s、0.16s、0.20s、0.24s）
- Active（当前场景）：
  - `.num` 颜色 → `--accent`，opacity 1.0
  - `.ttl` 颜色 → `--ink`，`font-weight: 500`（比默认 350 明显加粗）
  - `.toc-item.active::before` 绝对定位小横线：`right: -10px, width: 0 → 8px`，赤陶色，展开时才出现（.1s delay）
  - 三处视觉线索同时标出当前位置：颜色、字重、短线

**扩展/收起触发**：

- **Hover on TOC**：展开并保持，鼠标离开 400ms 后收起
- **Focus 进入任一 `.toc-item`**：展开；`focusout` 后 400ms 收起（用 `relatedTarget` 判断是否仍在 TOC 内）
- **滚动时**：自动短暂展开（"有用户在滚动，给他看看在哪一章"），停止滚动 1.4s 后若无 hover/focus 则收起
- **Idle timer 共用**：同一个 `tocIdleTimer`，被任何触发重置

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
- 检测浏览器是否有对应语言的 voice；无则禁用按钮 + `title` tooltip 说明
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
- 背景：`rgba(235, 225, 204, 0.86)` + `backdrop-filter: blur(14px) saturate(1.2)`（毛玻璃在**这里**是对的——浮动工具栏跟内容是"不同层级"，玻璃感合理；TocSide 不是工具栏，那里才不用 blur）
- 上边缘下方一层极淡的暖色渐变作"透出阴影"

**内部元素**

- 左：`<button class="sb-mark">致 · 远 · 方</button>`——点击 smooth scroll 回顶
- 细竖线分隔
- 中：`<StickyBarProse>` 包含一句缩略版 stationery —— "I write — [tone]"。**不含 anchor slot**（锚点语言切换频率极低，留在 stationery）。**不含 addressee slot**（v1.5 起整体撤掉，详见 §5.7 / §6.2）。tone 是 `<SlotPicker>` 实例，跟主 stationery 共享同一个 store，任一处修改两处同步。

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
- Service Worker（`@vite-pwa/astro`）：precache shell + 字体 + 三个数据 JSON
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

**亮色（当前 demo 已定）**
```css
--bg:         #EBE1CC;
--paper:      #F5EDD9;
--paper-up:   #FAF4E3;
--ink:        #1F1A14;
--ink-soft:   #524838;
--ink-mute:   #8F8370;
--accent:     #B0522E;
--accent-soft:#D89876;
--gold:       #A6824A;
--line:       #D4C6A8;
--line-soft:  #E2D6B8;

/* —— 语义 surface tokens（基于上面原色组合出来的叠加层）—— */
--surface-stickybar:    rgba(235, 225, 204, .86);   /* 顶部细 bar，需要 backdrop-blur */
--surface-toc-panel:    rgba(245, 237, 217, .22);   /* TocSide 展开态羊皮纸层，不 blur */
--surface-toc-border:   rgba(212, 198, 168, .22);   /* TocSide 展开态外框 */
--shadow-toc-panel:     0 12px 32px -24px rgba(138, 98, 67, .08);  /* TocSide 纸张透光 */
--shadow-stickybar:     0 1px 0 rgba(212, 198, 168, .5);          /* 细 bar 下缘 */
```

**暗色（需设计 + 测对比度）**
```css
--bg:         #1B1813;
--paper:      #242018;
--paper-up:   #2D2820;
--ink:        #EDE1C8;
--ink-soft:   #BDB29A;
--ink-mute:   #877E6B;
--accent:     #D47649;   /* 赤陶提亮 */
--accent-soft:#A55E3A;
--gold:       #C9A668;
--line:       #3A3226;
--line-soft:  #2E2820;
```

两套都需过 WCAG AA（正文 4.5:1，大字 3:1）。`npx @adobe/leonardo-contrast-colors` 或浏览器扩展验证。

### 7.3 间距与动效

- 基础间距 4/8/12/16/20/24/32/48/72（px）
- 圆角 3px（卡片/表格）、999px（chip）、50% 不用

**动效时长 tokens**：

```css
--dur-hover:   120ms;  /* hover 色变 */
--dur-switch:  240ms;  /* chip 切换、toggle */
--dur-feedback:350ms;  /* pulse / shake 反馈 */
--dur-reveal:  420ms;  /* stationery 滑入、sticky bar 淡入 */
--dur-entrance:800ms;  /* 卡片首屏入场 */
--toc-idle-ms: 1400;   /* TOC 滚动活动超时（JS 常量） */
--toc-hover-release-ms: 400;  /* hover 离开后 TOC 收起延迟（JS 常量） */
```

**Easing tokens**：

```css
--ease-out:    cubic-bezier(.2, .9, .2, 1);       /* 主通用：弹出但不弹回 */
--ease-spring: cubic-bezier(.34, 1.56, .64, 1);   /* spring（TOC 容器 padding、transform）带轻微 overshoot */
--ease-linear: linear;                             /* 仅用于 backdrop-filter / opacity 这种机械感属性 */
```

**关键动画命名 tokens**：

- `@keyframes rise` — 卡片首屏入场（opacity 0→1 + translateY 8px→0，stagger 30ms）
- `@keyframes pulse` — slot 被切换后的短暂高亮（背景赤陶色 0→22%→0，350ms）
- `@keyframes shake` — chip 超上限时的摇头反馈（translateX 振荡，450ms）
- **TOC 场景名 stagger**：6 行依次出现，每行延迟 +40ms（0.04s 起到 0.24s）

所有动画必须尊重 `prefers-reduced-motion: reduce`——统一做法是在 `global.css` 里用 `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`。

### 7.4 组件清单

| 组件 | 类型 | 已有 demo 实现 | 备注 |
|---|---|---|---|
| Layout | Astro | ✓ | 根布局 + head inline script（theme FOUC 防御） |
| Masthead | Astro | ✓ | 致·远·方 mark + 标题 + tagline + ViewToggle（右上角定位） |
| ViewToggle | Svelte | ✓ | Masthead 右上角药丸形两档切换，驱动 `body[data-view]` |
| Stationery | Svelte | ✓ | 手写体预设句容器（Anchored in / I write — to） |
| SlotPicker | Svelte | ✓ | 斜体可点击词 + 下拉 popover，anchor/tone/addr 三处复用 |
| LangChips | Svelte | ✓ | 本地名 chip toggle + 锚点高亮 + 5 种上限 shake 反馈 |
| TocTop | Svelte | ✓ | 首屏横向目录页，fade-out on scroll |
| TocSide | Svelte | ✓ | 右侧 sidebar，`$scrolled + $view==='cards'` 时出现，hover/scroll-activity 展开 |
| StickyBar | Svelte | ✓ | 顶部浮动工具栏（mark + tone），滚动后淡入 |
| PhraseTable | Svelte | ✓ | 桌面表格布局，按场景分 block |
| PhraseCards | Svelte | ✓ | 卡片布局，`.card-list` max-width 720px 居中 |
| TranslationCell | Svelte | ✓ | 单元格容器，根据筛选结果渲染 0-N 个 VariantRow |
| VariantRow | Svelte | ✓ | 单个变体行：text + rom + tag line + note + copy + speak |
| SpeakButton | Svelte | ✗ | 新增，Web Speech API + voice 检测 |
| StarButton | Svelte | ✗ | 新增，锚点列右上角 |
| ThemeToggle | Svelte | ✗ | 新增，light/dark/system |
| Toast | Svelte | ✓ | 全局，复制成功提示 |
| Legend | Astro | ✓ | 场景小标题（Roman 编号 + 斜体场名 + 金色圆点细线） |
| Footer | Astro | ✓ | 静态 |

---

## 8. 可访问性清单

- [ ] 所有交互有可见 `:focus-visible` 状态（accent 色 outline）
- [ ] icon-only 按钮必有 `aria-label`
- [ ] Toast 用 `role="status"` + `aria-live="polite"`
- [ ] 语言切换元素用 `aria-pressed`
- [ ] 译文元素加 `lang="xx"`，辅助屏幕阅读器选对发音
- [ ] 颜色对比度 AA 级（正文 4.5:1，大号 3:1）
- [ ] 不用颜色作为唯一信息载体（例：复制成功也有 ✓ 符号和文字）
- [ ] 键盘能完整操作：Tab 切换、Enter/Space 触发、Esc 关 toast
- [ ] 尊重 `prefers-reduced-motion`
- [ ] 文档语言 `<html lang="en">`（UI 主语言是英文）
- [ ] 标题层级合理：`h1` 只一个（masthead）

---

## 9. 性能目标

- **Lighthouse**: Performance / Accessibility / Best Practices / SEO 全部 ≥ 95
- **LCP**: < 1.5s（3G fast 节流下）
- **TBT**: < 100ms
- **CLS**: 0
- **首屏 JS bundle**: < 30KB gzipped
- **首屏总下载**: < 150KB（含字体子集）

**达成策略**
- Fraunces 字体只加载 Latin + Cyrillic 子集，CJK 用 Noto Serif JP/KR 的 unicode-range 按需加载
- `font-display: swap`
- 短语数据与主 HTML 一起 SSG 输出，不走 client-side fetch
- Service Worker 预缓存 critical assets
- 没有第三方脚本、没有 analytics（除非后期确需要一个隐私友好的如 Plausible）

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

### 10.2 Actions workflow（`.github/workflows/deploy.yml` 骨架）

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

仓库 Settings → Pages → Source 选 **GitHub Actions**。

### 10.3 自定义域名（可选）

`public/CNAME` 文件写入域名，DNS 配 CNAME 到 `<user>.github.io`。配了自定义域后 `base` 要去掉。

---

## 11. 里程碑与任务清单

### M0 · 项目骨架（0.5–1 天）

**依赖与配置**
- [x] `pnpm create astro@latest` → 空模板 + TypeScript strict
- [x] 加 Svelte: `pnpm astro add svelte`
- [x] 加 PWA: `pnpm add -D @vite-pwa/astro`
- [x] 加 nanostores: `pnpm add nanostores @nanostores/persistent`（实际无 `@nanostores/svelte` —— 已废弃，atom 自身符合 Svelte store 契约）
- [x] 加字体包: `pnpm add @fontsource-variable/fraunces @fontsource/instrument-sans @fontsource/noto-serif-jp @fontsource/noto-serif-kr @fontsource/noto-serif-sc`
- [x] 加 Zod: `pnpm add zod`
- [x] 配 `astro.config.mjs`（site / base / PWA / integrations）

**骨架代码**
- [x] 建目录结构（见 §4）
- [x] `src/lib/schema.ts` — Zod schema（§5.6）
- [x] `src/lib/filter.ts` — `visibleVariants()`（§5.7）
- [x] `src/lib/stores.ts` — nanostores: `selectedLangs`, `anchor`, `tone`, `view`, `theme`, `starred`, `uiLocale`（导出名去掉 `$` 前缀适配 Svelte 5 runes）
- [x] `src/lib/scroll.ts` — 全局滚动状态（`scrolled`, `activeScene`, `tocExpanded`），RAF 合流 window scroll listener + body.classList 镜像
- [x] `src/lib/clipboard.ts` — 带 textarea fallback
- [x] `src/lib/storage.ts` — localStorage 版本化封装

**验收**
- [x] `src/data/` 三个 JSON 各放一条占位数据，Zod 构建时校验通过
- [x] 空页面渲染出 "Hello"
- [x] GitHub Actions workflow 落地，空页面能部署到 GH Pages
- [x] **完成后停下来让我检查**，再进 M1

### M1 · 对齐 v3 demo 的视觉与功能（4–5 天）

**数据**
- [x] 从 v3 demo 迁移 11 条短语到 `src/data/phrases.json`（保留每语言 gloss + variants + tone / speakerGender / addresseeCount 标签）—— 后续 v0.1.1 删 `farewell-everyone`，剩 10 条
- [x] `src/data/languages.json` 初版（7 种：zh / en / ja / ko / es / pt / fr + `defaultOn` + `defaultAnchor: true` 只在 zh 上）
- [x] `src/data/scenes.json` 初版（6 个场景：greetings / catching-up / gratitude / affection / well-wishes / farewells）
- [x] `src/content/ui/en.json` 初版（§5.8 结构）
- [x] 辅助脚本 `scripts/new-phrase.mjs`（交互式追加新条目）
- [x] 辅助脚本 `scripts/coverage.mjs`（打印语言覆盖率矩阵 + gender/count 维度成熟度指标）

**样式**
- [x] `src/styles/tokens.css` — 所有颜色 + surface + 时长 + easing tokens（§7.2 / §7.3，含暗色 token）
- [x] `src/styles/global.css` — reset + base + `prefers-reduced-motion` 兜底
- [x] `src/styles/typography.css` — Fraunces / Instrument Sans / CJK fallback + `font-display: swap`
- [x] 纸纹 SVG noise filter + 暖色 vignette（body::before / ::after，从 v3 demo 复刻数值）
- [x] 关键动画：`@keyframes rise`, `pulse`, `shake`

**静态组件（Astro）**
- [x] `Layout.astro` — 根模板 + head inline script（theme FOUC 防御 + 视图模式 FOUC 防御）
- [x] `Masthead.astro` — 标题 + tagline（ViewToggle 槽位 v0.1.1 起改由 StickyBar 承载）
- [x] `Footer.astro` — 静态页脚（v0.1.1 增加 GitHub source 链接）
- [x] `Legend.astro` — 场景小标题（Roman 编号 + 斜体场名 + 金色圆点细线）

**交互组件（Svelte）**
- [x] `LangChips.svelte` — 锚点高亮 + 5 种上限 shake 反馈 + 锚点不可 toggle off
- [x] `Stationery.svelte` — 两行手写体容器
- [x] `SlotPicker.svelte` — popover 内部按钮 tabindex 规则就位，点击外部/Esc 关闭，pulse 反馈
- [x] `TocTop.svelte` — 文档流内横向目录页，`scrolled` 订阅 → fade-out
- [x] `TocSide.svelte` — 右侧 fixed，collapse/expand 按§6.4.2 全套；订阅 `activeScene`（v0.1.1 起 cards@≥640 + table@≥1024 双视图都显示，原仅 cards 限制取消）
- [x] `StickyBar.svelte` — 顶部 fixed 浮条；mark + tone（v0.1.1 起 ViewToggle 内嵌右锚）
- [x] `ViewToggle.svelte` — 药丸形两档切换；驱动 `body[data-view]` 切换（<640px 锁定 cards 并隐藏 toggle）
- [x] `PhraseTable.svelte` — 表格视图；按场景分 block，`view-desktop` 在 ≥1024px 加 padding-right clamp 给 TocSide 让位
- [x] `PhraseCards.svelte` — 卡片视图；`.card-list` max-width 720px 居中（始终生效，无 1100 突变）
- [x] `TranslationCell.svelte` — 根据 `visibleVariants()` 结果渲染 0-N 个 VariantRow
- [x] `VariantRow.svelte` — text + rom + tag line + note + copy hint 用空 span + ::before；tag line 被动展示 gender/count 描述
- [x] `Toast.svelte` — 全局复制反馈

**集成**
- [x] `pages/index.astro` 组装所有组件
- [x] ViewToggle 默认根据视口宽度（`matchMedia('(min-width: 640px)')`）选 table / cards —— v0.1.1 阈值从 960 降至 640
- [x] 本地 `pnpm dev` 视觉上与 v3 demo 一致
- [x] **验收清单**（对照 v3 demo 逐一确认）：
  - [x] 首屏状态：TocTop 可见、TocSide 不可见、StickyBar 不可见
  - [x] 滚动过 420px：TocTop 淡出、TocSide 淡入（cards@≥640 / table@≥1024）、StickyBar 淡入（含 ViewToggle）
  - [x] Stationery 两个 slot（anchor / tone）都能展开选项并同步到数据
  - [x] 复制任一 variant 行：行内 `✓ copied` + 全局 Toast
  - [x] LangChips 选第 6 个：chip shake + 末尾小提示 "up to 5 at a time"
  - [x] Tab 键穿行：不出现"按 Tab 莫名弹窗"
  - [x] TocSide hover / 滚动活动都能触发展开；鼠标离开 400ms 后收起；滚动停止 1.4s 后收起
  - [x] 切换视图：卡片宽度始终 720px max；TocSide 在 table 视图也显示（v0.1.1 行为变更）
- [x] **完成后停下来让我检查**，再进 M2

### M2 · 深色模式 + 收藏（1–2 天）

_M2 不再包含 ViewToggle——已在 M1 完成，因为它跟卡片宽度约束强绑定。_

- [x] 暗色 tokens（已在 M1 写入 tokens.css 完整两套调色）
- [ ] 暗色对比度验证（Leonardo 或浏览器扩展，保证 AA）
- [ ] `ThemeToggle.svelte` — light / dark / system 三态
- [x] 防 FOUC 已在 M0/M1 `Layout.astro` 的 head inline script 里就位
- [ ] `StarButton.svelte` + `starred: Set<string>` 持久化
- [ ] "Starred only" 开关 chip（Stationery 下方，有收藏时才出现）
- [x] localStorage 版本化已在 M0 `storage.ts` 封装

### M3 · 语音 + PWA（1 天）
- [ ] `SpeakButton.svelte` + `src/lib/tts.ts` 封装
- [ ] Voice 检测：页面加载后拿 `speechSynthesis.getVoices()`，按 tts code 匹配，找不到就禁用该语言的 speak 按钮
- [ ] `manifest.webmanifest` + 图标（192 / 512 / maskable 512）
- [ ] Service Worker precache 策略：shell + 字体子集 + `src/data/*.json`
- [ ] 离线测试（DevTools → Offline，确认完整功能可用）

### M4 · 打磨（1–1.5 天）
- [ ] Accessibility audit：axe DevTools 全绿 + 完整键盘穿行测试
- [ ] Lighthouse ≥ 95 四项达标（Performance / Accessibility / Best Practices / SEO）
- [x] 所有交互的 `prefers-reduced-motion` 处理（在 `global.css` 全局兜底）
- [x] OG image 设计（1200×630）+ meta tags（v0.1.0 已就位 Open Graph + Twitter Card）
- [x] `README.md`：项目说明 + 使用说明 + 数据扩展指南 + 翻译协作哲学
- [ ] `404.astro` 简短优雅的 not-found
- [ ] 手动测试矩阵：iOS Safari / Android Chrome / macOS Safari / Firefox / Edge

### M5 · 内容扩充（持续）
按需追加短语、语言、场景。工作流见 §5.9。
每次 push main → 自动部署。每次加新语言后跑一遍 `pnpm run coverage` 确认矩阵。

**已落地**
- [x] v0.1.1：新增 6 种语言（de / ru / pl / hi / bn / mizo），共 13 种
- [x] v0.1.1：中文短语优化为更自然的口语（最近怎么样 / 不好意思 / 我想你 / 我很关心你 / 回头见 / 先这样）
- [x] v0.1.1：删除 `farewell-everyone` 短语（仅有的 `addresseeCount: many` 用例，已无 UI 需要它撑场）

---

## 12. 未来可能（不承诺，供参考）

按优先级粗排，择机引入：

1. **UI 中文化** — 结构已就绪（`ui/zh.json` + `$uiLocale` store + SlotPicker 切换器），只需补译文
2. **Speaker gender 控件** — Stationery 加第三句 "signed by [me · ♂ · ♀]"，影响葡语等性别分化语言的变体选择。等内容里 speakerGender 变体足够多再加
3. **搜索框** — 输入任一语言或拼音定位到短语行（fuse.js 模糊搜索）
4. **多标签（tags）** — 短语可挂多个标签（`#morning` `#emotion-joy`），与 scene 正交
5. **分享链接** — `?anchor=ja&langs=zh,en&tone=casual&addr=friend&phrase=greeting-hello` 一键复刻朋友看到的视图
6. **导出为图片** — 一条短语做成可发到微博/IG 的卡片（html2canvas）
8. **反向查找** — 朋友发来一句外语查意思（需要把数据索引反转，工程量大）
9. **变体级收藏** — 目前收藏到 phrase 级，未来可深入到 variant
10. **内容贡献渠道** — 如果开放，用 GitHub Issues 表单模板 + PR 流程（不做 CMS）

---

## 13. 给 Claude Code 的启动 Prompt 模板

把本 `DESIGN.md` 和三个 demo 文件（`distant-friends-v3.html` 主要参考，v1/v2 作对照）放进项目根目录的 `reference/` 文件夹，然后给 Claude Code：

> 你要搭建 `distant-friends` 项目。先完整读 `DESIGN.md`，再打开 `reference/distant-friends-v3.html` 看视觉气质——这是 M1 结束时应该达到的视觉参考。v1 / v2 是过程参考，风格已被推翻，只作反面教材。
>
> 然后按 §11 M0 里程碑的任务清单一个个完成，完成一个打一个勾。
>
> 几条硬约束：
> - 技术栈严格按 §3.1 来：Astro + Svelte 5 + TS + nanostores + Zod + Vanilla CSS。不要自作主张加 Tailwind、UI 库、CSS-in-JS、图标库。
> - 数据结构按 §5 来：`src/data/` 下三个扁平 JSON 文件，不要用 Astro Content Collections。
> - 组件放对位置：纯静态放 `src/components/astro/`，有状态交互放 `src/components/svelte/`。
> - 所有跨组件状态用 nanostores + `@nanostores/persistent`，不要用 Svelte store。
> - 所有颜色、字体、间距、动画时长用 `src/styles/tokens.css` 的 CSS 变量，不硬编码。
> - UI 锁定英文一份，`src/content/ui/en.json`。v1 不做 locale 切换器，但组件内所有 UI 文案都要从 json 读，不写 hardcoded string。
> - 变体筛选逻辑在 `src/lib/filter.ts`，严格按 §5.7 的 `visibleVariants()` 实现。
> - **完成 M0 后停下来让我检查，再进 M1**。M1 完成后再停一次。
>
> 有任何对 DESIGN.md 的疑问请先问，不要自己猜测。比如场景数量、变体字段、或者 AI 协作工作流的具体 prompt 格式。
>
> 现在从 M0 开始。

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
未来重大技术决策（换框架、改数据结构、引入新依赖）建议开 `docs/decisions/` 下的 ADR 文件记录。当前项目规模暂不需要。

### E. 本文档的演化

- **v1.0**（2026-04-21）— 初版：5 场景、单变体结构、per-phrase 文件夹、中文 source + 英文 gloss
- **v1.1**（2026-04-22）— 加入变体系统（register / gender / count 维度）、UI i18n 结构、per-phrase 文件夹 + per-language trans 文件
- **v1.2**（2026-04-22）— 大幅简化：所有语言平等、tone 四档固定、手写体 Stationery 替代所有 chips/pills、扁平三文件数据结构、UI 锁英文、每语言有自己的 gloss、语言数量上限 5 种
- **v1.3**（2026-04-23）— 交互与视觉收尾：TOC 拆为 TocTop（首屏）+ TocSide（滚动后 sidebar，collapse/expand hover 展开）双形态；StickyBar 简化为 mark + tone + addressee；ViewToggle 提前到 M1（与卡片宽度约束 720px 强绑定）；`scroll.ts` 作为全局滚动状态中心；新增语义化 surface tokens；踩坑案例文档化（copy hint / SlotPicker tabindex）；shell 宽度 1180 → 1240px
- **v1.5**（2026-04-26）— addressee slot（friend / woman / man / everyone）从 Stationery 和 StickyBar 整体撤掉：当前数据下 addresseeGender 命中率 0、addresseeCount 仅 9% 且只对单条短语有效，控件存在却拨动无效违反"内容是主角"原则。schema 字段（`speakerGender` / `addresseeGender` / `addresseeCount`）保留，VariantRow tag line 被动展示（"he writes" / "to a woman" / "to everyone"）。`scripts/coverage.mjs` 升级输出三个轴的命中数 + 距阈值（10）的差距，作为未来何时恢复 UI 控件的触发指标。`visibleVariants()` 简化为只接受 tone。

---

*文档版本 v1.5 · 最后更新 2026-04-26*
