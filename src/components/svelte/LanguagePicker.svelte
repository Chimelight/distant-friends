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

  const allLangs = languages as TLanguage[];

  // Mizo's `code` ("mizo") is not a valid BCP-47 subtag; tag it ISO 639-3 "lus".
  const bcp47 = (code: string) => (code === 'mizo' ? 'lus' : code);

  // Region buckets, in display order. Each language carries its `group`.
  const GROUP_ORDER = [
    'East Asia',
    'Europe',
    'West & Central Asia',
    'South Asia',
    'Southeast Asia',
  ];
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    langs: allLangs.filter((l) => l.group === group),
  }));

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
</script>

<div class="lang-line">
  <em>{ui.stationery.langsLead}</em>
  <!-- Wrapper (not a button) keeps the trigger and the option buttons as
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
            lang={bcp47(L.code)}
            dir={L.rtl ? 'rtl' : 'ltr'}>{L.native}</span
          >{#if i < restingLangs.length - 1}<span class="dot" aria-hidden="true"
            > · </span
          >{/if}{/each}
      </span>
    </button>

    <div class="panel" class:open role="group" aria-label={ui.stationery.langsChoose}>
      <div class="panel-head" class:pulse={fullPulse}>
        <span class="ph-label">{ui.stationery.langsLabel}</span>
        <span class="ph-count">{count} / {MAX_LANGS}</span>
        <span class="ph-hint">{isFull ? ui.stationery.langsFull : ui.stationery.capHint}</span>
      </div>
      {#each grouped as g (g.group)}
        <div class="grp">
          <div class="grp-h">{g.group}</div>
          <div class="grp-opts">
            {#each g.langs as L (L.code)}
              {@const on = selected.has(L.code)}
              {@const isAnchor = L.code === $anchor}
              <button
                type="button"
                class="opt"
                class:on
                class:is-anchor={isAnchor}
                aria-pressed={on}
                tabindex={open ? 0 : -1}
                aria-label={`${L.name}${on ? ', showing' : ''}${isAnchor ? ', anchor' : ''}`}
                onclick={(e) => {
                  e.stopPropagation();
                  toggle(L.code);
                }}
              >
                <span class="mark" aria-hidden="true"></span>
                <span class="opt-native" lang={bcp47(L.code)} dir={L.rtl ? 'rtl' : 'ltr'}>{L.native}</span>
                {#if L.name !== L.native}
                  <span class="opt-en">{L.name}</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </span>
</div>

<style>
  /* Reads as the first line of the letter — matches Stationery .prose. */
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
  .trigger:hover {
    background: rgba(176, 82, 46, 0.08);
    border-bottom-color: var(--accent);
  }
  .trigger:hover::after {
    opacity: 1;
    color: var(--accent);
  }
  .trigger:focus-visible {
    outline: none;
    background: rgba(176, 82, 46, 0.1);
    border-bottom-style: solid;
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
    max-width: min(420px, calc(100vw - 32px));
    max-height: min(60vh, 460px);
    overflow-y: auto;
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 14px 16px 16px;
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
    margin-bottom: 8px;
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

  .grp + .grp {
    margin-top: 10px;
  }
  .grp-h {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-mute);
    margin-bottom: 5px;
  }
  .grp-opts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
  }

  .opt {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 10px 5px 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    font-family: var(--font-serif);
    color: var(--ink-soft);
    transition: all 0.15s ease;
  }
  .opt .mark {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1px solid var(--ink-mute);
    flex-shrink: 0;
    align-self: center;
    transition: all 0.15s ease;
  }
  .opt-native {
    font-size: 15px;
    font-style: italic;
  }
  .opt-en {
    font-family: var(--font-sans);
    font-size: 10.5px;
    color: var(--ink-mute);
    letter-spacing: 0.01em;
  }
  .opt:hover {
    background: rgba(176, 82, 46, 0.07);
    color: var(--ink);
  }
  .opt:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .opt.on {
    border-color: var(--line);
    color: var(--ink);
  }
  .opt.on .mark {
    background: var(--gold);
    border-color: var(--gold);
  }
  .opt.is-anchor .mark {
    background: var(--accent);
    border-color: var(--accent);
  }
  .opt.is-anchor .opt-native {
    color: var(--accent);
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
