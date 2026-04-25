#!/usr/bin/env node
/**
 * Interactively append a new phrase skeleton to src/data/phrases.json.
 *
 * Usage:  pnpm run new-phrase
 *
 * Prompts for id, scene, order. Generates a stub with the anchor language's
 * `trans` entry pre-filled with empty placeholders for every language listed
 * in languages.json. You then open phrases.json and fill in the strings.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '..', 'src', 'data');
const phrasesPath = resolve(dataDir, 'phrases.json');
const scenesPath = resolve(dataDir, 'scenes.json');
const languagesPath = resolve(dataDir, 'languages.json');

const phrases = JSON.parse(await readFile(phrasesPath, 'utf8'));
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
phrases.push(newPhrase);

await writeFile(phrasesPath, JSON.stringify(phrases, null, 2) + '\n', 'utf8');

console.log();
console.log(`✓ Appended skeleton for "${id}" (${scene} / order ${order}).`);
console.log(`  Now open ${phrasesPath} and fill in the gloss + variants.`);
