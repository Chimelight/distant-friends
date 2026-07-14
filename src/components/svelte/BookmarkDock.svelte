<script lang="ts">
  import { scrolled } from '../../lib/scroll';
  import { starred, starredOnly, theme } from '../../lib/stores';
  import { openPopover, togglePopover, closePopover, popover } from '../../lib/popover';
  import { cycleTheme } from '../../lib/theme';
  import ui from '../../content/ui/en.json';

  const DOCK_ID = 'bookmark-dock';
  const open = $derived($openPopover === DOCK_ID);

  function backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closePopover();
  }
</script>

<!-- Mobile-only (≤640, CSS): the back-to-top button grown into a bookmark —
     tapping ⋮ expands a capsule of the utilities the narrow StickyBar
     cannot hold: starred-only filter, theme cycle, back to top. One
     continuous pill in the site's pill vocabulary; no scrim, outside
     click / Esc close via the shared popover primitive. -->
<div class="dock" class:on={$scrolled} use:popover={DOCK_ID}>
  {#if open}
    <div class="cap" role="group" aria-label="Quick actions">
      {#if $starred.length > 0}
        <button
          class="seg"
          type="button"
          aria-pressed={$starredOnly}
          aria-label={`${ui.filters.starredOnly} (${$starred.length})`}
          onclick={() => starredOnly.set(!$starredOnly)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              class="star-p"
              d="M8 1.8l1.86 3.92 4.14.55-3.04 2.98.76 4.27L8 11.46l-3.72 2.04.76-4.27L2 6.27l4.14-.55z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
          </svg>
          <span class="n">{$starred.length}</span>
        </button>
      {/if}
      <button
        class="seg"
        type="button"
        aria-label={`Theme: ${$theme} — tap to change`}
        onclick={cycleTheme}
      >
        {#if $theme === 'light'}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
            <circle cx="8" cy="8" r="2.6" fill="currentColor" stroke="none" />
            <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
          </svg>
        {:else if $theme === 'dark'}
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <!-- ink centered: the crescent's bounding box sits 2.4 right of
                 the viewBox centre (measured), so pull it back -->
            <path d="M11 2.5a5.5 5.5 0 1 0 4.5 8.4 4.5 4.5 0 0 1-4.5-8.4z" transform="translate(-2.4 0)" />
          </svg>
        {:else}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <circle cx="8" cy="8" r="5.4" />
            <path d="M8 2.6a5.4 5.4 0 0 0 0 10.8z" fill="currentColor" stroke="none" />
          </svg>
        {/if}
      </button>
      <button class="seg" type="button" aria-label="Back to top" onclick={backToTop}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M8 13V3.4M4.2 7L8 3.2 11.8 7" />
        </svg>
      </button>
    </div>
  {/if}
  <button
    class="trigger"
    type="button"
    aria-expanded={open}
    aria-label="Quick actions"
    onclick={() => togglePopover(DOCK_ID)}
  >
    {#if open}
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true">
        <path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" />
      </svg>
    {:else}
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <circle cx="8" cy="3.2" r="1.15" /><circle cx="8" cy="8" r="1.15" /><circle cx="8" cy="12.8" r="1.15" />
      </svg>
    {/if}
  </button>
</div>

<style>
  /* fade on the container, not the trigger — the open capsule must vanish
     with the dock when the reader returns to the top */
  .dock {
    display: none;
    position: fixed;
    bottom: 18px;
    inset-inline-end: 16px;
    z-index: 70;
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition:
      opacity 0.3s ease,
      transform 0.3s var(--ease-out);
  }
  .dock.on {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface-stickybar);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: var(--gold-ink);
    cursor: pointer;
    transition:
      color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out);
    box-shadow: 0 10px 24px -14px rgba(31, 26, 20, 0.4);
  }
  .trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .trigger[aria-expanded='true'] {
    color: var(--accent);
    border-color: var(--gold);
  }
  .trigger svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  /* the capsule grows upward out of the trigger: one continuous pill,
     hairline dividers between segments */
  .cap {
    position: absolute;
    bottom: calc(100% + 8px);
    inset-inline-end: 0;
    width: 40px;
    display: flex;
    flex-direction: column;
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 999px;
    box-shadow:
      var(--paper-edge),
      0 16px 32px -16px rgba(31, 26, 20, 0.45);
    padding: 5px 0;
    animation: cap-in 0.22s var(--ease-out);
    transform-origin: bottom center;
  }
  @keyframes cap-in {
    from {
      opacity: 0;
      transform: translateY(10px) scaleY(0.85);
    }
  }
  .seg {
    position: relative;
    height: 40px;
    display: grid;
    place-items: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--gold-ink);
    transition: color var(--dur-hover) var(--ease-out);
  }
  .seg + .seg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10px;
    right: 10px;
    border-top: 1px solid var(--line-soft);
  }
  .seg:hover {
    color: var(--accent);
  }
  .seg:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    border-radius: 999px;
  }
  .seg svg {
    width: 15px;
    height: 15px;
    display: block;
  }
  .seg .n {
    position: absolute;
    top: 3px;
    inset-inline-end: 6px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 9px;
    color: var(--ink-mute);
  }
  .seg[aria-pressed='true'] {
    color: var(--accent);
  }
  .seg[aria-pressed='true'] .star-p {
    fill: currentColor;
  }
  .seg[aria-pressed='true'] .n {
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .dock {
      display: block;
    }
  }
</style>
