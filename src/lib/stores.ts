import { persistentAtom } from '@nanostores/persistent';
import languages from '../data/languages.json';
import type { ToneFilter, AddresseeFilter } from './filter';

const jsonCodec = {
  encode: JSON.stringify,
  decode: JSON.parse,
};

export const $selectedLangs = persistentAtom<string[] | null>(
  'distant-friends:selectedLangs:v1',
  null,
  jsonCodec,
);

export const $anchor = persistentAtom<string>('distant-friends:anchor:v1', 'zh');

export const $tone = persistentAtom<ToneFilter>('distant-friends:tone:v1', 'any');

export const $addressee = persistentAtom<AddresseeFilter>(
  'distant-friends:addressee:v1',
  'friend',
);

export type ViewMode = 'auto' | 'table' | 'cards';
export const $view = persistentAtom<ViewMode>('distant-friends:view:v1', 'auto');

export type ThemeMode = 'light' | 'dark' | 'system';
export const $theme = persistentAtom<ThemeMode>('distant-friends:theme:v1', 'system');

export const $starred = persistentAtom<string[]>(
  'distant-friends:starred:v1',
  [],
  jsonCodec,
);

export const $uiLocale = persistentAtom<string>('distant-friends:uiLocale:v1', 'en');

// Lazy init: on first run $selectedLangs is null; fill from languages.defaultOn.
// Set-style helpers read/write as string[] (Set doesn't JSON-serialize).
export function ensureSelectedLangsInitialized(): void {
  if ($selectedLangs.get() === null) {
    const defaults = languages
      .filter((l) => l.defaultOn)
      .map((l) => l.code);
    $selectedLangs.set(defaults);
  }
}
