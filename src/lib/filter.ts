import type { TVariant } from './schema';

export type ToneFilter = 'any' | 'close' | 'casual' | 'neutral' | 'polite';

/**
 * Pick the variants to display for the current UI tone.
 *
 * Why no addressee axis: gender / count fields exist on variants for tag-line
 * disclosure ("he writes", "to everyone") but the dataset is too thin in v1
 * to justify a UI control. The control will return when speakerGender or
 * addresseeGender variants accumulate past ~10 cells (see scripts/coverage.mjs).
 */
export function visibleVariants(all: TVariant[], tone: ToneFilter): TVariant[] {
  if (!all?.length) return [];
  let pool = all;

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
