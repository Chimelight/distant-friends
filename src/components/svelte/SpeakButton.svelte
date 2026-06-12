<script lang="ts">
  import { ttsLangs, initVoices, isAvailable, speak, stopSpeaking } from '../../lib/tts';
  import languages from '../../data/languages.json';

  interface Props {
    text: string;
    langCode: string;
  }
  let { text, langCode }: Props = $props();

  const tts = languages.find((l) => l.code === langCode)?.tts ?? '';

  let speaking = $state(false);

  $effect(() => {
    initVoices();
  });

  // Render nothing when the language has no TTS code (mizo) or the browser
  // has no matching voice — a dead speaker icon is noise, not affordance.
  const available = $derived(tts !== '' && isAvailable($ttsLangs, tts));

  function onClick(e: MouseEvent) {
    e.stopPropagation();
    if (speaking) {
      stopSpeaking();
      speaking = false;
      return;
    }
    speaking = speak(text, tts, () => (speaking = false));
  }
</script>

{#if available}
  <button
    class="speak"
    class:speaking
    type="button"
    aria-label={speaking ? `Stop reading` : `Listen to ${text}`}
    onclick={onClick}
    onkeydown={(e) => e.stopPropagation()}
  >
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2.5 6.2v3.6h2.4L8.2 12.6V3.4L4.9 6.2H2.5z" fill="currentColor" stroke="none" />
      <path class="wave wave-1" d="M10.4 6.1a2.7 2.7 0 0 1 0 3.8" />
      <path class="wave wave-2" d="M12.2 4.4a5.2 5.2 0 0 1 0 7.2" />
    </svg>
  </button>
{/if}

<style>
  .speak {
    position: absolute;
    top: 34px;
    right: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 32px hit area (WCAG target-size); the icon stays 15px. */
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--ink-mute);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity var(--dur-hover) var(--ease-out),
      color var(--dur-hover) var(--ease-out);
  }
  .speak svg {
    width: 15px;
    height: 15px;
  }
  /* Revealed by the parent row's hover/focus rules in VariantRow. */
  .speak:focus-visible {
    opacity: 0.9;
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 3px;
  }
  .speak:hover {
    color: var(--accent);
  }
  .speak.speaking {
    opacity: 1;
    color: var(--accent);
  }
  .speak.speaking .wave-1,
  .speak.speaking .wave-2 {
    animation: ttsPulse 1.1s var(--ease-out) infinite;
  }
  .speak.speaking .wave-2 {
    animation-delay: 0.2s;
  }
  @keyframes ttsPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }
  @media (hover: none) {
    .speak {
      opacity: 0.45;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .speak.speaking .wave-1,
    .speak.speaking .wave-2 {
      animation: none;
    }
  }
</style>
