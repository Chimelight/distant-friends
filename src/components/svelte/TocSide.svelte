<script lang="ts">
  import { onMount } from 'svelte';
  import scenes from '../../data/scenes.json';
  import { activeScene, initScrollListener } from '../../lib/scroll';

  const TOC_IDLE_MS = 1400;
  const TOC_HOVER_RELEASE_MS = 400;

  let expanded = $state(false);
  let hovered = $state(false);
  let tocEl: HTMLElement | undefined = $state();

  let idleTimer: number | undefined;
  let releaseTimer: number | undefined;

  function clearAll() {
    clearTimeout(idleTimer);
    clearTimeout(releaseTimer);
  }

  function poke() {
    expanded = true;
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!hovered) expanded = false;
    }, TOC_IDLE_MS);
  }

  function onEnter() {
    hovered = true;
    clearAll();
    expanded = true;
  }
  function onLeave() {
    hovered = false;
    clearAll();
    releaseTimer = window.setTimeout(() => (expanded = false), TOC_HOVER_RELEASE_MS);
  }
  function onFocusIn() {
    hovered = true;
    clearAll();
    expanded = true;
  }
  function onFocusOut(e: FocusEvent) {
    if (tocEl && tocEl.contains(e.relatedTarget as Node)) return;
    hovered = false;
    clearAll();
    releaseTimer = window.setTimeout(() => (expanded = false), TOC_HOVER_RELEASE_MS);
  }

  function jumpTo(id: string) {
    // Both PhraseTable and PhraseCards render scene blocks with the same ID
    // but only the active view is visible (the other has display:none).
    // Pick the visible one via offsetParent — null when any ancestor is
    // hidden — and use the data-scene attribute to avoid the duplicate-ID
    // collision that getElementById would hit.
    const all = document.querySelectorAll<HTMLElement>(`[data-scene="${id}"]`);
    for (const el of all) {
      if (el.offsetParent !== null) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }

  onMount(() => {
    const stopScroll = initScrollListener('.scene-block');
    const onWindowScroll = () => poke();
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => {
      stopScroll();
      window.removeEventListener('scroll', onWindowScroll);
      clearAll();
    };
  });
</script>

<nav
  class="toc"
  class:on={expanded}
  bind:this={tocEl}
  onmouseenter={onEnter}
  onmouseleave={onLeave}
  onfocusin={onFocusIn}
  onfocusout={onFocusOut}
  aria-label="Table of Contents"
>
  {#each scenes as S (S.id)}
    <button
      type="button"
      class="toc-item"
      class:active={$activeScene === S.id}
      data-scene-id={S.id}
      onclick={() => jumpTo(S.id)}
    >
      <span class="num">{S.num.replace('No. ', '')}</span>
      <span class="ttl">{S.title}</span>
    </button>
  {/each}
  <span class="toc-fleuron-bottom" aria-hidden="true">❋</span>
</nav>

<style>
  /* Layout always applies; visibility is gated separately by view + viewport
   * so we can show in cards OR table as long as the rail has room. */
  .toc {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    flex-direction: column;
    padding: 32px 28px 32px 30px;
    width: fit-content;
    max-width: 240px;
    right: 24px;
    pointer-events: auto;
    background: rgba(250, 244, 227, 0);
    border-radius: 2px;
    box-shadow:
      0 0 0 1px rgba(212, 198, 168, 0),
      0 24px 60px -32px rgba(138, 98, 67, 0);
    transition:
      background var(--dur-reveal) ease,
      box-shadow 0.5s ease,
      padding 0.4s var(--ease-spring);
    display: none;
  }

  /* Cards view: rail tolerated as low as ~tablet/phone-landscape because
   * cards stay 720 max-width centered, leaving right whitespace for the rail. */
  @media (min-width: 640px) {
    :global(body[data-view="cards"].scrolled) .toc {
      display: flex;
    }
  }

  /* Table view: needs more horizontal room — at narrow widths the rail
   * would visually crowd the right-most translation column. */
  @media (min-width: 1024px) {
    :global(body[data-view="table"].scrolled) .toc {
      display: flex;
    }
  }

  /* Expanded — barely-there parchment whisper, no glass. */
  .toc.on {
    background: var(--surface-toc-panel);
    box-shadow:
      0 0 0 1px var(--surface-toc-border),
      var(--shadow-toc-panel);
  }

  /* Vertical rail centered in the gap between titles and numerals.
   * Calculation: numeral width 22 + gap 16 = 38 of horizontal "right column";
   * with toc padding-right 28, gap center sits 28 + 22 + 8 = 58 from toc edge. */
  .toc::before {
    content: "";
    position: absolute;
    right: 58px;
    top: 44px;
    bottom: 44px;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--gold) 16%,
      var(--line) 50%,
      var(--gold) 84%,
      transparent 100%
    );
    opacity: 0.35;
    transition: opacity 0.4s ease;
  }
  .toc.on::before {
    opacity: 0.6;
  }

  /* Top fleuron at the top of the rail */
  .toc::after {
    content: "❋";
    position: absolute;
    right: 58px;
    top: 20px;
    transform: translateX(50%);
    font-family: var(--font-serif);
    font-size: 10px;
    color: var(--gold);
    opacity: 0;
    transition: opacity 0.4s ease 0.1s;
    line-height: 1;
  }
  .toc.on::after {
    opacity: 0.75;
  }

  .toc-fleuron-bottom {
    position: absolute;
    right: 58px;
    bottom: 20px;
    transform: translateX(50%);
    font-family: var(--font-serif);
    font-size: 10px;
    color: var(--gold);
    opacity: 0;
    transition: opacity 0.4s ease 0.1s;
    line-height: 1;
    pointer-events: none;
  }
  .toc.on .toc-fleuron-bottom {
    opacity: 0.75;
  }

  .toc-item {
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    gap: 16px;
    font-family: var(--font-serif);
    color: var(--ink-mute);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: right;
    padding: 7px 0;
    position: relative;
    min-height: 32px;
    transition: color var(--dur-switch) ease;
  }
  .toc-item + .toc-item {
    margin-top: 2px;
  }

  .toc-item .num {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-variation-settings: "opsz" 48, "SOFT" 100;
    color: var(--gold);
    font-size: 14px;
    letter-spacing: 0.08em;
    line-height: 1;
    width: 22px;
    text-align: center;
    flex-shrink: 0;
    opacity: 0.8;
    transition:
      opacity 0.3s ease,
      color var(--dur-switch) ease;
    position: relative;
    z-index: 2;
  }

  .toc-item .ttl {
    font-style: italic;
    font-weight: 350;
    font-size: 14px;
    line-height: 1.35;
    letter-spacing: 0.005em;
    color: var(--ink-soft);
    opacity: 0;
    transform: translateX(10px);
    transition:
      opacity 0.35s ease,
      transform 0.45s var(--ease-out),
      color var(--dur-switch) ease,
      font-weight var(--dur-switch) ease;
    white-space: nowrap;
    pointer-events: none;
  }
  .toc.on .toc-item .ttl {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  /* Stagger scene-name reveal when panel expands. */
  .toc.on .toc-item:nth-child(1) .ttl { transition-delay: 0.04s; }
  .toc.on .toc-item:nth-child(2) .ttl { transition-delay: 0.08s; }
  .toc.on .toc-item:nth-child(3) .ttl { transition-delay: 0.12s; }
  .toc.on .toc-item:nth-child(4) .ttl { transition-delay: 0.16s; }
  .toc.on .toc-item:nth-child(5) .ttl { transition-delay: 0.20s; }
  .toc.on .toc-item:nth-child(6) .ttl { transition-delay: 0.24s; }

  .toc-item.active .num {
    color: var(--accent);
    opacity: 1;
  }
  .toc-item.active .ttl {
    color: var(--accent);
    font-weight: 500;
  }
  .toc-item.active::before {
    content: "";
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 1px;
    background: var(--accent);
    transition: width 0.3s ease 0.1s;
  }
  .toc.on .toc-item.active::before {
    width: 8px;
  }

  .toc.on .toc-item:hover {
    color: var(--accent);
  }
  .toc.on .toc-item:hover .num {
    color: var(--accent);
    opacity: 1;
  }
  .toc.on .toc-item:hover .ttl {
    color: var(--ink);
  }

  .toc-item:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    border-radius: 2px;
  }

</style>
