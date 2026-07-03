<script lang="ts">
  import TranslationCell from './TranslationCell.svelte';
  import StarButton from './StarButton.svelte';
  import { selectedLangs, anchor, tone, speakerGender, addresseeGender, starred, starredOnly, freshLang } from '../../lib/stores';
  import { LANG_BY_CODE, langsByCodes, langTag } from '../../lib/lang';
  import { visibleVariants } from '../../lib/filter';
  import scenes from '../../data/scenes.json';
  import phrases from '../../data/phrases';
  import type { TPhrase, TScene } from '../../lib/schema';

  const allPhrases = phrases as unknown as TPhrase[];
  const allScenes = scenes as TScene[];

  const anchorL = $derived(LANG_BY_CODE.get($anchor));
  const anchorDir = $derived(anchorL?.rtl ? 'rtl' : 'ltr');
  // Blocks follow the selection's own order, same as the table's columns.
  const otherLangs = $derived(
    langsByCodes(($selectedLangs ?? []).filter((c) => c !== $anchor)),
  );

  function emWrap(title: string, em: string) {
    const idx = title.indexOf(em);
    if (idx < 0) return { before: title, em: '', after: '' };
    return {
      before: title.slice(0, idx),
      em,
      after: title.slice(idx + em.length),
    };
  }

  function phrasesIn(sceneId: string): TPhrase[] {
    const star = new Set($starred);
    return allPhrases
      .filter((p) => p.scene === sceneId && (!$starredOnly || star.has(p.id)))
      .sort((a, b) => a.order - b.order);
  }

  function starsIn(sceneId: string): number {
    const star = new Set($starred);
    return allPhrases.filter((p) => p.scene === sceneId && star.has(p.id)).length;
  }
</script>

