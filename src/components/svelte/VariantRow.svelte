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

<!-- The row is a plain wrapper; the copy control is a real <button> whose
     box stops short of the right gutter where SpeakButton lives — two
     targets, zero geometric overlap (WCAG target-size). -->
<div class="variant" class:copied>
  <button
    class="copy"
    type="button"
    aria-label={`Copy ${variant.text}`}
    onclick={onClick}
    onkeydown={onKey}
  >
    <!-- langCode stays the dataset code (SpeakButton matches TTS voices on
         it); the lang attribute needs the valid BCP-47 tag. -->
    <div class="variant-text" lang={langTagOf(langCode)} dir="auto">
      <!-- inline span so the copied underline hugs the ink, not the cell -->
      <span class="ink-u">{variant.text}</span>
    </div>
    {#if variant.rom}
      <div class="variant-rom">{variant.rom}</div>
    {/if}
    <!-- one annotation voice: tag and note share a line and a register,
         instead of stacking two differently-styled rows -->
    {#if tagText || variant.note}
      <div class="variant-meta">
        {#if tagText}<span>{tagText}</span>{/if}
        {#if tagText && variant.note}<span class="meta-sep" aria-hidden="true"> · </span>{/if}
        {#if variant.note}<span>{variant.note}</span>{/if}
      </div>
    {/if}
  </button>
  <span class="copy-hint" aria-hidden="true"></span>
  <SpeakButton text={variant.text} langCode={langCode} />
</div>

<style>
  .variant {
    display: block;
    width: 100%;
    position: relative;
    transition: background 0.2s ease;
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
    display: block;
    width: calc(100% - 48px);
    padding-block: 15px;
    padding-inline: 22px 0;
    cursor: pointer;
    font-family: inherit;
    text-align: start;
    background: transparent;
    border: none;
    color: inherit;
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
    font-family: var(--font-serif);
    font-size: 19px;
    color: var(--ink);
    line-height: 1.32;
    letter-spacing: 0.003em;
  }
  .variant-rom {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--ink-mute);
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  .variant-meta {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--ink-mute);
    margin-top: 6px;
    line-height: 1.55;
    letter-spacing: 0.015em;
  }
  .variant-meta::before {
    content: "— ";
    color: var(--gold-ink);
  }
  .meta-sep {
    color: var(--gold-ink);
  }
  /* copy-hint is an empty span; ::before swaps content based on .copied. */
  .copy-hint {
    position: absolute;
    top: 16px;
    inset-inline-end: 18px;
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--ink-mute);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .copy-hint::before {
    content: 'copy';
  }
  .variant:hover .copy-hint {
    opacity: 0.5;
  }
  .variant:hover :global(.speak),
  .variant:focus-within :global(.speak) {
    opacity: 0.55;
  }
  .variant.copied .copy-hint {
    opacity: 1;
    color: var(--accent);
    font-family: var(--font-serif);
    font-style: italic;
    text-transform: none;
    letter-spacing: 0.01em;
    font-size: 12.5px;
  }
  .variant.copied .copy-hint::before {
    content: '✓ copied';
  }
  /* Touch has no hover: keep a quiet "copy" affordance always visible,
     matching SpeakButton's hover-none treatment. */
  @media (hover: none) {
    .copy-hint {
      opacity: 0.4;
    }
  }
</style>
