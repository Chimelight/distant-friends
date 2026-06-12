<script lang="ts">
  import { starred, starredOnly } from '../../lib/stores';
  import ui from '../../content/ui/en.json';

  // If the last star is removed while the filter is on, lift the filter —
  // otherwise the page silently empties.
  $effect(() => {
    if ($starred.length === 0 && $starredOnly) starredOnly.set(false);
  });
</script>

{#if $starred.length > 0}
  <div class="star-filter">
    <button
      class="chip"
      type="button"
      aria-pressed={$starredOnly}
      onclick={() => starredOnly.set(!$starredOnly)}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1.8l1.86 3.92 4.14.55-3.04 2.98.76 4.27L8 11.46l-3.72 2.04.76-4.27L2 6.27l4.14-.55z"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </svg>
      {ui.filters.starredOnly}
      <span class="count">{$starred.length}</span>
    </button>
  </div>
{/if}

<style>
  .star-filter {
    margin: 14px 0 0;
    animation: rise var(--dur-reveal) var(--ease-out) both;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px 5px 11px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--ink-soft);
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    letter-spacing: 0.015em;
    cursor: pointer;
    transition:
      color var(--dur-hover) var(--ease-out),
      border-color var(--dur-hover) var(--ease-out),
      background var(--dur-hover) var(--ease-out);
  }
  .chip svg {
    width: 12px;
    height: 12px;
    color: var(--gold);
  }
  .chip:hover {
    border-color: var(--gold);
    color: var(--ink);
  }
  .chip:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .chip[aria-pressed='true'] {
    background: rgba(166, 130, 74, 0.12);
    border-color: var(--gold);
    color: var(--ink);
  }
  .count {
    font-family: var(--font-sans);
    font-style: normal;
    font-size: 10px;
    color: var(--ink-mute);
    letter-spacing: 0.04em;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
