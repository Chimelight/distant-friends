<script lang="ts">
  import { onMount, tick } from 'svelte';
  import SlotPicker from './SlotPicker.svelte';
  import ViewToggle from './ViewToggle.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import BookmarkDock from './BookmarkDock.svelte';
  import { tone, speakerGender, addresseeGender, starred, starredOnly } from '../../lib/stores';
  import { scrolled, activeScene, initScrollListener, jumpToScene } from '../../lib/scroll';
  import { openPopover, togglePopover, closePopover, popover, menuKeys } from '../../lib/popover';
  import { toneOptions, speakerOptions, addresseeOptions } from '../../lib/slot-options';
  import type { ToneFilter, GenderFilter } from '../../lib/filter';
  import scenes from '../../data/scenes.json';
  import ui from '../../content/ui/en.json';

  // Nº indicator (mobile): reads the scene being read, opens the scene menu.
  const NO_ID = 'stickybar-scenes';
  const noOpen = $derived($openPopover === NO_ID);
  let noEl = $state<HTMLElement>();
  const activeRoman = $derived(
    ((scenes.find((s) => s.id === $activeScene) ?? scenes[0])?.num ?? 'No. I').replace('No. ', ''),
  );
  // Keyboard activation drops focus onto the current scene's item.
  async function onNoClick(e: MouseEvent) {
    togglePopover(NO_ID);
    if (openPopover.get() === NO_ID && e.detail === 0) {
      await tick();
      (noEl?.querySelector<HTMLElement>('.sb-toc-item.cur') ??
        noEl?.querySelector<HTMLElement>('.sb-toc-item'))?.focus();
    }
  }
  function pickScene(id: string) {
    jumpToScene(id);
    closePopover();
  }

  function setTone(t: ToneFilter) {
    tone.set(t);
  }
  function setSpeaker(g: GenderFilter) {
    speakerGender.set(g);
  }
  function setAddressee(g: GenderFilter) {
    addresseeGender.set(g);
  }
  function backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMount(() => {
    return initScrollListener('.scene-block');
  });
</script>

