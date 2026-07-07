<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from '../../lib/stores';

  let visibleText = $state('');
  let visible = $state(false);
  let timer: number | undefined;

  onMount(() => {
    const unsub = toast.subscribe((msg) => {
      if (!msg) return;
      visibleText = msg.text;
      visible = true;
      clearTimeout(timer);
      timer = window.setTimeout(() => (visible = false), 1800);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  });

  function truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
</script>

<div class="toast" class:on={visible} role="status" aria-live="polite">
  Copied — <span class="tx">{truncate(visibleText, 36)}</span>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--ink);
    color: var(--paper-up);
    padding: 12px 22px;
    border-radius: 999px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 15px;
    letter-spacing: 0.01em;
    opacity: 0;
    pointer-events: none;
    transition: all 0.4s var(--ease-out);
    z-index: 100;
    box-shadow: 0 20px 40px -20px rgba(31, 26, 20, 0.5);
    white-space: nowrap;
    max-width: calc(100vw - 48px);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .toast.on {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  .toast .tx {
    color: var(--accent-soft);
    font-style: normal;
    font-weight: 500;
  }
</style>