<div class="view-mobile">
  {#each allScenes as S (S.id)}
    {@const items = phrasesIn(S.id)}
    {#if items.length}
      {@const titleParts = emWrap(S.title, S.em)}
      <section class="scene-block" id={`scene-cards-${S.id}`} data-scene={S.id}>
        <div class="scene-header">
          <span class="scene-num">{S.num}</span>
          <h2 class="scene-ttl">
            {titleParts.before}{#if titleParts.em}<em>{titleParts.em}</em>{/if}{titleParts.after}
          </h2>
          {#if starsIn(S.id) > 0}
            <span class="scene-kept" aria-label={`${starsIn(S.id)} starred in this scene`}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l1.86 3.92 4.14.55-3.04 2.98.76 4.27L8 11.46l-3.72 2.04.76-4.27L2 6.27l4.14-.55z" fill="currentColor" /></svg>
              {starsIn(S.id)}
            </span>
          {/if}
        </div>
        <div class="card-list">
          {#each items as p, i (p.id)}
            {@const tr = p.trans[$anchor]}
            {@const anchorVs = tr ? visibleVariants(tr.variants, $tone, $speakerGender, $addresseeGender) : []}
            {@const primary = anchorVs[0] ?? tr?.variants[0]}
            <article class="card" style={`animation-delay:${i * 30}ms`}>
              <div class="card-head" dir={anchorDir}>
                <span class="star-slot"><StarButton phraseId={p.id} /></span>
                {#if primary}
                  <div class="card-word" lang={anchorL ? langTag(anchorL) : undefined} dir="auto">{primary.text}</div>
                  {#if primary.rom}
                    <div class="card-rom">{primary.rom}</div>
                  {/if}
                  {#if tr?.gloss}
                    <div class="card-gloss">{tr.gloss}</div>
                  {/if}
                {:else}
                  <div class="card-word card-missing">—</div>
                {/if}
              </div>
              {#each otherLangs as L (L.code)}
                {@const t = p.trans[L.code]}
                {@const vs = t ? visibleVariants(t.variants, $tone, $speakerGender, $addresseeGender) : []}
                {#if t && vs.length}
                  <div class="lang-block" class:fresh={L.code === $freshLang}>
                    <div class="lang-label">
                      <span lang={langTag(L)}>{L.native}</span>
                      {#if t.gloss}
                        <span class="lang-gloss"> · {t.gloss}</span>
                      {/if}
                    </div>
                    <TranslationCell {vs} langCode={L.code} />
                  </div>
                {/if}
              {/each}
            </article>
          {/each}
        </div>
      </section>
    {/if}
  {/each}
</div>

<style>
  .scene-block {
    /* Skip layout/paint for below-fold scenes; the estimate only affects
     * scrollbar length until the block is reached. */
    content-visibility: auto;
    contain-intrinsic-size: auto 2400px;
    /* chapter air, mirrors the table view */
    margin-bottom: 72px;
    /* Clear the StickyBar (~44px tall) when scrollIntoView lands on a
     * section — without this margin the title hides under the bar. */
    scroll-margin-top: 80px;
  }
  .scene-header {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 28px;
    padding: 0 4px;
  }
  .scene-num {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 300;
    font-size: 14px;
    color: var(--gold-ink);
    letter-spacing: 0.16em;
    flex-shrink: 0;
  }
  .scene-ttl {
    font-family: var(--font-serif);
    font-weight: 400;
    font-size: clamp(26px, 3.2vw, 34px);
    letter-spacing: -0.01em;
    color: var(--ink);
    margin: 0;
  }
  .scene-ttl :global(em) {
    font-style: italic;
    color: var(--accent);
  }
  /* small gold tally of starred phrases in this scene */
  .scene-kept {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--gold-ink);
    flex-shrink: 0;
    animation: kept-in 0.4s var(--ease-out) backwards;
  }
  .scene-kept svg {
    width: 10px;
    height: 10px;
    color: var(--gold);
    align-self: center;
  }
  @keyframes kept-in {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 3px;
    /* sheet-on-desk, same idiom as the table view */
    box-shadow: var(--paper-edge), var(--shadow-paper);
    padding: 22px 22px 6px;
    position: relative;
    opacity: 0;
    transform: translateY(6px);
    animation: rise var(--dur-entrance) ease forwards;
  }
  /* registration corners — the table sheet's gold marks, scaled down */
  .card::before,
  .card::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border: 1px solid var(--gold);
    background: var(--bg);
    z-index: 1;
  }
  .card::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
  }
  .card::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
  }
  .card-head {
    position: relative;
    padding-bottom: 16px;
    padding-inline-end: 36px;
    margin-bottom: 8px;
    border-bottom: 1px dashed var(--line);
  }
  .star-slot {
    position: absolute;
    top: 0;
    inset-inline-end: 0;
  }
  .card-word {
    font-family: var(--font-serif);
    /* headword role — same cut as the table's anchor column */
    font-weight: 440;
    font-variation-settings: var(--opsz-headword);
    font-size: 26px;
    color: var(--ink);
    letter-spacing: -0.008em;
    line-height: 1.15;
  }
  .card-word.card-missing {
    color: var(--ink-mute);
    font-style: italic;
  }
  .card-rom {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--ink-mute);
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  .card-gloss {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--ink-mute);
    margin-top: 8px;
  }
  .lang-block {
    padding: 12px 0 4px;
  }
  /* "fresh ink": a just-added language writes itself into every card */
  .lang-block.fresh {
    animation: ink-in 0.42s var(--ease-out) backwards;
  }
  @keyframes ink-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  .lang-block + .lang-block {
    border-top: 1px solid var(--line-soft);
  }
  .lang-label {
    font-family: var(--font-sans);
    font-weight: var(--label-weight);
    font-size: var(--label-size);
    letter-spacing: var(--label-track);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin: 4px 0 6px;
  }
  .lang-label .lang-gloss {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 11.5px;
    text-transform: none;
    letter-spacing: 0.005em;
    color: var(--ink-mute);
  }
  .lang-block :global(.variant) {
    padding: 10px 10px;
    margin: 0 -10px;
    border-radius: 3px;
  }

  /* Cards container is always 720px max — no width jump at any viewport
   * boundary. Below 720 the natural shell padding takes over and cards
   * become fluid. TocSide (when visible) sits in the right whitespace. */
  .card-list,
  .scene-header {
    max-width: 720px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 640px) {
    .scene-header {
      margin-bottom: 20px;
    }
    .card-word {
      font-size: 24px;
    }
  }
</style>