<div class="sticky-bar" class:on={$scrolled} role="region" aria-label="Quick controls">
  <button class="sb-mark" onclick={backToTop} title="Back to top">致 · 远 · 方</button>
  <span class="sb-sep" aria-hidden="true"></span>
  <div class="sb-prose">
    <em>{ui.stationery.iWrite}</em>
    <!-- .dash: dropped on narrow screens, same as the Stationery's pair -->
    <span class="punct dash">—</span>
    <SlotPicker
      name="tone"
      options={toneOptions}
      value={$tone}
      onChange={setTone}
    />
    <span class="sb-ext">
      <span class="punct">—</span>
      <em>{ui.stationery.to}</em>
      <SlotPicker
        name="addressee"
        options={addresseeOptions}
        value={$addresseeGender}
        onChange={setAddressee}
      />
      <span class="punct">,</span>
      <em>{ui.stationery.asWord}</em>
      <SlotPicker
        name="speaker"
        options={speakerOptions}
        value={$speakerGender}
        onChange={setSpeaker}
      />
    </span>
  </div>
  <!-- mobile-only (≤640): current-scene indicator doubling as the scene
       menu — the narrow bar's replacement for TocSide -->
  <span class="sb-no-wrap" use:popover={NO_ID} bind:this={noEl}>
    <button
      class="sb-no"
      type="button"
      aria-haspopup="menu"
      aria-expanded={noOpen}
      aria-label={`Scenes — reading Nº ${activeRoman}`}
      onclick={onNoClick}
    >
      Nº {activeRoman}<span class="sb-no-caret" aria-hidden="true">▾</span>
    </button>
    {#if noOpen}
      <div class="sb-toc" role="menu" aria-label="Scenes" use:menuKeys>
        {#each scenes as S (S.id)}
          <button
            type="button"
            role="menuitem"
            class="sb-toc-item"
            class:cur={S.id === $activeScene}
            onclick={() => pickScene(S.id)}
          >
            <i>{S.num.replace('No. ', '')}.</i><span>{S.title}</span>
          </button>
        {/each}
      </div>
    {/if}
  </span>
  <div class="sb-controls">
    {#if $starred.length > 0}
      <!-- the "Starred only" filter's only entry (≥640; the BookmarkDock
           carries it below) — starring happens mid-scroll, so the filter
           rides the toolbar -->
      <button
        class="sb-star"
        type="button"
        aria-pressed={$starredOnly}
        aria-label={`${ui.filters.starredOnly} (${$starred.length})`}
        onclick={() => starredOnly.set(!$starredOnly)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.8l1.86 3.92 4.14.55-3.04 2.98.76 4.27L8 11.46l-3.72 2.04.76-4.27L2 6.27l4.14-.55z"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
        <span class="sb-star-n">{$starred.length}</span>
      </button>
    {/if}
    <ViewToggle />
    <ThemeToggle />
  </div>
</div>

<!-- Mobile's route back to the seal: ≤820 hides the bar's mark (the desktop
     back-to-top), so a quiet paper button takes over, thumb-side. At ≤640
     the BookmarkDock capsule absorbs it (back-to-top is its last segment). -->
<button class="back-top" class:on={$scrolled} onclick={backToTop} aria-label="Back to top">
  ↑
</button>
<BookmarkDock />

<style>
  .sticky-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 80;
    background: var(--surface-stickybar);
    backdrop-filter: saturate(1.2) blur(14px);
    -webkit-backdrop-filter: saturate(1.2) blur(14px);
    border-bottom: 1px solid var(--line);
    padding: 10px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    opacity: 0;
    transform: translateY(-100%);
    transition:
      opacity 0.32s ease,
      transform 0.32s var(--ease-out);
    pointer-events: none;
    overflow: visible;
  }
  .sticky-bar.on {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .sticky-bar::after {
    content: "";
    position: absolute;
    inset: 0 0 -12px 0;
    background: linear-gradient(
      to bottom,
      rgba(31, 26, 20, 0.06),
      transparent
    );
    pointer-events: none;
  }
  .sb-mark {
    font-family: var(--font-serif);
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.52em;
    color: var(--gold-ink);
    text-transform: uppercase;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 2px;
    flex-shrink: 0;
    transition: color 0.2s ease;
    white-space: nowrap;
  }
  .sb-mark:hover {
    color: var(--accent);
  }
  .sb-sep {
    width: 1px;
    height: 16px;
    background: var(--line);
    flex-shrink: 0;
  }
  .sb-prose {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 300;
    font-size: 15px;
    line-height: 1.4;
    color: var(--ink-soft);
    letter-spacing: 0.005em;
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: nowrap;
    white-space: nowrap;
  }
  .sb-prose em {
    font-style: italic;
  }
  .sb-prose .punct {
    color: var(--ink-mute);
  }
  /* display:contents keeps the children as direct flex items of the prose
   * row; the media query below can then drop the whole extension at once. */
  .sb-ext {
    display: contents;
  }

  /* —— Nº scene indicator + menu (mobile-only; desktop has TocSide) —— */
  .sb-no-wrap {
    display: none;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .sb-no {
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--gold-ink);
    padding: 4px 2px;
    white-space: nowrap;
    transition: color var(--dur-hover) var(--ease-out);
  }
  .sb-no:hover {
    color: var(--accent);
  }
  .sb-no:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .sb-no-caret {
    font-size: 8px;
    font-style: normal;
    color: var(--ink-mute);
    margin-left: 4px;
    vertical-align: middle;
  }
  .sb-toc {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 216px;
    max-height: min(60vh, 430px);
    overflow-y: auto;
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 7px 0;
    box-shadow:
      var(--paper-edge),
      0 18px 40px -20px rgba(31, 26, 20, 0.35),
      0 0 0 1px var(--line-soft);
    animation: sb-toc-in 0.2s ease;
  }
  @keyframes sb-toc-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }
  .sb-toc::before {
    content: '';
    position: absolute;
    top: -5px;
    right: 22px;
    width: 8px;
    height: 8px;
    background: var(--paper-up);
    transform: rotate(45deg);
    border-left: 1px solid var(--line);
    border-top: 1px solid var(--line);
  }
  .sb-toc-item {
    display: flex;
    align-items: baseline;
    gap: 10px;
    width: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 7px 16px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 14px;
    color: var(--ink-soft);
    transition: all 0.15s ease;
  }
  .sb-toc-item i {
    font-style: italic;
    font-size: 11.5px;
    color: var(--gold-ink);
    min-width: 2.4em;
    text-align: right;
    letter-spacing: 0.06em;
  }
  .sb-toc-item:hover {
    background: rgba(176, 82, 46, 0.08);
    color: var(--ink);
  }
  .sb-toc-item:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .sb-toc-item.cur,
  .sb-toc-item.cur i {
    color: var(--accent);
  }

  /* Right-anchored controls cluster — Theme + View toggles. Absolute so
   * the centered mark + prose composition isn't pulled off-axis by their
   * width. */
  .sb-controls {
    position: absolute;
    top: 50%;
    right: 24px;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .sb-star {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 4px;
    background: transparent;
    border: none;
    color: var(--gold-ink);
    cursor: pointer;
    transition: color var(--dur-hover) var(--ease-out);
  }
  .sb-star svg {
    width: 12px;
    height: 12px;
    color: var(--gold);
    fill: none;
    transition: fill var(--dur-hover) var(--ease-out);
  }
  .sb-star-n {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .sb-star:hover {
    color: var(--accent);
  }
  .sb-star:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .sb-star[aria-pressed='true'] {
    color: var(--accent);
  }
  .sb-star[aria-pressed='true'] svg {
    fill: currentColor;
    color: var(--accent);
  }
  .sticky-bar :global(.view-toggle) {
    background: transparent;
    border-color: var(--line-soft);
    flex-shrink: 0;
  }
  .sticky-bar :global(.view-toggle button) {
    font-size: 9px;
    padding: 0 10px;
    /* Match ThemeToggle's 22px button so the two pills align vertically. */
    height: 22px;
    color: var(--ink-mute);
    letter-spacing: 0.18em;
  }
  .sticky-bar :global(.view-toggle button[aria-pressed="true"]) {
    background: var(--ink);
    color: var(--paper-up);
  }

  .back-top {
    display: none;
    position: fixed;
    bottom: 18px;
    inset-inline-end: 16px;
    z-index: 70;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface-stickybar);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: var(--gold-ink);
    font-family: var(--font-serif);
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition:
      opacity 0.3s ease,
      transform 0.3s var(--ease-out);
    box-shadow: 0 10px 24px -14px rgba(31, 26, 20, 0.4);
  }
  .back-top:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  @media (max-width: 820px) {
    .back-top {
      display: flex;
    }
    .back-top.on {
      opacity: 1;
      transform: none;
      pointer-events: auto;
    }
  }

  @media (max-width: 820px) {
    .sb-mark,
    .sb-sep {
      display: none;
    }
    .sticky-bar {
      gap: 14px;
      padding: 10px 18px;
    }
    .sb-prose {
      font-size: 14px;
    }
    .sb-controls {
      right: 18px;
    }
  }
  /* The full sentence collides with the right-side controls in the tablet
   * band only — there it falls back to "I write — [tone]". At ≤640 the
   * controls leave the bar (BookmarkDock), so the sentence completes again. */
  @media (max-width: 820px) and (min-width: 641px) {
    .sb-ext {
      display: none;
    }
  }
  @media (max-width: 640px) {
    /* The bar becomes sentence + Nº: the full desktop sentence centered,
       the scene indicator pinned right; star and theme move to the
       BookmarkDock capsule, thumb-side. */
    .sticky-bar {
      padding: 10px 52px 10px 10px;
      justify-content: center;
      gap: 8px;
    }
    .sb-prose {
      font-size: 12.5px;
      gap: 3px;
    }
    .sb-star {
      display: none;
    }
    .sticky-bar :global(.theme-toggle) {
      display: none;
    }
    .sb-no-wrap {
      display: inline-block;
    }
  }
  @media (max-width: 640px) {
    .back-top {
      display: none; /* the BookmarkDock capsule carries back-to-top here */
    }
  }
</style>
