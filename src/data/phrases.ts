import type { TPhrase } from '../lib/schema';
import scenes from './scenes.json';

const modules = import.meta.glob('./phrases/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, TPhrase>;

const sceneOrder: Record<string, number> = Object.fromEntries(
  scenes.map((s, i) => [s.id, i]),
);

const phrases: TPhrase[] = Object.values(modules).sort(
  (a, b) =>
    (sceneOrder[a.scene] ?? 999) - (sceneOrder[b.scene] ?? 999) ||
    a.order - b.order,
);

export default phrases;
