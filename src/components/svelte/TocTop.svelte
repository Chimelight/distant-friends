<script lang="ts">
  import { onMount } from 'svelte';
  import scenes from '../../data/scenes.json';
  import { scrolled, initScrollListener } from '../../lib/scroll';

  onMount(() => {
    return initScrollListener('.scene-block');
  });

  function jumpTo(id: string) {
    // See TocSide.jumpTo: data-scene is the shared key across both views'
    // blocks; offsetParent picks whichever view is currently visible.
    const all = document.querySelectorAll<HTMLElement>(`[data-scene="${id}"]`);
    for (const el of all) {
      if (el.offsetParent !== null) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }
</script>

<nav class="toc-top" class:fade-out={$scrolled} aria-label="Scenes">
  {#each scenes as S, i (S.id)}
    {#if i > 0}
      <span class="toc-top-sep" aria-hidden="true"></span>
    {/if}
    <button
      type="button"
      class="toc-top-item"
      data-scene-id={S.id}
      onclick={() => jumpTo(S.id)}
    >
      <span class="num">{S.num.replace('No. ', '')}.</span><span class="ttl">{S.title}</span>
    </button>
  {/each}
</nav>

<style>
  .toc-top {
    margin: 56px auto 40px;
    max-width: 920px;
    padding: 0 12px;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0 24px;
    row-gap: 12px;
    justify-content: center;
    transition: opacity 0.4s ease;
  }
  .toc-top.fade-out {
    opacity: 0;
    pointer-events: none;
  }
  .toc-top-item {
    display: inline-flex;
    align-items: baseline;
    gap: 9px;
    font-family: var(--font-serif);
    font-size: 14px;
    color: var(--ink-mute);
    transition: color 0.2s ease;
    padding: 4px 2px;
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }
  .toc-top-item:hover {
    color: var(--accent);
  }
  .toc-top-item .num {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    color: var(--gold-ink);
    letter-spacing: 0.1em;
    font-size: 12px;
    opacity: 0.85;
  }
  .toc-top-item .ttl {
    font-style: italic;
  }
  .toc-top-item:hover .num {
    color: var(--accent);
    opacity: 1;
  }
  .toc-top-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--line);
    align-self: center;
    flex-shrink: 0;
  }
</style>
