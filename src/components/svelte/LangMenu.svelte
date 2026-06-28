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
              if (!disabled) onPick(L.code);
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
  .lm-search {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 10px;
    padding: 7px 12px;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 999px;
  }
  .lm-search::placeholder {
    color: var(--ink-mute);
  }
  .lm-search:focus-visible {
    outline: none;
    border-color: var(--accent);
  }

  .lm-grp + .lm-grp {
    margin-top: 10px;
  }
  .lm-grp-h {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-mute);
    margin-bottom: 5px;
  }
  .lm-opts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
  }

  .lm-opt {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 11px 5px 9px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    font-family: var(--font-serif);
    color: var(--ink-soft);
    transition: all 0.15s ease;
  }
  .lm-mark {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1.5px solid var(--ink-mute);
    flex-shrink: 0;
    align-self: center;
    transition: all 0.15s ease;
  }
  .lm-native {
    font-size: 15px;
    font-style: italic;
  }
  .lm-en {
    font-family: var(--font-sans);
    font-size: 10.5px;
    color: var(--ink-mute);
    letter-spacing: 0.01em;
  }
  .lm-opt:hover {
    background: rgba(176, 82, 46, 0.07);
    color: var(--ink);
  }
  .lm-opt:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  /* Selected: a clear filled pill, not just a dot (was too subtle). */
  .lm-opt.on {
    background: rgba(166, 130, 74, 0.14);
    border-color: var(--gold);
    color: var(--ink);
  }
  .lm-opt.on .lm-mark {
    background: var(--gold);
    border-color: var(--gold);
  }
  .lm-opt.is-anchor.on {
    background: rgba(176, 82, 46, 0.14);
    border-color: var(--accent);
  }
  .lm-opt.is-anchor .lm-mark {
    background: var(--accent);
    border-color: var(--accent);
  }
  .lm-opt.is-anchor .lm-native {
    color: var(--accent);
  }
  .lm-opt.disabled {
    opacity: 0.42;
    cursor: default;
  }
  .lm-opt.disabled:hover {
    background: transparent;
    color: var(--ink-soft);
  }

  .lm-empty {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 13px;
    color: var(--ink-mute);
    padding: 6px 2px;
  }
</style>
