<script lang="ts">
  import { onMount } from 'svelte';
  import {
    selectedLangs,
    anchor,
    ensureSelectedLangsInitialized,
    MAX_LANGS,
  } from '../../lib/stores';
  import languages from '../../data/languages.json';
  import ui from '../../content/ui/en.json';

  let shakingCode = $state<string | null>(null);
  let capHintOn = $state(false);
  let shakeTimer: number | undefined;
  let capTimer: number | undefined;

  onMount(() => {
    ensureSelectedLangsInitialized();
  });

  function selectedSet(): Set<string> {
    return new Set(selectedLangs.get() ?? []);
  }

  function toggle(code: string) {
    if (code === anchor.get()) return;
    const set = selectedSet();
    if (set.has(code)) {
      if (set.size <= 1) return;
      set.delete(code);
      selectedLangs.set([...set]);
    } else {
      if (set.size >= MAX_LANGS) {
        shakingCode = code;
        clearTimeout(shakeTimer);
        shakeTimer = window.setTimeout(() => (shakingCode = null), 500);
        capHintOn = true;
        clearTimeout(capTimer);
        capTimer = window.setTimeout(() => (capHintOn = false), 1800);
        return;
      }
      set.add(code);
      selectedLangs.set([...set]);
    }
  }
</script>

<div class="lang-row">
  <span class="row-lbl">{ui.stationery.langsLabel}</span>
  <div class="chips">
    {#each languages as L (L.code)}
      {@const isAnchor = L.code === $anchor}
      {@const isSelected = ($selectedLangs ?? []).includes(L.code)}
      <button
        type="button"
        class="chip"
        class:anchored={isAnchor}
        class:shake={shakingCode === L.code}
        aria-pressed={isSelected || isAnchor}
        onclick={() => toggle(L.code)}
      >
        {L.native}
      </button>
    {/each}
  </div>
  <span class="cap-hint" class:on={capHintOn}>{ui.stationery.capHint}</span>
</div>

<style>
  .lang-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px 14px;
    margin-bottom: 44px;
  }
  .row-lbl {
    font-family: var(--font-sans);
    font-size: 10.5px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--ink-mute);
    margin-right: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .chip {
    font-family: var(--font-serif);
    font-size: 15px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink-soft);
    border-radius: 999px;
    cursor: pointer;
    transition: all var(--dur-switch) ease;
    letter-spacing: 0.005em;
    user-select: none;
  }
  .chip:hover {
    border-color: var(--accent-soft);
    color: var(--ink);
  }
  .chip[aria-pressed="true"] {
    background: var(--ink);
    color: var(--paper-up);
    border-color: var(--ink);
    font-style: italic;
  }
  .chip.anchored {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
    font-style: italic;
  }
  .chip:active {
    transform: scale(0.97);
  }
  .chip.shake {
    animation: shake 0.45s ease;
  }
  .cap-hint {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    color: var(--ink-mute);
    margin-left: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
    white-space: nowrap;
  }
  .cap-hint.on {
    opacity: 1;
  }
</style>
