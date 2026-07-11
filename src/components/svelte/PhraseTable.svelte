<script lang="ts">
  import { tick } from 'svelte';
  import TranslationCell from './TranslationCell.svelte';
  import StarButton from './StarButton.svelte';
  import LangMenu from './LangMenu.svelte';
  import {
    selectedLangs,
    anchor,
    tone,
    speakerGender,
    addresseeGender,
    starred,
    starredOnly,
    freshLang,
    markFreshLang,
  } from '../../lib/stores';
  import { openPopover, togglePopover, closePopover, popover } from '../../lib/popover';
  import { LANG_BY_CODE, langsByCodes, langTag } from '../../lib/lang';
  import { visibleVariants } from '../../lib/filter';
  import scenes from '../../data/scenes.json';
  import phrases from '../../data/phrases';
  import ui from '../../content/ui/en.json';
  import type { TPhrase, TScene } from '../../lib/schema';

  const allPhrases = phrases as unknown as TPhrase[];
  const allScenes = scenes as TScene[];

  // Column order IS the selection order ($selectedLangs is an ordered
  // array); the anchor renders as its own first column.
  const otherLangs = $derived(
    langsByCodes(($selectedLangs ?? []).filter((c) => c !== $anchor)),
  );
  const anchorL = $derived(LANG_BY_CODE.get($anchor));
  const anchorDir = $derived(anchorL?.rtl ? 'rtl' : 'ltr');

  // Anchor column slightly wider than an even split; guard the degenerate
  // anchor-only table (otherwise the formula yields 120%).
  const anchorColPct = $derived(
    otherLangs.length ? (100 / (otherLangs.length + 1)) * 1.2 : 100,
  );
  const otherColPct = $derived(
    otherLangs.length ? (100 - anchorColPct) / otherLangs.length : 0,
  );

  // —— headers double as a quick per-column language switch ——
  // (add / remove / search live in the Stationery panel; headers only swap)
  const selected = $derived(new Set($selectedLangs ?? []));

  function switchColumn(oldCode: string, newCode: string) {
    const cur = selectedLangs.get() ?? [];
    if (!cur.includes(oldCode) || cur.includes(newCode)) return;
    // In place: the clicked column becomes the new language, right where
    // it stands — selection order (= column order) is preserved.
    selectedLangs.set(cur.map((c) => (c === oldCode ? newCode : c)));
    if (anchor.get() === oldCode) anchor.set(newCode); // anchor follows its column
    markFreshLang(newCode);
    closePopover();
  }

  // Keyboard activation (click detail 0) drops focus into the menu's search.
  async function toggleTh(e: MouseEvent, key: string) {
    const th = (e.currentTarget as HTMLElement).closest('th');
    togglePopover(key);
    if (openPopover.get() === key && e.detail === 0) {
      await tick();
      th?.querySelector<HTMLElement>('.lm-search')?.focus();
    }
  }

  function starsIn(sceneId: string): number {
    const star = new Set($starred);
    return allPhrases.filter((p) => p.scene === sceneId && star.has(p.id)).length;
  }

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
    const star = new Set($starred);
    return allPhrases
      .filter((p) => p.scene === sceneId && (!$starredOnly || star.has(p.id)))
      .sort((a, b) => a.order - b.order);
  }

  function anchorVariants(p: TPhrase) {
    const tr = p.trans[$anchor];
    if (!tr) return null;
    const vs = visibleVariants(tr.variants, $tone, $speakerGender, $addresseeGender);
    const primary = vs[0] || tr.variants[0];
    return { primary, gloss: tr.gloss };
  }
</script>

