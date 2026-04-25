import type { TVariant } from './schema';

export type ToneFilter = 'any' | 'close' | 'casual' | 'neutral' | 'polite';
export type AddresseeFilter = 'friend' | 'woman' | 'man' | 'everyone';

export function visibleVariants(
  all: TVariant[],
  tone: ToneFilter,
  addressee: AddresseeFilter,
): TVariant[] {
  if (!all?.length) return [];
  let pool = all;

  // 1. addressee count: everyone -> only many; otherwise -> exclude many
  if (addressee === 'everyone') {
    pool = pool.filter((v) => v.addresseeCount === 'many');
    if (!pool.length) return [];
  } else {
    pool = pool.filter((v) => v.addresseeCount !== 'many');
  }

  // 2. tone: filter or fallback to untoned
  if (tone !== 'any') {
    const toned = pool.filter((v) => v.tone === tone);
    if (toned.length) {
      pool = toned;
    } else {
      const untoned = pool.filter((v) => !v.tone);
      if (untoned.length) pool = untoned;
    }
  }

  // 3. addressee gender (rare; only narrows when matches exist)
  const g = addressee === 'woman' ? 'f' : addressee === 'man' ? 'm' : null;
  if (g) {
    const matched = pool.filter((v) => v.addresseeGender === g);
    if (matched.length) pool = matched;
  }

  return pool;
}
