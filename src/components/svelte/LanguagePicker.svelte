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
  import type { TLanguage } from '../../lib/schema';
  import LangMenu from './LangMenu.svelte';

  const allLangs = languages as TLanguage[];
  const bcp47 = (code: string) => (code === 'mizo' ? 'lus' : code);

  let open = $state(false);
  let wrapEl = $state<HTMLElement>();
  let fullPulse = $state(false);
  let pulseTimer: number | undefined;

  onMount(() => {
    ensureSelectedLangsInitialized();
    const onDoc = (e: MouseEvent) => {
      if (wrapEl && !wrapEl.contains(e.target as Node)) open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open = false;
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
      clearTimeout(pulseTimer);
    };
  });

  const selected = $derived(new Set($selectedLangs ?? []));
  const count = $derived(selected.size);
  const isFull = $derived(count >= MAX_LANGS);
  const restingLangs = $derived(allLangs.filter((l) => selected.has(l.code)));

  function toggle(code: string) {
    const set = new Set(selectedLangs.get() ?? []);
    if (set.has(code)) {
      // The anchor must stay (it's a column); never drop the last language.
      if (code === anchor.get() || set.size <= 1) return;
      set.delete(code);
      selectedLangs.set([...set]);
    } else {
      if (set.size >= MAX_LANGS) {
        fullPulse = true;
        clearTimeout(pulseTimer);
        pulseTimer = window.setTimeout(() => (fullPulse = false), 1400);
        return;
      }
      set.add(code);
      selectedLangs.set([...set]);
    }
  }

  // Clear everything except the anchor (which must remain a column).
  function clearToAnchor() {
    selectedLangs.set([anchor.get()]);
  }
</script>

<div class="lang-line">
  <em>{ui.stationery.langsLead}</em>
  <!-- Wrapper (not a button) keeps the trigger and the menu buttons as
       siblings — no nested interactive controls. -->
  <span class="picker" bind:this={wrapEl}>
    <button
      class="trigger"
      type="button"
      aria-haspopup="true"
      aria-expanded={open}
      aria-label={`${ui.stationery.langsChoose} (${count} of ${MAX_LANGS})`}
      onclick={(e) => {
        e.stopPropagation();
        open = !open;
      }}
    >
      <span class="names">
        {#each restingLangs as L, i (L.code)}<span
            class="n"
            class:anchor={L.code === $anchor}
            lang={bcp47(L.code)}
            dir={L.rtl ? 'rtl' : 'ltr'}>{L.native}</span
          >{#if i < restingLangs.length - 1}<span class="dot" aria-hidden="true"> · </span>{/if}{/each}
      </span>
    </button>

    <div class="panel" class:open role="group" aria-label={ui.stationery.langsChoose}>
      <div class="panel-head" class:pulse={fullPulse}>
        <span class="ph-label">{ui.stationery.langsLabel}</span>
        <span class="ph-count">{count} / {MAX_LANGS}</span>
        <span class="ph-hint">{isFull ? ui.stationery.langsFull : ui.stationery.capHint}</span>
      </div>

      <LangMenu langs={allLangs} marked={selected} anchorCode={$anchor} {open} onPick={toggle} />

      <div class="panel-foot">
        <button
          type="button"
          class="clear"
          tabindex={open ? 0 : -1}
          disabled={count <= 1}
          onclick={(e) => {
            e.stopPropagation();
            clearToAnchor();
          }}
        >
          {ui.stationery.langsClear}
        </button>
      </div>
    </div>
  </span>
</div>

<style>
  /* Reads as the first line of the letter — matches Stationery .prose.
     Shown in both views: the resting line is the primary manager; table
     headers offer a quick per-column switch on top of it. */
  .lang-line {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 300;
    font-size: clamp(19px, 2.2vw, 26px);
    line-height: 1.7;
    margin: 0 0 6px;
    color: var(--ink-soft);
    letter-spacing: 0.005em;
  }

  .picker {
    position: relative;
    display: inline-block;
  }

  /* The trigger borrows the SlotPicker "slot" look: accent text, dashed
     underline, a ▾ caret. */
  .trigger {
    font: inherit;
    background: transparent;
    border: none;
    border-bottom: 1px dashed var(--ink-mute);
    padding: 1px 6px 2px;
    margin: 0 2px;
    color: var(--accent);
    cursor: pointer;
    font-style: italic;
    transition: all var(--dur-switch) ease;
  }
  .trigger::after {
    content: '▾';
    font-size: 0.55em;
    margin-left: 6px;
    color: var(--ink-mute);
    opacity: 0.5;
    font-style: normal;
    vertical-align: middle;
    transition: all var(--dur-switch) ease;
  }
  /* A lighter (paper-up) highlight, not a darkening tint — accent text stays
     above 4.5:1 (any darkening of the page bg drops it under AA). */
  .trigger:hover {
    background: var(--paper-up);
    border-bottom-color: var(--accent);
  }
  .trigger:hover::after {
    opacity: 1;
    color: var(--accent);
  }
  .trigger:focus-visible {
    outline: none;
    background: var(--paper-up);
    border-bottom-style: solid;
  }
  /* native names upright inside the italic line — synthetic italic mangles CJK */
  .names .n {
    font-style: normal;
  }
  /* the anchor, highlighted in the list rather than read as a redundant repeat */
  .names .n.anchor {
    color: var(--accent);
  }
  .names .dot {
    color: var(--ink-mute);
  }

  /* —— popover panel —— */
  .panel {
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) translateY(-4px);
    width: max-content;
    max-width: min(440px, calc(100vw - 28px));
    max-height: min(64vh, 480px);
    overflow-y: auto;
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 14px 16px 14px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      visibility 0.2s ease;
    z-index: 60;
    box-shadow:
      0 20px 48px -24px rgba(31, 26, 20, 0.4),
      0 0 0 1px var(--line-soft);
    text-align: left;
  }
  .panel.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
  }
  .panel::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    width: 8px;
    height: 8px;
    background: var(--paper-up);
    transform: translateX(-50%) rotate(45deg);
    border-left: 1px solid var(--line);
    border-top: 1px solid var(--line);
  }

  .panel-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--line-soft);
  }
  .ph-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  .ph-count {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .ph-hint {
    margin-left: auto;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 11.5px;
    color: var(--ink-mute);
  }
  .panel-head.pulse .ph-hint,
  .panel-head.pulse .ph-count {
    color: var(--accent);
    animation: nudge 0.4s ease;
  }

  .panel-foot {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--line-soft);
    display: flex;
    justify-content: flex-end;
  }
  .clear {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-mute);
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 5px 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .clear:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--accent);
  }
  .clear:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .clear:disabled {
    opacity: 0.4;
    cursor: default;
  }

  @keyframes nudge {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-2px);
    }
    75% {
      transform: translateX(2px);
    }
  }
</style>
