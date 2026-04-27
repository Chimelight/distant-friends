# 致 · 远 · 方 · Distant Friends

> A warm multilingual glossary of friendly phrases — for keeping in touch with friends across languages.

[Live (Pages)](https://chimelight.github.io/distant-friends/) · [Preview (Vercel)](https://distant-friends.vercel.app)

![](public/og-image.png)

## What it is

A small, hand-curated phrase glossary covering everyday friendly turns — greetings, catching up, gratitude, affection, warm wishes, farewells — across seven languages at v1, extensible. Click any cell to copy. Switch the anchor language at any time. Tune the tone (`in any tone` / `tenderly` / `casually` / `evenly` / `politely`) and gender / count distinctions surface as quiet tag-line labels next to each variant.

What it isn't:

- Not a travel phrasebook ("how do I get to the airport")
- Not a language learning tool (no quizzes, no SRS)
- Not a translator (no translation API)

## Stack

Astro 6 + Svelte 5 + TypeScript (strict) + nanostores (with `@nanostores/persistent`) + Zod + vanilla CSS. PWA via `@vite-pwa/astro`. Self-hosted Fraunces + Instrument Sans + Noto Serif CJK. No Tailwind, no UI library, no CSS-in-JS.

Design source of truth: [DESIGN.md](DESIGN.md).

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:4321/distant-friends/
pnpm build        # static output → dist/
pnpm check        # type + svelte check
pnpm coverage     # phrase × language coverage matrix
pnpm new-phrase   # interactive scaffolder for a new phrase
```

Requires Node 20+ and pnpm 9 (pinned via `packageManager`; corepack picks it up automatically).

## Project structure

```
src/
├── components/
│   ├── astro/        # static — Layout, Masthead, Footer, Legend
│   └── svelte/       # interactive islands — Stationery, Phrase*, Toc*, …
├── content/ui/       # UI strings (English only for now)
├── data/
│   ├── languages.json
│   ├── scenes.json
│   └── phrases.json  # 10 phrases at v1, ~30 by v2
├── lib/              # schema (Zod), filter, stores, scroll, clipboard, storage
├── pages/index.astro
└── styles/           # tokens.css (light + dark), global.css, typography.css
```

## Adding content

All content lives in three flat JSON files. Schema is enforced at build time by Zod (`src/lib/schema.ts`); a malformed entry fails `pnpm build`.

### Add a phrase

Open `src/data/phrases.json` and append:

```jsonc
{
  "id": "kebab-case-id",
  "scene": "greetings | catching-up | gratitude | affection | well-wishes | farewells",
  "order": 1,
  "trans": {
    "zh": {
      "gloss": "汉语对这个概念的小标签",
      "variants": [
        { "text": "你好", "rom": "nǐ hǎo" }
      ]
    }
    // …one block per language
  }
}
```

Or run `pnpm new-phrase` for an interactive scaffolder that fills the structure.

Variant fields:

| field | required | notes |
| --- | --- | --- |
| `text` | ✓ | the translation |
| `rom` |   | romanization, only for non-Latin scripts |
| `tone` |   | `close` / `casual` / `neutral` / `polite` — fill **only when the language draws a real distinction** at that level |
| `speakerGender` |   | `m` / `f` (e.g. Portuguese `Obrigado` / `Obrigada`) |
| `addresseeGender` |   | `m` / `f` (e.g. Spanish `amigo` / `amiga`) |
| `addresseeCount` |   | `one` / `many` (e.g. "Bye everyone" → `many`) |
| `region` |   | `BR` / `PT` / `MX` etc, only when meaningful |
| `note` |   | freeform English commentary |
| `reviewed` |   | `false` for new drafts pending native-speaker review |

### Add a language

1. Append a row to `src/data/languages.json` (`code`, `native`, `tts`, `rtl`, `defaultOn`, `defaultAnchor`).
2. Translate every phrase's `trans` block to add the new code.
3. Run `pnpm coverage` to verify fill rate. New variants ship with `reviewed: false` until a native speaker promotes them.

### Add a scene

Append to `src/data/scenes.json` and use the new `id` in any phrase's `scene` field. Reorder the array to reorder the page.

## Translation philosophy

Three rules behind every variant:

1. **Warmth before grammar.** A phrase that sounds like a friend wins over the textbook-correct one.
2. **Fill only real distinctions.** Don't tag every variant with `tone: neutral` — leave `tone` unset if the language doesn't actually distinguish at that level.
3. **Native review pending until proven.** New drafts ship `reviewed: false`. A native speaker promotes by removing the flag.

Translation drafts are produced in pair-programming with Claude (Opus / Sonnet). Drafts always pass through human review before merging — unreviewed shortcuts have shipped wrong gender forms, wrong politeness levels, and direct-translated English idioms in the past. The flow is intentionally not autonomous.

## Deploy

Two environments, both protected branches (PR-only):

| branch | host | trigger | URL |
| --- | --- | --- | --- |
| `release` | GitHub Pages | PR merge from `main` | https://chimelight.github.io/distant-friends/ |
| `main` | Vercel | PR merge from `dev` | https://distant-friends.vercel.app |

Working branch is `dev`. To ship:

```
dev → PR → main          (Vercel rebuilds preview)
main → PR → release      (Pages rebuilds + GitHub Release + Discord notify)
```

The release flow is wrapped in a `/release` slash command (Claude Code) that drafts notes, creates a tagged GitHub Release, and posts a Discord embed.

## Roadmap

See [DESIGN.md §11](DESIGN.md#11-里程碑与任务清单). Current state: M1 (visual + interactive parity with v3 demo) complete. Next: M2 (dark-mode toggle + starring), M3 (TTS + PWA precache), M4 (a11y + Lighthouse polish).
