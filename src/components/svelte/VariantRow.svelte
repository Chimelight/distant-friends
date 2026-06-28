<script lang="ts">
  import { tone, speakerGender, addresseeGender, showToast } from '../../lib/stores';
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
    <div class="variant-text" lang={langCode} dir="auto">{variant.text}</div>
    {#if variant.rom}
      <div class="variant-rom">{variant.rom}</div>
    {/if}
    {#if tagText}
      <div class="variant-tag">{tagText}</div>
    {/if}
    {#if variant.note}
      <div class="variant-note">{variant.note}</div>
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
  .copy {
    display: block;
    width: calc(100% - 48px);
    padding: 18px 0 18px 22px;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    background: transparent;
    border: none;
    color: inherit;
  }
  .variant + :global(.variant) {
    border-top: 1px dashed var(--line-soft);
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
  .variant-tag {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--ink-mute);
    margin-top: 8px;
    letter-spacing: 0.015em;
  }
  .variant-tag::before {
    content: "— ";
    color: var(--gold-ink);
  }
  .variant-note {
    font-family: var(--font-sans);
    font-style: italic;
    font-size: 11.5px;
    color: var(--ink-mute);
    margin-top: 6px;
    line-height: 1.55;
    padding-left: 8px;
    border-left: 1px solid var(--line);
  }
  /* copy-hint is an empty span; ::before swaps content based on .copied. */
  .copy-hint {
    position: absolute;
    top: 16px;
    right: 18px;
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
</style>
