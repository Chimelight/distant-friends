export const STORAGE_VERSION = 1;

type Envelope<T> = { __v: number; data: T };

export function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (parsed && parsed.__v === STORAGE_VERSION) return parsed.data;
    const migrated = migrate<T>(key, parsed);
    return migrated ?? fallback;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, data: T): void {
  if (typeof localStorage === 'undefined') return;
  const envelope: Envelope<T> = { __v: STORAGE_VERSION, data };
  localStorage.setItem(key, JSON.stringify(envelope));
}

function migrate<T>(_key: string, _parsed: unknown): T | null {
  // Future versions: switch on parsed.__v and return migrated data.
  return null;
}
