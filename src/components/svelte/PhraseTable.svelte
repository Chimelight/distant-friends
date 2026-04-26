<script lang="ts">
  import TranslationCell from './TranslationCell.svelte';
  import { selectedLangs, anchor, tone } from '../../lib/stores';
  import { visibleVariants } from '../../lib/filter';
  import languages from '../../data/languages.json';
  import scenes from '../../data/scenes.json';
  import phrases from '../../data/phrases.json';
  import type { TPhrase, TLanguage, TScene } from '../../lib/schema';

  const allPhrases = phrases as unknown as TPhrase[];
  const allLangs = languages as TLanguage[];
  const allScenes = scenes as TScene[];

  const otherLangs = $derived(
    allLangs.filter(
      (L) => L.code !== $anchor && ($selectedLangs ?? []).includes(L.code),
    ),
  );
  const anchorL = $derived(allLangs.find((L) => L.code === $anchor));

  function emWrap(title: string, em: string): { before: string; em: string; after: string } {
    const idx = title.indexOf(em);
    if (idx < 0) return { before: title, em: '', after: '' };
    return {
      before: title.slice(0, idx),
      em,
      after: title.slice(idx + em.length),
    };
  }

  function phrasesIn(sceneId: string): TPhrase[] {
    return allPhrases
      .filter((p) => p.scene === sceneId)
      .sort((a, b) => a.order - b.order);
  }

  function anchorVariants(p: TPhrase) {
    const tr = p.trans[$anchor];
    if (!tr) return null;
    const vs = visibleVariants(tr.variants, $tone);
    const primary = vs[0] || tr.variants[0];
    return { primary, gloss: tr.gloss };
  }
</script>

<div class="view-desktop">
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
          <span class="scene-rule"></span>
        </div>
        <div class="table-wrap">
          <table class="phrase-table">
            <colgroup>
              <col style={`width:${(100 / (otherLangs.length + 1)) * 1.2}%`} />
              {#each otherLangs as _ (_.code)}
                <col
                  style={`width:${(100 - (100 / (otherLangs.length + 1)) * 1.2) / Math.max(otherLangs.length, 1)}%`}
                />
              {/each}
            </colgroup>
            <thead>
              <tr>
                <th class="th-anchor">{anchorL?.native ?? ''}</th>
                {#each otherLangs as L (L.code)}
                  <th class="th-lang">{L.native}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each items as p (p.id)}
                {@const ac = anchorVariants(p)}
                <tr class="phrase-row">
                  <td class="anchor-cell">
                    {#if ac}
                      <div class="anchor-word" lang={$anchor}>{ac.primary.text}</div>
                      {#if ac.primary.rom}
                        <div class="anchor-rom">{ac.primary.rom}</div>
                      {/if}
                      {#if ac.gloss}
                        <div class="anchor-gloss">{ac.gloss}</div>
                      {/if}
                    {:else}
                      <div class="anchor-word anchor-missing">—</div>
                    {/if}
                  </td>
                  {#each otherLangs as L (L.code)}
                    {@const tr = p.trans[L.code]}
                    {@const vs = tr ? visibleVariants(tr.variants, $tone) : []}
                    {#if !tr || !vs.length}
                      <td class="trans-cell empty"></td>
                    {:else}
                      <td class="trans-cell">
                        <TranslationCell {vs} langCode={L.code} />
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}
  {/each}
</div>

<style>
  /* Reserve right-edge space for the TocSide rail when it can be visible
   * (viewport ≥ 1024 in table view). Reserve of 56px clears the rail's
   * 40px width + 24px gap minus the shell's existing 32px padding-right.
   * Smoothly tapers to 0 at viewport ≥ 1304 where the shell's natural
   * margin (above shell max-width 1240) already separates rail from table. */
  @media (min-width: 1024px) {
    :global(body[data-view="table"]) .view-desktop {
      padding-right: clamp(0px, calc((1304px - 100vw) * 56 / 64), 56px);
    }
  }

  .table-wrap {
    border: 1px solid var(--line);
    background: var(--paper);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }
  .table-wrap::before,
  .table-wrap::after {
    content: "";
    position: absolute;
    width: 12px;
    height: 12px;
    border: 1px solid var(--gold);
    background: var(--bg);
    z-index: 6;
  }
  .table-wrap::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
  }
  .table-wrap::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
  }

  .scene-block {
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
  .scene-rule {
    flex: 1;
    height: 1px;
    background: var(--line);
    align-self: center;
    position: relative;
  }
  .scene-rule::after {
    content: "";
    position: absolute;
    right: 0;
    top: -2.5px;
    width: 5px;
    height: 5px;
    background: var(--gold);
    border-radius: 50%;
  }

  .phrase-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
  }
  .phrase-table thead th {
    text-align: left;
    padding: 16px 22px;
    border-bottom: 1px solid var(--line);
    font-family: var(--font-sans);
    font-weight: 500;
    font-size: 10.5px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  .phrase-table thead th.th-anchor {
    background: rgba(166, 130, 74, 0.1);
    color: var(--accent);
    border-right: 1px solid var(--line-soft);
    font-style: italic;
    font-family: var(--font-serif);
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0.01em;
    font-weight: 400;
  }
  .phrase-table thead th.th-lang {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0.005em;
    color: var(--ink-soft);
  }

  .anchor-cell {
    padding: 24px 22px;
    vertical-align: top;
    background: rgba(166, 130, 74, 0.06);
    border-right: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line-soft);
  }
  .phrase-row:last-child .anchor-cell,
  .phrase-row:last-child .trans-cell {
    border-bottom: none;
  }
  .anchor-word {
    font-family: var(--font-serif);
    font-weight: 500;
    font-size: 22px;
    color: var(--ink);
    line-height: 1.2;
    letter-spacing: -0.005em;
  }
  .anchor-word.anchor-missing {
    color: var(--ink-mute);
    font-style: italic;
  }
  .anchor-rom {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--ink-mute);
    margin-top: 4px;
    letter-spacing: 0.02em;
  }
  .anchor-gloss {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--ink-mute);
    margin-top: 8px;
    letter-spacing: 0.015em;
  }

  .trans-cell {
    padding: 0;
    vertical-align: top;
    border-bottom: 1px solid var(--line-soft);
  }
  .trans-cell.empty {
    background: repeating-linear-gradient(
      135deg,
      transparent 0,
      transparent 8px,
      var(--line-soft) 8px,
      var(--line-soft) 9px
    );
    opacity: 0.35;
  }

  @media (max-width: 640px) {
    .scene-header {
      margin-bottom: 20px;
    }
    .scene-rule {
      display: none;
    }
  }
</style>
