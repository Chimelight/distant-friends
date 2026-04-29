#!/usr/bin/env node
/**
 * Interactively create a new phrase file in src/data/phrases/<id>.json.
 *
 * Usage:  pnpm run new-phrase
 *
 * Prompts for id, scene, order. Generates a stub with empty placeholders
 * for every language listed in languages.json.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadPhrases } from './_load-phrases.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '..', 'src', 'data');
const phrasesDir = resolve(dataDir, 'phrases');
const scenesPath = resolve(dataDir, 'scenes.json');
const languagesPath = resolve(dataDir, 'languages.json');

const phrases = await loadPhrases(dataDir);
const scenes = JSON.parse(await readFile(scenesPath, 'utf8'));
const languages = JSON.parse(await readFile(languagesPath, 'utf8'));

const rl = createInterface({ input: stdin, output: stdout });

const sceneIds = scenes.map((s) => s.id).join(' / ');
const id = (await rl.question(`id (kebab-case, e.g. greeting-hello):  `)).trim();
if (!id) {
  console.error('id is required.');
  rl.close();
  process.exit(1);
}
if (phrases.some((p) => p.id === id)) {
  console.error(`Phrase with id "${id}" already exists.`);
  rl.close();
  process.exit(1);
}

const scene = (await rl.question(`scene  (${sceneIds}):  `)).trim();
if (!scenes.some((s) => s.id === scene)) {
  console.error(`Unknown scene "${scene}". Add to scenes.json first.`);
  rl.close();
  process.exit(1);
}

const orderStr = (await rl.question(`order  (number; default = next in scene):  `)).trim();
const ordersInScene = phrases.filter((p) => p.scene === scene).map((p) => p.order);
const nextOrder = ordersInScene.length ? Math.max(...ordersInScene) + 1 : 1;
const order = orderStr ? Number(orderStr) : nextOrder;

rl.close();

const trans = {};
for (const L of languages) {
  trans[L.code] = {
    gloss: '',
    variants: [{ text: '' }],
  };
}

const newPhrase = { id, scene, order, trans };
const newPath = resolve(phrasesDir, `${id}.json`);

await writeFile(newPath, JSON.stringify(newPhrase, null, 2) + '\n', 'utf8');

console.log();
console.log(`✓ Created skeleton for "${id}" (${scene} / order ${order}).`);
console.log(`  Now open ${newPath} and fill in the gloss + variants.`);
