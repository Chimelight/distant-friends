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

<!-- Entry + trailing dot form one unbreakable unit (the LanguagePicker
     name·dot pattern): when the index wraps as text on narrow screens, a
     line may end with a separator dot but can never start with one, and a
     numeral can never lose its title. Units are joined by plain spaces —
     whitespace-only text nodes are invisible to the desktop flex layout
     but give the inline flow its break points. -->
<nav class="toc-top" class:fade-out={$scrolled} aria-label="Scenes">
  {#each scenes as S, i (S.id)}<span class="unit"
    ><button
      type="button"
      class="toc-top-item"
      data-scene-id={S.id}
      onclick={() => jumpTo(S.id)}
    >
      <span class="num">{S.num.replace('No. ', '')}.</span><span class="ttl">{S.title}</span>
    </button>{#if i < scenes.length - 1}<span class="toc-top-sep" aria-hidden="true"></span>{/if}</span
  >{#if i < scenes.length - 1}{' '}{/if}{/each}
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
    /* entrance choreography, final beat (mark → tagline → stationery → here) */
    animation: rise 0.6s var(--ease-out) backwards 0.38s;
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
  /* Desktop: units dissolve into the flex row — same composition as ever. */
  .unit {
    display: contents;
  }
  .toc-top-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--line);
    align-self: center;
    flex-shrink: 0;
  }
  /* Narrow screens: the same single index line as desktop, swipeable —
     any wrapped arrangement at this width scattered the entries into
     noise. Faded edges hint at the overflow; the fade is a mask — an
     enhancement, never load-bearing. */
  @media (max-width: 640px) {
    .toc-top {
      flex-wrap: nowrap;
      justify-content: flex-start;
      overflow-x: auto;
      gap: 0 18px;
      margin: 30px auto 22px;
      padding: 4px 24px;
      scrollbar-width: none;
      -webkit-mask-image: linear-gradient(
        to right,
        transparent,
        #000 24px,
        #000 calc(100% - 24px),
        transparent
      );
      mask-image: linear-gradient(
        to right,
        transparent,
        #000 24px,
        #000 calc(100% - 24px),
        transparent
      );
    }
    .toc-top::-webkit-scrollbar {
      display: none;
    }
    .toc-top-item {
      white-space: nowrap;
      font-size: 13px;
    }
  }
</style>
