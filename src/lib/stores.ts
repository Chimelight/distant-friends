// Cross-component state. Exported names drop the `$` prefix so Svelte 5
// (which reserves `$` for runes) can import them; Svelte auto-subscribes
// in templates with the `$store` syntax.
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import languages from '../data/languages.json';
import type { ToneFilter } from './filter';

const jsonCodec = {
  encode: JSON.stringify,
  decode: JSON.parse,
};

export const selectedLangs = persistentAtom<string[] | null>(
  'distant-friends:selectedLangs:v1',
  null,
  jsonCodec,
);

export const anchor = persistentAtom<string>('distant-friends:anchor:v1', 'zh');

export const tone = persistentAtom<ToneFilter>('distant-friends:tone:v1', 'any');

export type ViewMode = 'auto' | 'table' | 'cards';
export const view = persistentAtom<ViewMode>('distant-friends:view:v1', 'auto');

export type ThemeMode = 'light' | 'dark' | 'system';
export const theme = persistentAtom<ThemeMode>('distant-friends:theme:v1', 'system');

export const starred = persistentAtom<string[]>(
  'distant-friends:starred:v1',
  [],
  jsonCodec,
);

export const uiLocale = persistentAtom<string>('distant-friends:uiLocale:v1', 'en');

export function ensureSelectedLangsInitialized(): void {
  if (selectedLangs.get() === null) {
    const defaults = languages
      .filter((l) => l.defaultOn)
      .map((l) => l.code);
    selectedLangs.set(defaults);
  }
}

// Ephemeral toast — non-persistent. `key` lets the Toast component re-trigger
// the show animation even when the same text is copied twice in a row.
export type ToastMessage = { text: string; key: number };
export const toast = atom<ToastMessage | null>(null);

export function showToast(text: string): void {
  toast.set({ text, key: Date.now() });
}
