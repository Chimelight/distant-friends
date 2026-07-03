<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { selectedLangs, anchor, MAX_LANGS, markFreshLang } from '../../lib/stores';
  import { openPopover, togglePopover, popover } from '../../lib/popover';
  import { LANG_BY_CODE, langsByCodes, langTag } from '../../lib/lang';
  import ui from '../../content/ui/en.json';
  import LangMenu from './LangMenu.svelte';

  const PICKER_ID = 'stationery-langs';

  let fullPulse = $state(false);
  let pulseTimer: number | undefined;
  onMount(() => () => clearTimeout(pulseTimer));

  const open = $derived($openPopover === PICKER_ID);
  let pickerEl = $state<HTMLElement>();

  // Keyboard activation (click detail 0) drops focus straight into search.
  async function onTriggerClick(e: MouseEvent) {
    togglePopover(PICKER_ID);
    if (openPopover.get() === PICKER_ID && e.detail === 0) {
      await tick();
      pickerEl?.querySelector<HTMLElement>('.lm-search')?.focus();
    }
  }
  const selected = $derived(new Set($selectedLangs ?? []));
  const count = $derived(selected.size);
  const isFull = $derived(count >= MAX_LANGS);
  // Anchor first, then the selection in its own order — the resting line
  // mirrors the table's column order exactly.
  const restingLangs = $derived(
    langsByCodes([$anchor, ...($selectedLangs ?? []).filter((c) => c !== $anchor)]),
  );

  // Screen-reader announcements for outcomes the panel only shows visually
  // (cap reached, anchor not removable). Alternates a trailing NBSP so the
  // same message re-announces on a repeated attempt.
  let announce = $state('');
  let nbsp = false;
  function say(msg: string) {
    nbsp = !nbsp;
    announce = msg + (nbsp ? '\u00A0' : '');
  }

  function toggle(code: string) {
    const cur = selectedLangs.get() ?? [];
    const name = LANG_BY_CODE.get(code)?.name ?? code;
    if (cur.includes(code)) {
      // The anchor must stay (it's a column); never drop the last language.
      if (code === anchor.get() || cur.length <= 1) {
        say(`${name} ${ui.stationery.langsAnchorLocked}`);
        return;
      }
      selectedLangs.set(cur.filter((c) => c !== code));
    } else {
      if (cur.length >= MAX_LANGS) {
        fullPulse = true;
        clearTimeout(pulseTimer);
        pulseTimer = window.setTimeout(() => (fullPulse = false), 1400);
        say(`${name}: ${ui.stationery.capHint} — ${ui.stationery.langsFull}`);
        return;
      }
      selectedLangs.set([...cur, code]); // append: new column lands last
      markFreshLang(code);
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
  <span class="picker" use:popover={PICKER_ID} bind:this={pickerEl}>
    <button
      class="trigger"
      type="button"
      aria-expanded={open}
      aria-label={`${ui.stationery.langsChoose} (${count} of ${MAX_LANGS})`}
      onclick={onTriggerClick}
    >
      <span class="names">
        <!-- name+dot are one unbreakable unit and units are joined by
             zero-width spaces: lines may end with a separator dot but can
             never start with one (mobile used to wrap as "·Deutsch"). -->
        {#each restingLangs as L, i (L.code)}<span class="unit"><span
              class="n"
              class:anchor={L.code === $anchor}
              lang={langTag(L)}
              dir={L.rtl ? 'rtl' : 'ltr'}>{L.native}</span
            >{#if i < restingLangs.length - 1}<span class="dot" aria-hidden="true"> · </span>{/if}</span
          >{#if i < restingLangs.length - 1}{'\u200B'}{/if}{/each}
      </span>
    </button>

    {#if open}
      <div class="panel" role="group" aria-label={ui.stationery.langsChoose}>
        <div class="panel-head" class:pulse={fullPulse}>
          <span class="ph-label">{ui.stationery.langsLabel}</span>
          <span class="ph-count">{count} / {MAX_LANGS}</span>
          <span class="ph-hint">{isFull ? ui.stationery.langsFull : ui.stationery.capHint}</span>
        </div>

        <LangMenu marked={selected} anchorCode={$anchor} onPick={toggle} />

        <div class="panel-foot">
          <button type="button" class="clear" disabled={count <= 1} onclick={clearToAnchor}>
            {ui.stationery.langsClear}
          </button>
        </div>
      </div>
    {/if}
  </span>
  <!-- bare aria-live (not role="status"): the global Toast owns that role -->
  <span class="sr-only" aria-live="polite">{announce}</span>
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
    /* dashed underline, deliberately — wavy tried and reverted, see .slot */
    border-bottom: 1px dashed var(--ink-mute);
    padding: 1px 6px 2px;
    margin: 0 2px;
    color: var(--accent);
    cursor: pointer;
    font-style: italic;
    transition: all var(--dur-switch) ease;
  }
  .trigger::after {
    /* WORD JOINER glues the caret to the last language name — an atomic
       inline (inline-block) would reopen the break and let ▾ orphan onto
       its own line on mobile. */
    content: '\2060▾';
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
  .names .unit {
    white-space: nowrap;
  }
  /* native names upright inside the italic line — synthetic italic mangles CJK.
     Local serifs only: these sit above the fold on first paint, and a late
     Noto/Cyrillic subset arrival used to rewrap the line and shove everything
     below it (the page's whole CLS). They are control labels, not phrase
     content — the system serif is the same songti/mincho genre. */
  .names .n {
    font-style: normal;
    font-family: var(--font-serif-local);
  }
  /* the anchor, highlighted in the list rather than read as a redundant repeat */
  .names .n.anchor {
    color: var(--accent);
  }
  .names .dot {
    color: var(--ink-mute);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* —— popover panel (mounted only while open) —— */
  .panel {
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: min(440px, calc(100vw - 28px));
    max-height: min(64vh, 480px);
    overflow-y: auto;
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 0 16px 14px;
    z-index: 60;
    box-shadow:
      var(--paper-edge),
      0 20px 48px -24px rgba(31, 26, 20, 0.4),
      0 0 0 1px var(--line-soft);
    text-align: left;
    animation: panel-in 0.2s ease;
  }
  @keyframes panel-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-4px);
    }
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

  /* Sticky within the scrollable panel, so the count + "remove one to add
     another" hint stay visible (and the pulse lands in view) however far
     the list is scrolled. */
  .panel-head {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--paper-up);
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-top: 14px;
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
