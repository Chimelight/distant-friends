<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '../../lib/stores';
  import { applyTheme, switchTheme } from '../../lib/theme';

  onMount(() => {
    // Initial sync (Layout's FOUC script already set data-theme; this
    // guarantees match for the 'system' → null case after hydration).
    applyTheme(theme.get());
    return theme.subscribe(applyTheme);
  });

  const set = switchTheme;
</script>

<div class="theme-toggle" role="group" aria-label="Color theme">
  <button
    type="button"
    aria-pressed={$theme === 'system'}
    aria-label="Match system"
    title="System"
    onclick={() => set('system')}
  >
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.4" />
      <path d="M8 2.6a5.4 5.4 0 0 0 0 10.8z" fill="currentColor" stroke="none" />
    </svg>
  </button>
  <button
    type="button"
    aria-pressed={$theme === 'light'}
    aria-label="Light theme"
    title="Light"
    onclick={() => set('light')}
  >
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.6" fill="currentColor" stroke="none" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
    </svg>
  </button>
  <button
    type="button"
    aria-pressed={$theme === 'dark'}
    aria-label="Dark theme"
    title="Dark"
    onclick={() => set('dark')}
  >
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11 2.5a5.5 5.5 0 1 0 4.5 8.4 4.5 4.5 0 0 1-4.5-8.4z" />
    </svg>
  </button>
</div>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    background: transparent;
    border: 1px solid var(--line-soft);
    border-radius: 999px;
    flex-shrink: 0;
  }
  .theme-toggle button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    border-radius: 999px;
    color: var(--ink-mute);
    transition: all var(--dur-switch) ease;
  }
  .theme-toggle button:hover {
    color: var(--ink);
  }
  .theme-toggle button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .theme-toggle button[aria-pressed="true"] {
    background: var(--ink);
    color: var(--paper-up);
  }
  .theme-toggle svg {
    width: 12px;
    height: 12px;
  }
</style>