<div class="view-desktop">
  {#each allScenes as S (S.id)}
    {@const items = phrasesIn(S.id)}
    {#if items.length}
      {@const titleParts = emWrap(S.title, S.em)}
      {@const anchorKey = `${S.id}|anchor`}
      <section class="scene-block" id={`scene-table-${S.id}`} data-scene={S.id}>
        <div class="scene-header">
          <!-- Nº: the letterpress numero mark (presentation only, data keeps "No.") -->
          <span class="scene-num">{S.num.replace('No. ', 'Nº ')}</span>
          <h2 class="scene-ttl">
            {titleParts.before}{#if titleParts.em}<em>{titleParts.em}</em>{/if}{titleParts.after}
          </h2>
          {#if starsIn(S.id) > 0}
            <span class="scene-kept" aria-label={`${starsIn(S.id)} starred in this scene`}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l1.86 3.92 4.14.55-3.04 2.98.76 4.27L8 11.46l-3.72 2.04.76-4.27L2 6.27l4.14-.55z" fill="currentColor" /></svg>
              {starsIn(S.id)}
            </span>
          {/if}
          <span class="scene-rule"></span>
        </div>
        <div class="table-wrap">
          <table class="phrase-table">
            <colgroup>
              <col style={`width:${anchorColPct}%`} />
              {#each otherLangs as _ (_.code)}
                <col style={`width:${otherColPct}%`} />
              {/each}
            </colgroup>
            <thead>
              <tr>
                <th
                  class="th-anchor th-cell"
                  class:fresh={$anchor === $freshLang}
                  dir={anchorDir}
                  lang={anchorL ? langTag(anchorL) : undefined}
                  use:popover={anchorKey}
                >
                  <button
                    class="th-btn"
                    type="button"
                    aria-expanded={$openPopover === anchorKey}
                    aria-label={`${anchorL?.name ?? ''} — ${ui.stationery.langsSwitch}`}
                    onclick={(e) => toggleTh(e, anchorKey)}
                  >
                    <span class="th-native">{anchorL?.native ?? ''}</span>
                    {#if anchorL && anchorL.name !== anchorL.native}
                      <span class="th-name">{anchorL.name}</span>
                    {/if}
                  </button>
                  {#if $openPopover === anchorKey}
                    <div class="th-pop">
                      <div class="thp-head">{ui.stationery.langsSwitch}</div>
                      <LangMenu
                        marked={selected}
                        anchorCode={$anchor}
                        disabledCodes={selected}
                        onPick={(c) => switchColumn($anchor, c)}
                      />
                    </div>
                  {/if}
                </th>
                {#each otherLangs as L (L.code)}
                  {@const key = `${S.id}|${L.code}`}
                  <th
                    class="th-lang th-cell"
                    class:fresh={L.code === $freshLang}
                    dir={L.rtl ? 'rtl' : 'ltr'}
                    lang={langTag(L)}
                    use:popover={key}
                  >
                    <button
                      class="th-btn"
                      type="button"
                      aria-expanded={$openPopover === key}
                      aria-label={`${L.name} — ${ui.stationery.langsSwitch}`}
                      onclick={(e) => toggleTh(e, key)}
                    >
                      <span class="th-native">{L.native}</span>
                      {#if L.name !== L.native}
                        <span class="th-name">{L.name}</span>
                      {/if}
                    </button>
                    {#if $openPopover === key}
                      <div class="th-pop">
                        <div class="thp-head">{ui.stationery.langsSwitch}</div>
                        <LangMenu
                          marked={selected}
                          anchorCode={$anchor}
                          disabledCodes={selected}
                          onPick={(c) => switchColumn(L.code, c)}
                        />
                      </div>
                    {/if}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each items as p, ri (p.id)}
                {@const ac = anchorVariants(p)}
                <tr class="phrase-row" style={`--ri:${Math.min(ri, 8)}`}>
                  <td class="anchor-cell" class:fresh={$anchor === $freshLang} dir={anchorDir}>
                    <span class="star-slot"><StarButton phraseId={p.id} /></span>
                    {#if ac}
                      <div
                        class="anchor-word"
                        lang={anchorL ? langTag(anchorL) : undefined}
                        dir="auto"
                      >
                        {ac.primary.text}
                      </div>
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
                    {@const vs = tr ? visibleVariants(tr.variants, $tone, $speakerGender, $addresseeGender) : []}
                    {#if !tr || !vs.length}
                      <td class="trans-cell empty" class:fresh={L.code === $freshLang} dir={L.rtl ? 'rtl' : 'ltr'}></td>
                    {:else}
                      <td
                        class="trans-cell"
                        class:fresh={L.code === $freshLang}
                        dir={L.rtl ? 'rtl' : 'ltr'}
                        lang={langTag(L)}
                      >
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
    /* sheet-on-desk: lit top edge + warm lift (tokens, themed) */
    box-shadow: var(--paper-edge), var(--shadow-paper);
    /* not `hidden`: an overflow container would break the sticky header */
    overflow: visible;
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
    /* Skip layout/paint for below-fold scenes; the estimate only affects
     * scrollbar length until the block is reached. */
    content-visibility: auto;
    contain-intrinsic-size: auto 1200px;
    /* chapter air: scenes part like chapters, not list items */
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
    text-box-trim: trim-both;
    text-box-edge: cap alphabetic;
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

  .scene-rule {
    flex: 1;
    height: 1px;
    /* eases in from the title instead of butting against it */
    background: linear-gradient(to right, transparent, var(--line) 32px);
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
    text-align: start;
    padding: 17px 22px;
    border-bottom: 1px solid var(--line);
    /* Sticky a comfortable gap below the StickyBar (~44px) so the column
       languages stay visible while reading — with breathing room, not flush. */
    position: sticky;
    top: 58px;
    z-index: 5;
    background: var(--paper);
  }
  .phrase-table thead th.th-anchor {
    /* opaque (sticky can't show transparent — content would bleed through),
       theme-aware: a gold tint layered over the paper-up surface. */
    background: linear-gradient(rgba(166, 130, 74, 0.14), rgba(166, 130, 74, 0.14)), var(--bg);
    border-right: 1px solid var(--line-soft);
  }
  .th-native {
    display: block;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: calc(14px * var(--script-scale, 1));
    letter-spacing: 0.005em;
    color: var(--ink-soft);
  }
  .th-anchor .th-native {
    color: var(--accent);
  }
  .th-name {
    display: block;
    margin-top: 3px;
    font-family: var(--font-sans);
    font-weight: var(--label-weight);
    font-size: var(--label-size);
    letter-spacing: var(--label-track);
    text-transform: uppercase;
    color: var(--ink-mute);
  }

  /* —— headers double as language switchers —— */
  .th-btn {
    display: block;
    width: 100%;
    padding: 0;
    background: transparent;
    border: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    cursor: pointer;
  }
  .th-btn::after {
    content: '▾';
    font-size: 9px;
    margin-inline-start: 5px;
    color: var(--ink-mute);
    opacity: 0;
    transition: opacity 0.15s ease;
    vertical-align: middle;
  }
  .th-cell:hover .th-btn::after,
  .th-btn[aria-expanded='true']::after {
    opacity: 0.55;
  }
  .th-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* mounted only while open */
  .th-pop {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    direction: ltr;
    text-align: left;
    width: max-content;
    max-width: min(380px, calc(100vw - 28px));
    max-height: min(60vh, 440px);
    overflow-y: auto;
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 12px 14px;
    z-index: 40;
    box-shadow:
      var(--paper-edge),
      0 20px 48px -24px rgba(31, 26, 20, 0.45),
      0 0 0 1px var(--line-soft);
    letter-spacing: normal;
    animation: th-pop-in 0.18s ease;
  }
  @keyframes th-pop-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }
  /* right-align the popover for the last couple of columns so it doesn't
     overflow the viewport edge */
  .th-lang:nth-last-child(-n + 2) .th-pop {
    left: auto;
    right: 0;
  }
  .thp-head {
    font-family: var(--font-sans);
    font-weight: var(--label-weight);
    font-size: var(--label-size);
    letter-spacing: var(--label-track);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line-soft);
  }

  .anchor-cell {
    position: relative;
    padding: 24px 22px;
    vertical-align: top;
    background: rgba(166, 130, 74, 0.06);
    border-right: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line-soft);
  }
  .star-slot {
    position: absolute;
    top: 7px;
    /* Logical: lands on the left in an RTL anchor column, clear of the
     * headword's starting edge. */
    inset-inline-end: 7px;
  }
  .phrase-row:last-child .anchor-cell,
  .phrase-row:last-child .trans-cell {
    border-bottom: none;
  }
  .anchor-word {
    font-family: var(--font-serif);
    /* headword role: the masthead's display cut at moderated strength —
       lighter weight + raised optical size instead of a bolder face */
    font-weight: 440;
    font-variation-settings: var(--opsz-headword);
    font-size: calc(22px * var(--script-scale, 1));
    color: var(--ink);
    line-height: 1.2;
    letter-spacing: -0.008em;
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
    text-wrap: pretty;
  }

  .trans-cell {
    padding: 0;
    vertical-align: top;
    border-bottom: 1px solid var(--line-soft);
  }
  /* "fresh ink": a switched-in / newly-added column writes itself in,
     header first, then row by row down the page. */
  th.fresh {
    animation: ink-in 0.42s var(--ease-out) backwards;
  }
  td.fresh {
    animation: ink-in 0.42s var(--ease-out) backwards;
    animation-delay: calc((var(--ri, 0) + 1) * 38ms);
  }
  @keyframes ink-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
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
