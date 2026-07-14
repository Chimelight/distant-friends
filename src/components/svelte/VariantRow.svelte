<script lang="ts">
  import { tone, speakerGender, addresseeGender, showToast } from '../../lib/stores';
  import { langTagOf } from '../../lib/lang';
  import { copyText } from '../../lib/clipboard';
  import SpeakButton from './SpeakButton.svelte';
  import type { TVariant } from '../../lib/schema';

  interface Props {
    variant: TVariant;
    langCode: string;
  }
  let { variant, langCode }: Props = $props();

  const TONE_LABELS: Record<string, string> = {
    casual: 'casually',
    neutral: 'evenly',
    polite: 'politely',
  };

  let copied = $state(false);
  let copiedTimer: number | undefined;

  // Tag line is passive disclosure: shows the variant's tone (only when the
  // tone slot is 'any', otherwise the slot itself already communicates it),
  // who-says, and to-whom hints. Addressee gender / count are surfaced here
  // because they no longer have a UI filter.
  const tagText = $derived.by(() => {
    const bits: string[] = [];
    if ($tone === 'any' && variant.tone && TONE_LABELS[variant.tone]) {
      bits.push(TONE_LABELS[variant.tone]);
    }
    if ($speakerGender === 'any') {
      if (variant.speakerGender === 'm') bits.push('he writes');
      if (variant.speakerGender === 'f') bits.push('she writes');
    }
    if ($addresseeGender === 'any') {
      if (variant.addresseeGender === 'f') bits.push('to a woman');
      if (variant.addresseeGender === 'm') bits.push('to a man');
    }
    if (variant.addresseeCount === 'many') bits.push('to everyone');
    return bits.join(' · ');
  });

  async function onClick() {
    const ok = await copyText(variant.text);
    if (!ok) return;
    copied = true;
    showToast(variant.text);
    clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => (copied = false), 1400);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }
</script>

<!-- Two plain grid columns: the copy button (text stack + copy mark) and
     the speaker. Nothing overlays anything — text wraps in its own column,
     the icons ride the entry's first line by ordinary flow. The copy mark
     lives inside the button (decorative span), so pressing it copies. -->
<div class="variant" class:copied>
  <button
    class="copy"
    type="button"
    aria-label={`Copy ${variant.text}`}
    onclick={onClick}
    onkeydown={onKey}
  >
    <span class="stack">
      <!-- langCode stays the dataset code (SpeakButton matches TTS voices on
           it); the lang attribute needs the valid BCP-47 tag. -->
      <span class="variant-text" lang={langTagOf(langCode)} dir="auto">
        <!-- inline span so the copied underline hugs the ink, not the cell -->
        <span class="ink-u">{variant.text}</span>
      </span>
      {#if variant.rom}
        <span class="variant-rom">{variant.rom}</span>
      {/if}
      <!-- one annotation voice: tag and note share a line and a register,
           instead of stacking two differently-styled rows -->
      {#if tagText || variant.note}
        <span class="variant-meta">
          {#if tagText}<span>{tagText}</span>{/if}
          {#if tagText && variant.note}<span class="meta-sep" aria-hidden="true"> · </span>{/if}
          {#if variant.note}<span>{variant.note}</span>{/if}
        </span>
      {/if}
    </span>
    <!-- copy affordance: an icon in the speaker's stroke language, not a
         text label (a label reads as its own button). Copied state swaps
         it for an accent check. -->
    <span class="copy-mark" aria-hidden="true">
      {#if copied}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3.2 8.6l3.2 3.2 6.4-7" />
        </svg>
      {:else}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round">
          <rect x="5.7" y="5.7" width="7.6" height="7.6" rx="1" />
          <path d="M10.4 2.8H4.1a1.3 1.3 0 0 0-1.3 1.3v6.3" stroke-linecap="round" />
        </svg>
      {/if}
    </span>
  </button>
  <span class="speak-slot">
    <SpeakButton text={variant.text} langCode={langCode} />
  </span>
</div>

<style>
  .variant {
    /* two ordinary columns: [copy button] [speaker]; the icons ride the
       entry's first line through flow alone (each icon box is exactly one
       entry line tall, contents centered) — no overlays, no reserves */
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    width: 100%;
    position: relative;
    transition: background 0.2s ease;
    --v-pad-block: 15px;
    --entry-size: calc(19px * var(--script-scale, 1));
    --entry-leading: 1.32;
    --entry-line: calc(var(--entry-size) * var(--entry-leading));
  }
  /* copied: a gold line draws itself under the ink, left to right (from the
     right in RTL text), then retracts when the copied state lapses */
  .ink-u {
    background-image: linear-gradient(
      90deg,
      var(--gold) 0%,
      var(--gold-ink) 55%,
      var(--gold) 100%
    );
    background-repeat: no-repeat;
    background-size: 0% 1px;
    background-position: bottom left;
    padding-bottom: 2px;
    transition: background-size 0.5s var(--ease-out);
  }
  .variant.copied .ink-u {
    background-size: 100% 1px;
  }
  .variant-text:dir(rtl) .ink-u {
    background-position: bottom right;
  }

  .copy {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 0 10px;
    padding-block: var(--v-pad-block);
    padding-inline: 22px 0;
    cursor: pointer;
    font-family: inherit;
    text-align: start;
    background: transparent;
    border: none;
    color: inherit;
  }
  .stack {
    display: block;
    min-width: 0;
  }
  /* a short tick between variants, not a full-width dashed rule — the
     stacked variants read as one cell with light punctuation, less grid */
  .variant + :global(.variant)::before {
    content: "";
    position: absolute;
    top: 0;
    inset-inline-start: 22px;
    width: 26px;
    height: 1px;
    background: var(--line);
  }
  .variant:hover {
    background: rgba(176, 82, 46, 0.05);
  }
  .copy:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .variant.copied {
    background: rgba(176, 82, 46, 0.12);
  }
  .variant-text {
    display: block;
    font-family: var(--font-serif);
    /* entry role: a touch above auto optical size — more stroke contrast
       without display-cut fragility at reading size */
    font-variation-settings: var(--opsz-entry);
    font-size: var(--entry-size);
    color: var(--ink);
    line-height: var(--entry-leading);
    letter-spacing: 0.003em;
  }
  .variant-rom {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--ink-mute);
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  .variant-meta {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--ink-mute);
    margin-top: 6px;
    line-height: 1.55;
    letter-spacing: 0.015em;
    text-wrap: pretty;
  }
  .variant-meta::before {
    content: "— ";
    color: var(--gold-ink);
  }
  .meta-sep {
    color: var(--gold-ink);
  }
  /* each icon sits in a box exactly one entry line tall, contents centered
     — flow alignment with the first line, no offsets */
  .copy-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: var(--entry-line);
    color: var(--ink-mute);
    opacity: 0;
    transition:
      opacity 0.2s ease,
      color 0.2s ease;
  }
  .speak-slot {
    display: inline-flex;
    align-items: center;
    height: var(--entry-line);
    margin-block-start: var(--v-pad-block);
    margin-inline-end: 10px;
  }
  .copy-mark svg {
    width: 15px;
    height: 15px;
  }
  .variant:hover .copy-mark {
    opacity: 0.55;
  }
  .variant:hover :global(.speak),
  .variant:focus-within :global(.speak) {
    opacity: 0.55;
  }
  .variant.copied .copy-mark {
    opacity: 1;
    color: var(--accent);
  }
  /* Touch has no hover: keep a quiet copy affordance always visible,
     matching SpeakButton's hover-none treatment. */
  @media (hover: none) {
    .copy-mark {
      opacity: 0.45;
    }
  }
</style>
