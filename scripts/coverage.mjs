#!/usr/bin/env node
/**
 * Print a per-phrase × per-language coverage matrix.
 *
 * Usage:  pnpm run coverage
 *
 * A `✓` means the phrase has at least one variant in that language.
 * A `·` means the language is missing for that phrase.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '..', 'src', 'data');

const phrases = JSON.parse(await readFile(resolve(dataDir, 'phrases.json'), 'utf8'));
const languages = JSON.parse(await readFile(resolve(dataDir, 'languages.json'), 'utf8'));

const codes = languages.map((l) => l.code);
const idCol = Math.max('phrase'.length, ...phrases.map((p) => p.id.length));

const head = 'phrase'.padEnd(idCol) + '  ' + codes.map((c) => c.padEnd(2)).join('  ');
console.log(head);
console.log('-'.repeat(head.length));

let totalCells = 0;
let filledCells = 0;

for (const p of phrases) {
  const cells = codes.map((c) => {
    totalCells++;
    const has = p.trans?.[c]?.variants?.length > 0;
    if (has) filledCells++;
    return has ? '✓' : '·';
  });
  console.log(p.id.padEnd(idCol) + '  ' + cells.map((c) => c.padEnd(2)).join('  '));
}

console.log();
const pct = ((filledCells / totalCells) * 100).toFixed(1);
console.log(`Coverage: ${filledCells} / ${totalCells} cells (${pct}%)`);

const perLang = codes.map((c) => {
  const have = phrases.filter((p) => p.trans?.[c]?.variants?.length > 0).length;
  return { code: c, have, miss: phrases.length - have };
});
console.log();
console.log('Per language:');
for (const row of perLang) {
  console.log(`  ${row.code}  ${row.have}/${phrases.length}` + (row.miss ? `  (missing ${row.miss})` : ''));
}
