#!/usr/bin/env node
/**
 * Generate an HTML review table for translations.
 *
 *   pnpm review                                 # interactive
 *   pnpm review --langs de,ru --anchor zh
 *   pnpm review --all                           # every language
 *
 * Output: tmp/review.html (override with --out <path>). Open in any browser.
 *
 * The optional anchor language is pinned as the first column for
 * side-by-side reference.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output, argv } from 'node:process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dataDir = resolve(root, 'src', 'data');

const { loadPhrases } = await import('./_load-phrases.mjs');
const phrases = await loadPhrases(dataDir);
const languages = JSON.parse(await readFile(resolve(dataDir, 'languages.json'), 'utf8'));
const scenes = JSON.parse(await readFile(resolve(dataDir, 'scenes.json'), 'utf8'));

const validCodes = new Set(languages.map((l) => l.code));
const langByCode = new Map(languages.map((l) => [l.code, l]));
const sceneById = new Map(scenes.map((s) => [s.id, s]));

// —— CLI arg parsing ——
function getFlag(name) {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const next = argv[i + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

const argLangs = getFlag('langs');
const argAll = getFlag('all') === true;
const argAnchor = typeof getFlag('anchor') === 'string' ? getFlag('anchor') : null;
const argOut = typeof getFlag('out') === 'string' ? getFlag('out') : 'tmp/review.html';

let targetCodes;
let anchorCode = '';
let outPath = argOut;

const hasAnyArg = argLangs || argAll || argAnchor;

if (hasAnyArg) {
  // Non-interactive
  if (argAll) {
    targetCodes = languages.map((l) => l.code);
  } else if (typeof argLangs === 'string') {
    targetCodes = argLangs.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    targetCodes = languages.map((l) => l.code);
  }
  anchorCode = argAnchor ?? '';
} else {
  // Interactive
  const rl = readline.createInterface({ input, output });
  const ask = async (q, def = '') => {
    const suffix = def ? ` (默认 ${def})` : '';
    const a = (await rl.question(`${q}${suffix}: `)).trim();
    return a || def;
  };
  const langInput = await ask('导出哪些语言？逗号分隔代号，或 all', 'all');
  if (langInput === 'all') {
    targetCodes = languages.map((l) => l.code);
  } else {
    targetCodes = langInput.split(',').map((s) => s.trim()).filter(Boolean);
    anchorCode = await ask('锚点语言（用于对照，留空跳过）', 'zh');
  }
  rl.close();
}

// Build descriptive default filename if --out wasn't passed.
// Pattern: review-<langs>-<anchor?>-<timestamp>.html
function buildAutoOutPath() {
  const langSeg =
    targetCodes.length === languages.length || (targetCodes.length === languages.length - 1 && anchorCode)
      ? 'all'
      : (anchorCode ? [anchorCode, ...targetCodes] : targetCodes).join('-');
  const anchorSeg = anchorCode ? `anchor-${anchorCode}` : '';
  const date = new Date().toISOString().slice(0, 10); // 2026-04-28
  return `tmp/${['review', langSeg, anchorSeg, date].filter(Boolean).join('-')}.html`;
}

if (outPath === 'tmp/review.html' && !getFlag('out')) {
  outPath = buildAutoOutPath();
}

// Document <title> doubles as the default Save-as-PDF filename in most
// browsers — mirror the descriptive parts so the printed file is also
// identifiable on disk.
function buildDocTitle() {
  const langSeg =
    targetCodes.length === languages.length || (targetCodes.length === languages.length - 1 && anchorCode)
      ? 'all'
      : (anchorCode ? [anchorCode, ...targetCodes] : targetCodes).join(', ');
  const date = new Date().toISOString().slice(0, 10);
  const parts = ['Distant Friends · Review', langSeg];
  if (anchorCode) parts.push(`anchor ${anchorCode}`);
  parts.push(date);
  return parts.join(' · ');
}
const docTitle = buildDocTitle();

// Validate codes
const invalid = targetCodes.filter((c) => !validCodes.has(c));
if (invalid.length) {
  console.error(`Unknown language code(s): ${invalid.join(', ')}`);
  process.exit(1);
}
if (anchorCode && !validCodes.has(anchorCode)) {
  console.error(`Unknown anchor code: ${anchorCode}`);
  process.exit(1);
}
if (anchorCode) {
  // Don't list anchor twice
  targetCodes = targetCodes.filter((c) => c !== anchorCode);
}

const phrasesToRender = phrases;

// Group by scene, preserving scenes.json order
const sceneOrder = scenes.map((s) => s.id);
const phrasesByScene = new Map(sceneOrder.map((id) => [id, []]));
for (const p of phrasesToRender) {
  if (phrasesByScene.has(p.scene)) phrasesByScene.get(p.scene).push(p);
}
for (const list of phrasesByScene.values()) list.sort((a, b) => a.order - b.order);

// —— HTML rendering ——
const TONE_LABELS = {
  casual: 'casually',
  neutral: 'evenly',
  polite: 'politely',
};

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tagText(v) {
  const bits = [];
  if (v.tone && TONE_LABELS[v.tone]) bits.push(TONE_LABELS[v.tone]);
  if (v.speakerGender === 'm') bits.push('he writes');
  if (v.speakerGender === 'f') bits.push('she writes');
  if (v.addresseeGender === 'm') bits.push('to a man');
  if (v.addresseeGender === 'f') bits.push('to a woman');
  if (v.addresseeCount === 'many') bits.push('to everyone');
  if (v.region) bits.push(v.region);
  return bits.join(' · ');
}

function renderVariant(v) {
  const tag = tagText(v);
  return `<div class="variant">
    <div class="text" lang="${esc(v.langHint || '')}">${esc(v.text)}</div>
    ${v.rom ? `<div class="rom">${esc(v.rom)}</div>` : ''}
    ${tag ? `<div class="tag">— ${esc(tag)}</div>` : ''}
    ${v.note ? `<div class="note">${esc(v.note)}</div>` : ''}
  </div>`;
}

function renderCell(trans, isAnchor, langCode) {
  if (!trans || !trans.variants?.length) {
    return `<td class="${isAnchor ? 'cell anchor empty' : 'cell empty'}">—</td>`;
  }
  const variants = trans.variants.map((v) => ({ ...v, langHint: langCode }));
  const gloss = trans.gloss
    ? `<div class="gloss">${esc(trans.gloss)}</div>`
    : '';
  return `<td class="cell${isAnchor ? ' anchor' : ''}">
    ${variants.map(renderVariant).join('')}
    ${gloss}
  </td>`;
}

const cols = [];
if (anchorCode) cols.push(anchorCode);
cols.push(...targetCodes);

const meta = [
  `Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
  anchorCode ? `anchor: ${langByCode.get(anchorCode).native} (${anchorCode})` : '',
  `${cols.length} column${cols.length > 1 ? 's' : ''}`,
  `${phrasesToRender.length} phrases`,
]
  .filter(Boolean)
  .join('  ·  ');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(docTitle)}</title>
<style>
  :root {
    --bg: #EBE1CC; --paper: #F5EDD9; --paper-up: #FAF4E3;
    --ink: #1F1A14; --ink-soft: #524838; --ink-mute: #8F8370;
    --accent: #B0522E; --gold: #A6824A;
    --line: #D4C6A8; --line-soft: #E2D6B8;
  }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px;
    background: var(--bg); color: var(--ink);
    font-family: "Hoefler Text", "Garamond", "Noto Serif SC", "Noto Serif JP", "Noto Serif KR", "Georgia", serif;
    line-height: 1.45;
  }
  h1 { font-style: italic; font-weight: 400; margin: 0 0 6px; font-size: 26px; letter-spacing: -0.01em; }
  .meta {
    color: var(--ink-mute); font-size: 12.5px; margin-bottom: 28px;
    font-style: italic; letter-spacing: 0.01em;
  }
  .scene-header {
    font-style: italic; font-size: 19px; color: var(--ink);
    margin: 32px 0 10px; padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .scene-header .num {
    font-family: "Hoefler Text", "Garamond", serif; font-size: 13px;
    color: var(--gold); letter-spacing: 0.16em; margin-right: 12px;
  }
  .scene-header em { color: var(--accent); font-style: italic; }
  table {
    width: 100%; border-collapse: separate; border-spacing: 0;
    background: var(--paper); border: 1px solid var(--line); border-radius: 3px;
    margin-bottom: 8px;
    table-layout: fixed;
  }
  col.id-col { width: 140px; }
  col.lang-col { width: auto; }
  th {
    text-align: left; padding: 11px 14px;
    border-bottom: 1px solid var(--line);
    font-style: italic; font-weight: 400; font-size: 13.5px;
    color: var(--ink-soft); background: var(--paper-up);
    vertical-align: bottom;
  }
  th.anchor {
    color: var(--accent);
    background: rgba(166, 130, 74, 0.12);
  }
  th .code { font-family: monospace; font-size: 11px; color: var(--ink-mute); margin-left: 6px; font-style: normal; }
  td {
    padding: 14px; vertical-align: top;
    border-bottom: 1px solid var(--line-soft);
    border-right: 1px solid var(--line-soft);
    font-size: 14px;
  }
  td:last-child { border-right: none; }
  tr:last-child td { border-bottom: none; }
  td.cell.anchor { background: rgba(166, 130, 74, 0.06); }
  td.cell.empty { color: var(--ink-mute); font-style: italic; opacity: 0.4; text-align: center; }
  td.id-cell {
    color: var(--ink-mute); font-size: 11.5px; font-style: italic;
    word-break: break-all;
  }
  .variant { padding: 2px 0 2px; }
  .variant + .variant {
    border-top: 1px dashed var(--line-soft);
    margin-top: 8px; padding-top: 10px;
  }
  .text { font-size: 16px; color: var(--ink); line-height: 1.3; }
  .rom { font-style: italic; color: var(--ink-mute); font-size: 12px; margin-top: 3px; letter-spacing: 0.02em; }
  .tag { font-style: italic; color: var(--ink-mute); font-size: 11.5px; margin-top: 5px; }
  .note {
    font-size: 11.5px; color: var(--ink-mute); margin-top: 5px;
    padding-left: 7px; border-left: 1px solid var(--line);
    line-height: 1.5;
  }
  .gloss {
    font-style: italic; color: var(--ink-mute); font-size: 12px;
    margin-top: 10px; padding-top: 6px;
    border-top: 1px dotted var(--line-soft);
  }
  @media print {
    /* @page size is set dynamically below by inline JS so the whole table
     * fits on a single continuous PDF page (no A4 chopping). Fallback to
     * A4 landscape if JS is disabled. Crucially, the print layout matches
     * the screen layout 1:1 — no font/padding shrinkage — so the height
     * we measure on screen accurately predicts the print page size. */
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    body {
      padding: 0;
      background: white;
      /* Force backgrounds (anchor tint) into the PDF. */
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    th, th.anchor, td.cell.anchor {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
<script>
  // Resize @page to content dimensions so "Save as PDF" produces a single
  // long page rather than A4-paginated output. 1 CSS px ≈ 0.2645 mm at 96 DPI.
  // Runs on load so layout has settled; reruns on resize because beforeprint
  // can fire after the user has zoomed.
  function resizePageToContent() {
    var doc = document.documentElement;
    // In print mode body padding collapses to 0 (see @media print rule), but
    // scrollWidth/Height measured in screen mode include the 32px body
    // padding. Subtract it so @page sizing matches actual print content.
    var bodyStyle = window.getComputedStyle(document.body);
    var padX = (parseFloat(bodyStyle.paddingLeft) || 0) +
               (parseFloat(bodyStyle.paddingRight) || 0);
    var padY = (parseFloat(bodyStyle.paddingTop) || 0) +
               (parseFloat(bodyStyle.paddingBottom) || 0);
    var contentWidthPx = doc.scrollWidth - padX;
    var contentHeightPx = doc.scrollHeight - padY;
    // 1 CSS px ≈ 0.2645 mm at 96 DPI. +16mm = 8mm × 2 (page margins below).
    var widthMm = Math.ceil(contentWidthPx * 0.2645) + 16;
    var heightMm = Math.ceil(contentHeightPx * 0.2645) + 16;
    var rule = '@page { size: ' + widthMm + 'mm ' + heightMm + 'mm; margin: 8mm; }';
    var existing = document.getElementById('dynamic-page-size');
    if (existing) {
      existing.textContent = rule;
    } else {
      var style = document.createElement('style');
      style.id = 'dynamic-page-size';
      style.textContent = rule;
      document.head.appendChild(style);
    }
  }
  window.addEventListener('load', resizePageToContent);
  window.addEventListener('beforeprint', resizePageToContent);
</script>
<h1>Distant Friends — Translation Review</h1>
<div class="meta">${esc(meta)}</div>

${[...phrasesByScene.entries()]
  .filter(([, list]) => list.length)
  .map(([sceneId, list]) => {
    const scene = sceneById.get(sceneId);
    const sceneTitle = scene
      ? scene.title.replace(scene.em, `<em>${esc(scene.em)}</em>`)
      : esc(sceneId);
    return `
<div class="scene-header"><span class="num">${esc(scene?.num ?? '')}</span>${sceneTitle}</div>
<table>
<colgroup>
  <col class="id-col">
  ${cols.map(() => '<col class="lang-col">').join('')}
</colgroup>
<thead><tr>
  <th>phrase</th>
  ${cols
    .map((c) => {
      const L = langByCode.get(c);
      const isAnchor = anchorCode && c === anchorCode;
      return `<th${isAnchor ? ' class="anchor"' : ''}>${esc(L?.native || c)}<span class="code">${esc(c)}</span></th>`;
    })
    .join('')}
</tr></thead>
<tbody>
  ${list
    .map((p) => {
      const cells = cols
        .map((c) =>
          renderCell(p.trans[c], anchorCode === c, c),
        )
        .join('');
      return `<tr><td class="id-cell">${esc(p.id)}</td>${cells}</tr>`;
    })
    .join('')}
</tbody>
</table>`;
  })
  .join('')}

</body>
</html>
`;

const absOut = resolve(root, outPath);
await mkdir(dirname(absOut), { recursive: true });
await writeFile(absOut, html, 'utf8');

console.log(`\nWrote ${phrasesToRender.length} phrases × ${cols.length} languages → ${outPath}`);
console.log(`Open: file://${absOut}`);
