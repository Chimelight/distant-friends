// One popover open at a time, coordinated through a single store.
// Every floating layer (SlotPicker menus, the Stationery language panel,
// table-header column switchers) registers here instead of wiring its own
// document listeners — which is what previously let two popovers stay open
// at once (each trigger's stopPropagation hid the click from the others).
import { atom } from 'nanostores';

/** Id of the currently open popover, or null. One popover open at a time. */
export const openPopover = atom<string | null>(null);

export function togglePopover(id: string): void {
  openPopover.set(openPopover.get() === id ? null : id);
}

export function closePopover(): void {
  openPopover.set(null);
}

const roots = new Map<string, HTMLElement>();
let wired = false;

function onDocClick(e: MouseEvent) {
  const id = openPopover.get();
  if (!id) return;
  const root = roots.get(id);
  // Clicks inside the root (trigger or panel) keep it open; a click on
  // another popover's trigger has already re-pointed the store by the time
  // the event bubbles here, so the new root contains the target.
  if (root && !root.contains(e.target as Node)) openPopover.set(null);
}

function onDocKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  const id = openPopover.get();
  if (!id) return;
  openPopover.set(null);
  // Hand focus back to the trigger so keyboard users don't drop to <body>.
  roots.get(id)?.querySelector<HTMLElement>('[aria-expanded]')?.focus();
}

/**
 * Svelte action marking `node` as a popover root: the element containing
 * both the trigger (carries `aria-expanded`) and the floating panel.
 * Registers the shared outside-click / Escape handling.
 */
export function popover(node: HTMLElement, id: string) {
  if (!wired) {
    wired = true;
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onDocKeydown);
  }
  roots.set(id, node);
  return {
    update(next: string) {
      roots.delete(id);
      id = next;
      roots.set(id, node);
    },
    destroy() {
      roots.delete(id);
      if (openPopover.get() === id) openPopover.set(null);
    },
  };
}

/**
 * Svelte action: APG-style arrow-key navigation for a `role="menu"` panel.
 * ArrowDown/ArrowUp cycle focus through the items, Home/End jump.
 */
export function menuKeys(node: HTMLElement) {
  function onKeydown(e: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = [
      ...node.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)'),
    ];
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : i === -1 ? (e.key === 'ArrowDown' ? 0 : items.length - 1)
      : e.key === 'ArrowDown' ? (i + 1) % items.length
      : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  }
  node.addEventListener('keydown', onKeydown);
  return { destroy: () => node.removeEventListener('keydown', onKeydown) };
}
