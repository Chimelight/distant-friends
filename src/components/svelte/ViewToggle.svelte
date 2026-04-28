<script lang="ts">
  import { onMount } from 'svelte';
  import { view, type ViewMode } from '../../lib/stores';

  const QUERY = '(min-width: 640px)';
  let mounted = $state(false);
  let resolved = $state<'table' | 'cards'>('table');

  /**
   * Below the table breakpoint, lock to cards regardless of stored preference.
   * Above it, honor the stored value (auto → table, else literal).
   * The user's stored 'table' preference is preserved across narrow visits so
   * desktop returns to table without losing intent.
   */
  function resolve(v: ViewMode): 'table' | 'cards' {
    const wide = window.matchMedia(QUERY).matches;
    if (!wide) return 'cards';
    return v === 'cards' ? 'cards' : 'table';
  }
  function applyToBody(v: 'table' | 'cards') {
    document.body.dataset.view = v;
  }

  onMount(() => {
    mounted = true;
    resolved = resolve(view.get());
    applyToBody(resolved);

    const unsubView = view.subscribe((v) => {
      resolved = resolve(v);
      applyToBody(resolved);
    });

    const mql = window.matchMedia(QUERY);
    const onChange = () => {
      // Re-resolve on every viewport crossing — the mobile lock means the
      // body attribute can change even when $view itself didn't.
      resolved = resolve(view.get());
      applyToBody(resolved);
    };
    mql.addEventListener('change', onChange);

    return () => {
      unsubView();
      mql.removeEventListener('change', onChange);
    };
  });

  function set(v: 'table' | 'cards') {
    view.set(v);
  }
</script>

<div class="view-toggle" role="group" aria-label="View mode">
  <button
    type="button"
    aria-pressed={mounted && resolved === 'cards'}
    onclick={() => set('cards')}>Cards</button
  >
  <button
    type="button"
    aria-pressed={mounted && resolved === 'table'}
    onclick={() => set('table')}>Table</button
  >
</div>

<style>
  /* The toggle lives inside StickyBar's .sb-controls cluster — no own
   * positioning, just the pill chrome. Color/size overrides come from
   * StickyBar.svelte's :global() rules. */
  .view-toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 999px;
  }
  .view-toggle button {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink-mute);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 7px 14px;
    border-radius: 999px;
    transition: all var(--dur-switch) ease;
  }
  .view-toggle button:hover {
    color: var(--ink);
  }
  .view-toggle button[aria-pressed="true"] {
    background: var(--ink);
    color: var(--paper-up);
  }

  /* Below the table breakpoint: cards is the only sensible layout, so
   * hide the toggle entirely instead of offering a choice that overflows. */
  @media (max-width: 639px) {
    .view-toggle {
      display: none;
    }
  }
</style>
