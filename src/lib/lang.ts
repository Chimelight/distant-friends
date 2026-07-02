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

/** Map selection codes to language entries, preserving the selection's order. */
export function langsByCodes(codes: string[]): TLanguage[] {
  return codes
    .map((c) => LANG_BY_CODE.get(c))
    .filter((l): l is TLanguage => l !== undefined);
}

/** Case- and diacritic-insensitive fold, so "francais" matches "Français". */
export const fold = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
