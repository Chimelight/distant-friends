<script lang="ts">
  import TranslationCell from './TranslationCell.svelte';
  import StarButton from './StarButton.svelte';
  import { selectedLangs, anchor, tone, speakerGender, addresseeGender, starred, starredOnly } from '../../lib/stores';
  import { visibleVariants } from '../../lib/filter';
  import languages from '../../data/languages.json';
  import scenes from '../../data/scenes.json';
  import phrases from '../../data/phrases';
  import type { TPhrase, TLanguage, TScene } from '../../lib/schema';

  const allPhrases = phrases as unknown as TPhrase[];
  const allLangs = languages as TLanguage[];
  const allScenes = scenes as TScene[];

  const otherLangs = $derived(
    allLangs.filter(
      (L) => L.code !== $anchor && ($selectedLangs ?? []).includes(L.code),
    ),
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
</script>

<div class="view-mobile">
  {#each allScenes as S (S.id)}
    {@const items = phrasesIn(S.id)}
    {#if items.length}
      {@const titleParts = emWrap(S.title, S.em)}
      <section class="scene-block" id={`scene-${S.id}`} data-scene={S.id}>
        <div class="scene-header">
          <span class="scene-num">{S.num}</span>
          <h2 class="scene-ttl">
            {titleParts.before}{#if titleParts.em}<em>{titleParts.em}</em>{/if}{titleParts.after}
          </h2>
        </div>
        <div class="card-list">
          {#each items as p, i (p.id)}
            {@const tr = p.trans[$anchor]}
            {@const anchorVs = tr ? visibleVariants(tr.variants, $tone, $speakerGender, $addresseeGender) : []}
            {@const primary = anchorVs[0] ?? tr?.variants[0]}
            <article class="card" style={`animation-delay:${i * 30}ms`}>
              <div class="card-head">
                <span class="star-slot"><StarButton phraseId={p.id} /></span>
                {#if primary}
                  <div class="card-word" lang={$anchor} dir="auto">{primary.text}</div>
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
                  <div class="lang-block">
                    <div class="lang-label">
                      {L.native}
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
    margin-bottom: 48px;
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
    color: var(--gold);
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

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 22px 22px 6px;
    opacity: 0;
    transform: translateY(6px);
    animation: rise var(--dur-entrance) ease forwards;
  }
  .card-head {
    position: relative;
    padding-bottom: 16px;
    padding-right: 36px;
    margin-bottom: 8px;
    border-bottom: 1px dashed var(--line);
  }
  .star-slot {
    position: absolute;
    top: 0;
    right: 0;
  }
  .card-word {
    font-family: var(--font-serif);
    font-weight: 500;
    font-size: 26px;
    color: var(--ink);
    letter-spacing: -0.005em;
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
  .lang-block + .lang-block {
    border-top: 1px solid var(--line-soft);
  }
  .lang-label {
    font-family: var(--font-sans);
    font-size: 10.5px;
    letter-spacing: 0.22em;
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
