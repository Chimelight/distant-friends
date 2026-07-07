<script lang="ts">
  import { LANGS, LANG_GROUPS, langTag, fold, editDistance } from '../../lib/lang';
  import ui from '../../content/ui/en.json';
  import type { TLanguage } from '../../lib/schema';

  interface Props {
    /** Codes shown with a filled mark. */
    marked?: Set<string>;
    /** Code shown with the anchor (terracotta) mark. */
    anchorCode?: string;
    /** Codes rendered dimmed + non-interactive (e.g. already shown elsewhere). */
    disabledCodes?: Set<string>;
    onPick: (code: string) => void;
  }
  let { marked = new Set(), anchorCode, disabledCodes = new Set(), onPick }: Props = $props();

  let rootEl = $state<HTMLElement>();
  let query = $state('');
  const q = $derived(fold(query.trim()));
  const matches = (l: TLanguage) =>
    !q || fold(l.native).includes(q) || fold(l.name).includes(q) || l.code.includes(q);

  // Group order comes from the dataset (first occurrence), so a language
  // added under a new region shows up without touching this component.
  const grouped = $derived(
    LANG_GROUPS.map((group) => ({
      group,
      items: LANGS.filter((l) => l.group === group && matches(l)),
    })).filter((g) => g.items.length),
  );

  // Typo rescue: when nothing matches, offer the closest names instead of a
  // dead end ("koraen" → Korean).
  const suggestions = $derived.by(() => {
    if (!q || grouped.length) return [];
    return LANGS.map((l) => ({
      l,
      d: Math.min(editDistance(q, fold(l.name)), editDistance(q, fold(l.native))),
    }))
      .filter((x) => x.d <= 3)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((x) => x.l);
  });

  function pick(code: string) {
    onPick(code);
    query = ''; // reset the filter so the full list is back next time
  }

  // Keyboard: ↓ from the search drops into the list; arrows walk the
  // options in reading order; ↑ past the first option returns to search.
  function onKeydown(e: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const t = e.target as HTMLElement;
    const opts = () => [...rootEl!.querySelectorAll<HTMLElement>('.lm-opt:not(:disabled)')];
    if (t.matches('.lm-search')) {
      if (e.key !== 'ArrowDown') return; // caret keys stay in the input
      e.preventDefault();
      opts()[0]?.focus();
      return;
    }
    if (!t.matches('.lm-opt')) return;
    const list = opts();
    const i = list.indexOf(t);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === 'Home') return list[0]?.focus();
    if (e.key === 'End') return list.at(-1)?.focus();
    const next = i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1);
    if (next < 0) {
      rootEl!.querySelector<HTMLElement>('.lm-search')?.focus();
      return;
    }
    list[Math.min(next, list.length - 1)]?.focus();
  }
</script>

{#snippet opt(L: TLanguage)}
  {@const on = marked.has(L.code)}
  {@const isAnchor = L.code === anchorCode}
  {@const disabled = disabledCodes.has(L.code)}
  <button
    type="button"
    class="lm-opt"
    class:on
    class:is-anchor={isAnchor}
    class:disabled
    aria-pressed={on}
    {disabled}
    aria-label={`${L.name}${on ? ', showing' : ''}${isAnchor ? ', anchor' : ''}`}
    onclick={() => {
      if (disabled) return;
      pick(L.code);
    }}
  >
    <span class="lm-mark" aria-hidden="true"></span>
    <span class="lm-native" lang={langTag(L)} dir={L.rtl ? 'rtl' : 'ltr'}>{L.native}</span>
    {#if L.name !== L.native}<span class="lm-en">{L.name}</span>{/if}
  </button>
{/snippet}

<div class="lm" bind:this={rootEl} onkeydown={onKeydown}>
  <input
    class="lm-search"
    type="text"
    placeholder={ui.stationery.langsSearch}
    bind:value={query}
    aria-label={ui.stationery.langsSearch}
  />

  <div class="lm-list">
    {#each grouped as g (g.group)}
      <div class="lm-grp">
        <div class="lm-grp-h">{g.group}</div>
        <div class="lm-opts">
          {#each g.items as L (L.code)}{@render opt(L)}{/each}
        </div>
      </div>
    {:else}
      <div class="lm-empty">{ui.stationery.langsNoMatch} “{query}”.</div>
      {#if suggestions.length}
        <div class="lm-grp">
          <div class="lm-grp-h">{ui.stationery.langsClosest}</div>
          <div class="lm-opts">
            {#each suggestions as L (L.code)}{@render opt(L)}{/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  /* underlined, letter-like search — not a boxed input */
  .lm-search {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 13px;
    padding: 4px 2px 7px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 14.5px;
    color: var(--ink);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
  }
  .lm-search::placeholder {
    color: var(--ink-mute);
  }
  .lm-search:focus-visible {
    outline: none;
    border-bottom-color: var(--accent);
  }

  .lm-grp + .lm-grp {
    margin-top: 14px;
  }
  .lm-grp-h {
    font-family: var(--font-sans);
    font-size: var(--label-size);
    font-weight: var(--label-weight);
    letter-spacing: var(--label-track);
    text-transform: uppercase;
    color: var(--gold-ink);
    margin-bottom: 7px;
  }
  /* a tidy 2-column index, not wrapping chips */
  .lm-opts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 2px 8px;
  }

  .lm-opt {
    display: flex;
    align-items: baseline;
    gap: 9px;
    padding: 6px 9px;
    border: none;
    border-radius: 5px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
  }
  .lm-mark {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1px solid var(--ink-mute);
    flex-shrink: 0;
    align-self: center;
    transition: all 0.15s ease;
  }
  /* native name upright (italic faked CJK badly) — serif, the protagonist */
  .lm-native {
    font-family: var(--font-serif);
    font-size: 15.5px;
    line-height: 1.2;
    letter-spacing: 0.005em;
    color: var(--ink-soft);
    transition: color 0.15s ease;
  }
  /* English exonym: a quiet serif-italic aside, same voice as the tag lines */
  .lm-en {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 12px;
    color: var(--ink-mute);
  }
  .lm-opt:hover {
    background: rgba(166, 130, 74, 0.08);
  }
  .lm-opt:hover .lm-native {
    color: var(--ink);
  }
  .lm-opt:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .lm-opt.on {
    background: rgba(166, 130, 74, 0.13);
  }
  .lm-opt.on .lm-native {
    color: var(--ink);
  }
  .lm-opt.on .lm-mark {
    background: var(--gold);
    border-color: var(--gold);
  }
  .lm-opt.is-anchor .lm-mark {
    background: var(--accent);
    border-color: var(--accent);
  }
  .lm-opt.is-anchor .lm-native {
    color: var(--accent);
  }
  /* already-shown (in a column switch): marked but not re-pickable */
  .lm-opt.disabled {
    cursor: default;
  }
  .lm-opt.disabled:hover {
    background: rgba(166, 130, 74, 0.13);
  }
  .lm-opt.disabled:hover .lm-native {
    color: var(--ink);
  }

  .lm-empty {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    color: var(--ink-mute);
    padding: 6px 2px 10px;
  }
</style>
