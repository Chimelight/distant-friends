import { atom } from 'nanostores';

/** Fallback only — see tick(): the real signal is <main> reaching the fold. */
export const SCROLL_THRESHOLD = 420;

export const scrolled = atom<boolean>(false);
export const activeScene = atom<string>('');
export const tocExpanded = atom<boolean>(false);

let initialized = false;

/**
 * Attach a RAF-coalesced window scroll listener that updates scrolled and
 * activeScene. Idempotent — safe to call from multiple component mounts.
 * Mirrors `scrolled` to body.classList so global CSS selectors can react
 * without each component subscribing.
 */
/**
 * Scroll the visible view's block for a scene into view. Both views carry
 * data-scene on their blocks; offsetParent is null inside the hidden view,
 * which picks the displayed one without view-aware logic.
 */
export function jumpToScene(id: string): void {
  const all = document.querySelectorAll<HTMLElement>(`[data-scene="${id}"]`);
  for (const el of all) {
    if (el.offsetParent !== null) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
}

export function initScrollListener(sceneSelector = '.scene-block'): () => void {
  if (typeof window === 'undefined') return () => {};
  if (initialized) return () => {};
  initialized = true;

  let rafId = 0;
  const tick = () => {
    rafId = 0;
    // "Scrolled" means the reader has reached the content, not an absolute
    // pixel count: on phones the masthead + chips + stationery + TocTop
    // stack is far taller than any fixed threshold, and a fixed 420px made
    // TocTop fade out while still on screen.
    const main = document.querySelector('main');
    const next = main
      ? main.getBoundingClientRect().top <= 120
      : window.scrollY > SCROLL_THRESHOLD;
    if (next !== scrolled.get()) {
      scrolled.set(next);
      document.body.classList.toggle('scrolled', next);
    }

    // Skip hidden scene blocks (the other view's). offsetParent is null
    // when any ancestor has display:none, which lets us treat the visible
    // view's blocks as the only source of truth without view-aware logic.
    const blocks = document.querySelectorAll<HTMLElement>(sceneSelector);
    let active = '';
    for (const block of blocks) {
      if (block.offsetParent === null) continue;
      const top = block.getBoundingClientRect().top;
      if (top <= 120) active = block.dataset.scene ?? active;
      else break;
    }
    if (active && active !== activeScene.get()) activeScene.set(active);
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
