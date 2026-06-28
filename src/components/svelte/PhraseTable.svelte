<script lang="ts">
  import { onMount } from 'svelte';
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
    MAX_LANGS,
  } from '../../lib/stores';
  import { visibleVariants } from '../../lib/filter';
  import languages from '../../data/languages.json';
  import scenes from '../../data/scenes.json';
  import phrases from '../../data/phrases';
  import ui from '../../content/ui/en.json';
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
  const anchorDir = $derived(anchorL?.rtl ? 'rtl' : 'ltr');

  // Mizo's `code` is not a valid BCP-47 subtag; tag it ISO 639-3 "lus".
  const bcp47 = (code: string | undefined) => (code === 'mizo' ? 'lus' : code);

  // —— column language controls (headers double as switchers) ——
  const selected = $derived(new Set($selectedLangs ?? []));
  const canAdd = $derived(selected.size < MAX_LANGS);
  // Open popover keyed by `${sceneId}|${code}` so only the clicked scene's
  // header opens (the same column repeats in every scene's table).
  let openKey = $state<string | null>(null);

  function switchColumn(oldCode: string, newCode: string) {
    const set = new Set(selectedLangs.get() ?? []);
    if (!set.has(oldCode) || set.has(newCode)) return;
    set.delete(oldCode);
    set.add(newCode);
    selectedLangs.set([...set]);
    if (anchor.get() === oldCode) anchor.set(newCode); // anchor follows its column
    openKey = null;
  }
  function removeColumn(code: string) {
    if (code === anchor.get()) return;
    const set = new Set(selectedLangs.get() ?? []);
    if (set.size <= 1) return;
    set.delete(code);
    selectedLangs.set([...set]);
    openKey = null;
  }
  function addColumn(code: string) {
    const set = new Set(selectedLangs.get() ?? []);
    if (set.size >= MAX_LANGS || set.has(code)) return;
    set.add(code);
    selectedLangs.set([...set]);
    openKey = null;
  }

  onMount(() => {
    const onDoc = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-thkey]');
      if (el?.getAttribute('data-thkey') !== openKey) openKey = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openKey = null;
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  });

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
              {#if canAdd}<col class="col-add" />{/if}
            </colgroup>
            <thead>
              <tr>
                <th class="th-anchor th-cell" dir={anchorDir} lang={bcp47(anchorL?.code)} data-thkey={anchorKey}>
                  <button
                    class="th-btn"
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={openKey === anchorKey}
                    aria-label={`${anchorL?.name ?? ''} — ${ui.stationery.langsSwitch}`}
                    onclick={(e) => {
                      e.stopPropagation();
                      openKey = openKey === anchorKey ? null : anchorKey;
                    }}
                  >
                    <span class="th-native">{anchorL?.native ?? ''}</span>
                    {#if anchorL && anchorL.name !== anchorL.native}
                      <span class="th-name">{anchorL.name}</span>
                    {/if}
                  </button>
                  <div class="th-pop" class:open={openKey === anchorKey}>
                    <div class="thp-head">{ui.stationery.langsSwitch}</div>
                    <LangMenu
                      langs={allLangs}
                      marked={selected}
                      anchorCode={$anchor}
                      disabledCodes={selected}
                      open={openKey === anchorKey}
                      onPick={(c) => switchColumn($anchor, c)}
                    />
                  </div>
                </th>
                {#each otherLangs as L (L.code)}
                  {@const key = `${S.id}|${L.code}`}
                  <th class="th-lang th-cell" dir={L.rtl ? 'rtl' : 'ltr'} lang={bcp47(L.code)} data-thkey={key}>
                    <button
                      class="th-btn"
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={openKey === key}
                      aria-label={`${L.name} — ${ui.stationery.langsSwitch}`}
                      onclick={(e) => {
                        e.stopPropagation();
                        openKey = openKey === key ? null : key;
                      }}
                    >
                      <span class="th-native">{L.native}</span>
                      {#if L.name !== L.native}
                        <span class="th-name">{L.name}</span>
                      {/if}
                    </button>
                    <div class="th-pop" class:open={openKey === key}>
                      <div class="thp-head">{ui.stationery.langsSwitch}</div>
                      <LangMenu
                        langs={allLangs}
                        marked={selected}
                        anchorCode={$anchor}
                        disabledCodes={selected}
                        open={openKey === key}
                        onPick={(c) => switchColumn(L.code, c)}
                      />
                      <div class="thp-foot">
                        <button
                          type="button"
                          class="thp-remove"
                          tabindex={openKey === key ? 0 : -1}
                          onclick={(e) => {
                            e.stopPropagation();
                            removeColumn(L.code);
                          }}
                        >
                          {ui.stationery.langsRemove}
                        </button>
                      </div>
                    </div>
                  </th>
                {/each}
                {#if canAdd}
                  {@const addKey = `${S.id}|add`}
                  <th class="th-add th-cell" data-thkey={addKey}>
                    <button
                      class="th-addbtn"
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={openKey === addKey}
                      aria-label={ui.stationery.langsAdd}
                      onclick={(e) => {
                        e.stopPropagation();
                        openKey = openKey === addKey ? null : addKey;
                      }}
                    >
                      <span aria-hidden="true">+</span>
                    </button>
                    <div class="th-pop pop-end" class:open={openKey === addKey}>
                      <div class="thp-head">{ui.stationery.langsAdd}</div>
                      <LangMenu
                        langs={allLangs}
                        marked={selected}
                        disabledCodes={selected}
                        open={openKey === addKey}
                        onPick={addColumn}
                      />
                    </div>
                  </th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each items as p (p.id)}
                {@const ac = anchorVariants(p)}
                <tr class="phrase-row">
                  <td class="anchor-cell" dir={anchorDir}>
                    <span class="star-slot"><StarButton phraseId={p.id} /></span>
                    {#if ac}
                      <div class="anchor-word" lang={$anchor} dir="auto">{ac.primary.text}</div>
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
                      <td class="trans-cell empty" dir={L.rtl ? 'rtl' : 'ltr'}></td>
                    {:else}
                      <td class="trans-cell" dir={L.rtl ? 'rtl' : 'ltr'} lang={bcp47(L.code)}>
                        <TranslationCell {vs} langCode={L.code} />
                      </td>
                    {/if}
                  {/each}
                  {#if canAdd}<td class="add-cell"></td>{/if}
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
    text-align: start;
    padding: 13px 22px;
    border-bottom: 1px solid var(--line);
    /* Sticky just below the StickyBar so the column languages stay visible
       while reading a scene's table. */
    position: sticky;
    top: 44px;
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
    font-size: 14px;
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
    font-weight: 500;
    font-size: 9px;
    letter-spacing: 0.14em;
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
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-4px);
    transition:
      opacity 0.18s ease,
      visibility 0.18s ease,
      transform 0.18s ease;
    z-index: 40;
    box-shadow:
      0 20px 48px -24px rgba(31, 26, 20, 0.45),
      0 0 0 1px var(--line-soft);
    letter-spacing: normal;
  }
  .th-pop.open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
  }
  .th-pop.pop-end {
    left: auto;
    right: 0;
  }
  .thp-head {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-mute);
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line-soft);
  }
  .thp-foot {
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px solid var(--line-soft);
  }
  .thp-remove {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-mute);
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 5px 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .thp-remove:hover {
    color: var(--accent);
    border-color: var(--accent);
  }
  .thp-remove:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  /* add-a-language column */
  .col-add {
    width: 46px;
  }
  .th-add {
    text-align: center;
    vertical-align: middle;
  }
  .th-addbtn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px dashed var(--line);
    background: transparent;
    color: var(--ink-mute);
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .th-addbtn:hover {
    color: var(--accent);
    border-color: var(--accent);
    border-style: solid;
  }
  .th-addbtn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .add-cell {
    border-bottom: 1px solid var(--line-soft);
  }
  .phrase-row:last-child .add-cell {
    border-bottom: none;
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
