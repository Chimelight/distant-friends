import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function loadPhrases(dataDir) {
  const dir = resolve(dataDir, 'phrases');
  const scenes = JSON.parse(await readFile(resolve(dataDir, 'scenes.json'), 'utf8'));
  const sceneOrder = Object.fromEntries(scenes.map((s, i) => [s.id, i]));
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  const phrases = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(resolve(dir, f), 'utf8'))),
  );
  phrases.sort(
    (a, b) =>
      (sceneOrder[a.scene] ?? 999) - (sceneOrder[b.scene] ?? 999) ||
      a.order - b.order,
  );
  return phrases;
}
