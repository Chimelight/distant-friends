import { atom } from 'nanostores';

export const SCROLL_THRESHOLD = 420;

export const $scrolled = atom<boolean>(false);
export const $activeScene = atom<string>('');
export const $tocExpanded = atom<boolean>(false);

let initialized = false;

/**
 * Attach a RAF-coalesced window scroll listener that updates $scrolled and
 * $activeScene. Idempotent — safe to call from multiple component mounts.
 * Callers provide a selector for scene block elements so this module stays
 * decoupled from DOM structure.
 */
export function initScrollListener(sceneSelector = '.scene-block'): () => void {
  if (typeof window === 'undefined') return () => {};
  if (initialized) return () => {};
  initialized = true;

  let rafId = 0;
  const tick = () => {
    rafId = 0;
    $scrolled.set(window.scrollY > SCROLL_THRESHOLD);

    const blocks = document.querySelectorAll<HTMLElement>(sceneSelector);
    let active = '';
    for (const block of blocks) {
      const top = block.getBoundingClientRect().top;
      if (top <= 120) active = block.dataset.scene ?? active;
      else break;
    }
    if (active && active !== $activeScene.get()) $activeScene.set(active);
  };

  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  tick();

  return () => {
    window.removeEventListener('scroll', onScroll);
    if (rafId) cancelAnimationFrame(rafId);
    initialized = false;
  };
}
