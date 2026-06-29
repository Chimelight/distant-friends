<script lang="ts">
  import type { TLanguage } from '../../lib/schema';

  interface Props {
    /** Languages to render (already scoped by the parent). */
    langs: TLanguage[];
    /** Codes shown with a filled mark. */
    marked?: Set<string>;
    /** Code shown with the anchor (terracotta) mark. */
    anchorCode?: string;
    /** Codes rendered dimmed + non-interactive (e.g. already shown elsewhere). */
    disabledCodes?: Set<string>;
    /** Whether the containing popover is open — drives tabindex + search reset. */
    open: boolean;
    onPick: (code: string) => void;
    searchable?: boolean;
  }
  let {
    langs,
    marked = new Set(),
    anchorCode,
    disabledCodes = new Set(),
    open,
    onPick,
    searchable = true,
  }: Props = $props();

  // Mizo's `code` is not a valid BCP-47 subtag; tag it ISO 639-3 "lus".
  const bcp47 = (code: string) => (code === 'mizo' ? 'lus' : code);

  const GROUP_ORDER = [
    'East Asia',
    'Europe',
    'West & Central Asia',
    'South Asia',
    'Southeast Asia',
  ];

  let query = $state('');
  const q = $derived(query.trim().toLowerCase());
  const matches = (l: TLanguage) =>
    !q ||
    l.native.toLowerCase().includes(q) ||
    l.name.toLowerCase().includes(q) ||
    l.code.includes(q);

  const grouped = $derived(
    GROUP_ORDER.map((group) => ({
      group,
      items: langs.filter((l) => l.group === group && matches(l)),
    })).filter((g) => g.items.length),
  );

  // Clear the query whenever the popover closes, so it reopens fresh.
  $effect(() => {
    if (!open) query = '';
  });
</script>

{#if searchable}
  <input
    class="lm-search"
    type="text"
    placeholder="Search languages…"
    bind:value={query}
    tabindex={open ? 0 : -1}
    aria-label="Search languages"
    onclick={(e) => e.stopPropagation()}
  />
{/if}

<div class="lm-list">
  {#each grouped as g (g.group)}
    <div class="lm-grp">
      <div class="lm-grp-h">{g.group}</div>
      <div class="lm-opts">
        {#each g.items as L (L.code)}
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
            tabindex={open && !disabled ? 0 : -1}
            aria-label={`${L.name}${on ? ', showing' : ''}${isAnchor ? ', anchor' : ''}`}
            onclick={(e) => {
              e.stopPropagation();
              if (disabled) return;
              onPick(L.code);
              query = ''; // reset the filter so the full list is back next time
            }}
          >
            <span class="lm-mark" aria-hidden="true"></span>
            <span class="lm-native" lang={bcp47(L.code)} dir={L.rtl ? 'rtl' : 'ltr'}>{L.native}</span>
            {#if L.name !== L.native}<span class="lm-en">{L.name}</span>{/if}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="lm-empty">No language matches “{query}”.</div>
  {/each}
</div>

<style>
  /* underlined, letter-like search — not a boxed input */
  .lm-search {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 13px;
    padding: 4px 2px 6px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 14px;
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
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--gold-ink);
    margin-bottom: 6px;
  }
  /* a tidy 2-column index, not wrapping chips */
  .lm-opts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 1px 6px;
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
    font-size: 16px;
    line-height: 1.15;
    color: var(--ink-soft);
    transition: color 0.15s ease;
  }
  /* English exonym: a quiet serif-italic aside, same voice as the tag lines */
  .lm-en {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 11.5px;
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
    padding: 6px 2px;
  }
</style>
