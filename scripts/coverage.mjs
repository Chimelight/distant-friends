#!/usr/bin/env node
/**
 * Print a per-phrase × per-language coverage matrix plus data-maturity
 * metrics that decide when to bring back a UI control.
 *
 * Matrix:  ✓ = at least one variant for that language; · = missing.
 * Maturity:
 *   - speakerGender variants → triggers a "Signed by" Stationery slot at ≥10
 *   - addresseeGender variants → triggers an addressee gender slot at ≥10
 *   - addresseeCount  variants → informational
 *
 * Usage:  pnpm coverage
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadPhrases } from './_load-phrases.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '..', 'src', 'data');

const phrases = await loadPhrases(dataDir);
const languages = JSON.parse(await readFile(resolve(dataDir, 'languages.json'), 'utf8'));

const codes = languages.map((l) => l.code);
const idCol = Math.max('phrase'.length, ...phrases.map((p) => p.id.length));

const head = 'phrase'.padEnd(idCol) + '  ' + codes.map((c) => c.padEnd(2)).join('  ');
console.log(head);
console.log('-'.repeat(head.length));

let totalCells = 0;
let filledCells = 0;
let unreviewedCells = 0;
const tally = { speakerGender: 0, addresseeGender: 0, addresseeCount: 0 };

for (const p of phrases) {
  const cells = codes.map((c) => {
    totalCells++;
    const tr = p.trans?.[c];
    const variants = tr?.variants ?? [];
    if (variants.length > 0) filledCells++;
    for (const v of variants) {
      if (v.speakerGender) tally.speakerGender++;
      if (v.addresseeGender) tally.addresseeGender++;
      if (v.addresseeCount) tally.addresseeCount++;
      if (v.reviewed === false) unreviewedCells++;
    }
    return variants.length ? '✓' : '·';
  });
  console.log(p.id.padEnd(idCol) + '  ' + cells.map((c) => c.padEnd(2)).join('  '));
}

console.log();
const pct = ((filledCells / totalCells) * 100).toFixed(1);
console.log(`Coverage: ${filledCells} / ${totalCells} cells (${pct}%)`);
if (unreviewedCells) {
  console.log(`Unreviewed variants: ${unreviewedCells}`);
}

console.log();
console.log('Per language:');
const perLang = codes.map((c) => {
  const have = phrases.filter((p) => p.trans?.[c]?.variants?.length > 0).length;
  return { code: c, have, miss: phrases.length - have };
});
for (const row of perLang) {
  const note = row.miss ? `  (missing ${row.miss})` : '';
  console.log(`  ${row.code}  ${row.have}/${phrases.length}${note}`);
}

const THRESHOLD = 10;
function bar(n, label, threshold = null) {
  if (threshold === null) {
    return `  ${label.padEnd(16)} ${n}`;
  }
  const ready = n >= threshold;
  const tag = ready ? '✓ ready to surface' : `${threshold - n} away from threshold (${threshold})`;
  return `  ${label.padEnd(16)} ${String(n).padEnd(4)} ${tag}`;
}

console.log();
console.log('Data maturity (gender / count axes):');
console.log(bar(tally.speakerGender, 'speakerGender', THRESHOLD));
console.log(bar(tally.addresseeGender, 'addresseeGender', THRESHOLD));
console.log(bar(tally.addresseeCount, 'addresseeCount'));
