// The language dataset plus the lookups its consumers kept re-deriving.
import languages from '../data/languages.json';
import type { TLanguage } from './schema';

export const LANGS = languages as TLanguage[];

export const LANG_BY_CODE: ReadonlyMap<string, TLanguage> = new Map(
  LANGS.map((l) => [l.code, l]),
);

/** Region groups in dataset order — the picker renders whatever the data holds. */
export const LANG_GROUPS: readonly string[] = [...new Set(LANGS.map((l) => l.group))];

/**
 * Value for HTML `lang` attributes. `bcp47` in languages.json overrides
 * codes that aren't valid BCP-47 tags (mizo → ISO 639-3 "lus").
 */
export const langTag = (l: TLanguage): string => l.bcp47 ?? l.code;

/** `langTag` by code, for call sites that only hold the code (falls through). */
export const langTagOf = (code: string): string => {
  const l = LANG_BY_CODE.get(code);
  return l ? langTag(l) : code;
};

/** Map selection codes to language entries, preserving the selection's order. */
export function langsByCodes(codes: string[]): TLanguage[] {
  return codes
    .map((c) => LANG_BY_CODE.get(c))
    .filter((l): l is TLanguage => l !== undefined);
}

/** Case- and diacritic-insensitive fold, so "francais" matches "Français". */
export const fold = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Plain Levenshtein \u2014 small strings only (typo suggestions in the picker). */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}
