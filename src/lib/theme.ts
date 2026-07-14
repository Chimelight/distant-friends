// Theme application and switching, shared by the StickyBar's ThemeToggle
// and the mobile bookmark capsule — both write the same persisted store.
import { theme, type ThemeMode } from './stores';

/**
 * Apply theme to <html data-theme>. 'system' means "no override" — we
 * remove the attribute so the prefers-color-scheme media query in
 * tokens.css drives the palette.
 */
export function applyTheme(t: ThemeMode): void {
  const root = document.documentElement;
  if (t === 'light' || t === 'dark') {
    root.dataset.theme = t;
  } else {
    delete root.dataset.theme;
  }
}

/**
 * Switch theme. Prefer the View Transitions API: a single GPU-composited
 * crossfade that stays smooth no matter how many rows are on screen.
 * Animation timing is tuned in global.css. Firefox falls back to a
 * grouped CSS transition.
 */
export function switchTheme(t: ThemeMode): void {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    theme.set(t);
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => theme.set(t));
    return;
  }

  const root = document.documentElement;
  root.classList.add('is-theme-changing');
  theme.set(t);
  window.setTimeout(() => root.classList.remove('is-theme-changing'), 500);
}

const CYCLE: ThemeMode[] = ['light', 'dark', 'system'];

/** Single-button rotation for the capsule: light → dark → system. */
export function cycleTheme(): void {
  const i = CYCLE.indexOf(theme.get());
  switchTheme(CYCLE[(i + 1) % CYCLE.length]);
}
