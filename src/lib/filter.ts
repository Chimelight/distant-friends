import type { TVariant } from './schema';

export type ToneFilter = 'any' | 'close' | 'casual' | 'neutral' | 'polite';
export type GenderFilter = 'any' | 'm' | 'f';

/**
 * Gender axes drop variants explicitly tagged with the *opposite* value;
 * matching and untagged variants stay. If a cell consists only of
 * opposite-tagged variants the filter backs off entirely — a cell must
 * never go empty because of a preference (same philosophy as the tone
 * fallback below).
 */
function dropOpposite(
  pool: TVariant[],
  field: 'speakerGender' | 'addresseeGender',
  pref: GenderFilter,
): TVariant[] {
  if (pref === 'any') return pool;
  const kept = pool.filter((v) => !v[field] || v[field] === pref);
  return kept.length ? kept : pool;
}

/**
 * Pick the variants to display for the current UI preferences.
 *
 * History: the gender controls were removed in v1.5 when the dataset had
 * almost no gendered variants, leaving tag-line disclosure only. They
 * returned in 2026-06 once both axes passed ~60 tagged variants (threshold
 * was 10 — see scripts/coverage.mjs).
 */
export function visibleVariants(
  all: TVariant[],
  tone: ToneFilter,
  speaker: GenderFilter = 'any',
  addressee: GenderFilter = 'any',
): TVariant[] {
  if (!all?.length) return [];
  let pool = all;

  pool = dropOpposite(pool, 'speakerGender', speaker);
  pool = dropOpposite(pool, 'addresseeGender', addressee);

  if (tone !== 'any') {
    const toned = pool.filter((v) => v.tone === tone);
    if (toned.length) {
      pool = toned;
    } else {
      const untoned = pool.filter((v) => !v.tone);
      if (untoned.length) pool = untoned;
    }
  }

  return pool;
}
