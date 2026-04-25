<script lang="ts">
  import { onMount } from 'svelte';
  import { view, type ViewMode } from '../../lib/stores';

  const QUERY = '(min-width: 960px)';
  let mounted = $state(false);
  let resolved = $state<'table' | 'cards'>('table');

  function resolve(v: ViewMode): 'table' | 'cards' {
    if (v === 'auto') return window.matchMedia(QUERY).matches ? 'table' : 'cards';
    return v;
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
      if (view.get() === 'auto') {
        resolved = resolve('auto');
        applyToBody(resolved);
      }
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
  .view-toggle {
    position: absolute;
    top: 24px;
    right: 24px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 999px;
    z-index: 40;
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
  @media (max-width: 640px) {
    .view-toggle {
      top: 16px;
      right: 16px;
    }
    .view-toggle button {
      font-size: 9px;
      padding: 6px 10px;
    }
  }
</style>
