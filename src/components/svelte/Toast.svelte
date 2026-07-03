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
  /* A slip of paper laid on the desk — not an inverted ink bubble. Same
     surface idiom as the sheets and popovers (paper-up, hairline, lit top
     edge, warm lift). */
  .toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--paper-up);
    color: var(--ink-soft);
    padding: 12px 24px;
    border: 1px solid var(--line);
    border-radius: 3px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 15px;
    letter-spacing: 0.01em;
    opacity: 0;
    pointer-events: none;
    transition: all 0.4s var(--ease-out);
    z-index: 100;
    box-shadow:
      var(--paper-edge),
      0 20px 40px -20px rgba(31, 26, 20, 0.5),
      0 0 0 1px var(--line-soft);
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
    color: var(--accent);
    font-style: normal;
    font-weight: 500;
  }
</style>
