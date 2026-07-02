<script lang="ts">
  import { onMount } from 'svelte';
  import SlotPicker from './SlotPicker.svelte';
  import ViewToggle from './ViewToggle.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import { tone, speakerGender, addresseeGender } from '../../lib/stores';
  import { scrolled, initScrollListener } from '../../lib/scroll';
  import { toneOptions, speakerOptions, addresseeOptions } from '../../lib/slot-options';
  import type { ToneFilter, GenderFilter } from '../../lib/filter';
  import ui from '../../content/ui/en.json';

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
    <span class="punct">—</span>
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
  <div class="sb-controls">
    <ViewToggle />
    <ThemeToggle />
  </div>
</div>

<!-- Mobile's route back to the seal: ≤820 hides the bar's mark (the desktop
     back-to-top), so a quiet paper button takes over, thumb-side. -->
<button class="back-top" class:on={$scrolled} onclick={backToTop} aria-label="Back to top">
  ↑
</button>

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
    /* The full sentence collides with the right-side controls on narrow
     * screens — fall back to "I write — [tone]"; the complete slots stay
     * available in the Stationery. */
    .sb-ext {
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
  @media (max-width: 640px) {
    .sticky-bar {
      padding: 10px 14px;
    }
    /* one line, always: only "I write — [tone]" + the theme toggle remain
       at this width (ViewToggle hides <640), and a two-line bar ate a
       quarter of a phone screen */
    .sb-prose {
      font-size: 13px;
      gap: 4px;
    }
  }
</style>
