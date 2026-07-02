// Cross-component state. Exported names drop the `$` prefix so Svelte 5
// (which reserves `$` for runes) can import them; Svelte auto-subscribes
// in templates with the `$store` syntax.
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import languages from '../data/languages.json';
import type { ToneFilter, GenderFilter } from './filter';

/** Max languages visible at once, anchor included. */
export const MAX_LANGS = 5;

const jsonCodec = {
  encode: JSON.stringify,
  decode: JSON.parse,
};

export const selectedLangs = persistentAtom<string[] | null>(
  'distant-friends:selectedLangs:v1',
  null,
  jsonCodec,
);

// Derive the first-visit anchor from the dataset (defaultAnchor = en) rather
// than hardcoding — keeps it in sync with languages.json and the §13 decision
// to anchor in English for the international audience.
const DEFAULT_ANCHOR = languages.find((l) => l.defaultAnchor)?.code ?? languages[0]?.code ?? 'en';
export const anchor = persistentAtom<string>('distant-friends:anchor:v1', DEFAULT_ANCHOR);

export const tone = persistentAtom<ToneFilter>('distant-friends:tone:v1', 'any');

// Writer / recipient gender preferences. Restored 2026-06 after both axes
// passed the coverage threshold (see filter.ts). Persisted: they describe
// stable facts about the user and their friend, not a transient view state.
export const speakerGender = persistentAtom<GenderFilter>(
  'distant-friends:speakerGender:v1',
  'any',
);
export const addresseeGender = persistentAtom<GenderFilter>(
  'distant-friends:addresseeGender:v1',
  'any',
);

export type ViewMode = 'auto' | 'table' | 'cards';
export const view = persistentAtom<ViewMode>('distant-friends:view:v1', 'auto');

export type ThemeMode = 'light' | 'dark' | 'system';
export const theme = persistentAtom<ThemeMode>('distant-friends:theme:v1', 'system');

export const starred = persistentAtom<string[]>(
  'distant-friends:starred:v1',
  [],
  jsonCodec,
);

export function toggleStar(phraseId: string): void {
  const cur = starred.get();
  starred.set(
    cur.includes(phraseId) ? cur.filter((id) => id !== phraseId) : [...cur, phraseId],
  );
}

// Deliberately ephemeral (not persisted): reopening the site with a stale
// "starred only" filter active would read as missing content.
export const starredOnly = atom<boolean>(false);

export const uiLocale = persistentAtom<string>('distant-friends:uiLocale:v1', 'en');

function ensureSelectedLangsInitialized(): void {
  const validCodes = new Set(languages.map((l) => l.code));
  const current = selectedLangs.get();

  if (current === null) {
    const defaults = languages
      .filter((l) => l.defaultOn)
      .map((l) => l.code);
    selectedLangs.set(defaults);
    return;
  }

  // Garbage-collect codes that no longer exist in languages.json — happens
  // when a previously-selected language is dropped from the dataset between
  // visits (e.g. the brief zh-TW track). Without this, ghost entries stay
  // in the persisted Set, count toward the 5-chip cap, and cause the
  // "up to 5 at a time" hint to fire when the visible selection is fewer.
  const cleaned = current.filter((c) => validCodes.has(c));
  if (cleaned.length !== current.length) {
    selectedLangs.set(cleaned);
  }

  // Migrate retired tone tiers ('close' was merged into 'casual', 2026-06-13).
  if (!['any', 'casual', 'neutral', 'polite'].includes(tone.get())) {
    tone.set('casual');
  }

  // Same for anchor — if the persisted anchor is a code that no longer
  // exists, fall back to the dataset's defaultAnchor (or first language).
  const a = anchor.get();
  if (!validCodes.has(a)) {
    const fallback = languages.find((l) => l.defaultAnchor)?.code ?? languages[0]?.code;
    if (fallback) anchor.set(fallback);
  }
}

// Initialize/migrate persisted state once per client session — at module
// scope, so no particular island has to mount for defaults to exist. (This
// used to run in LanguagePicker's onMount, which made every other consumer
// of $selectedLangs depend on that one component hydrating first.)
if (typeof window !== 'undefined') ensureSelectedLangsInitialized();

// Transient: the language whose column/blocks were just switched in, added,
// or made anchor — drives the "fresh ink" write-in animation in both views.
export const freshLang = atom<string | null>(null);
let freshTimer: ReturnType<typeof setTimeout> | undefined;

export function markFreshLang(code: string): void {
  freshLang.set(code);
  clearTimeout(freshTimer);
  // Past the longest write-in cascade; keeping it set would replay the
  // animation on unrelated re-renders.
  freshTimer = setTimeout(() => freshLang.set(null), 900);
}

// Ephemeral toast — non-persistent. `key` lets the Toast component re-trigger
// the show animation even when the same text is copied twice in a row.
export type ToastMessage = { text: string; key: number };
export const toast = atom<ToastMessage | null>(null);

export function showToast(text: string): void {
  toast.set({ text, key: Date.now() });
}
