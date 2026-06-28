<script lang="ts" generics="T extends string">
  import { onMount } from 'svelte';

  interface Option {
    key: T;
    label: string;
  }

  interface Props {
    name: string;
    options: Option[];
    value: T;
    onChange: (key: T) => void;
  }

  let { name, options, value, onChange }: Props = $props();

  let open = $state(false);
  let pulsing = $state(false);
  let slotEl: HTMLElement | undefined = $state();
  let pulseTimer: number | undefined;

  const currentLabel = $derived(
    options.find((o) => o.key === value)?.label ?? value,
  );

  function toggle(e: MouseEvent) {
    e.stopPropagation();
    open = !open;
  }

  async function pick(opt: Option, e: Event) {
    e.stopPropagation();
    onChange(opt.key);
    open = false;
    pulsing = true;
    clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => (pulsing = false), 400);
  }

  function onDocClick(e: MouseEvent) {
    if (!slotEl) return;
    if (slotEl.contains(e.target as Node)) return;
    open = false;
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }

  onMount(() => {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
      clearTimeout(pulseTimer);
    };
  });
</script>

<!-- Wrapper (not a button) so the trigger and the menu items are siblings,
     never nested interactive controls (WCAG / valid HTML). -->
<span class="slot-wrap" bind:this={slotEl}>
  <button
    class="slot"
    class:pulse={pulsing}
    data-slot={name}
    aria-haspopup="true"
    aria-expanded={open}
    onclick={toggle}
    type="button"
  >
    <span class="slot-label">{currentLabel}</span>
  </button>
  <span class="popover" role="menu">
    {#each options as opt (opt.key)}
      <button
        type="button"
        class="popover-item"
        role="menuitemradio"
        aria-checked={opt.key === value}
        tabindex={open ? 0 : -1}
        onclick={(e) => pick(opt, e)}
      >
        {opt.label}
      </button>
    {/each}
  </span>
</span>

<style>
  .slot-wrap {
    position: relative;
    display: inline-block;
    margin: 0 2px;
  }
  .slot {
    font: inherit;
    background: transparent;
    border: none;
    border-bottom: 1px dashed var(--ink-mute);
    padding: 1px 6px 2px;
    color: var(--accent);
    cursor: pointer;
    transition: all var(--dur-switch) ease;
    font-style: italic;
  }
  .slot::after {
    content: "▾";
    font-size: 0.55em;
    margin-left: 5px;
    color: var(--ink-mute);
    opacity: 0.5;
    transition: all var(--dur-switch) ease;
    font-style: normal;
    vertical-align: middle;
  }
  /* Lighter highlight, not a darkening tint, so the accent text keeps AA. */
  .slot:hover {
    background: var(--paper-up);
    border-bottom-color: var(--accent);
  }
  .slot:hover::after {
    opacity: 1;
    color: var(--accent);
    transform: translateY(1px);
  }
  .slot:focus-visible {
    outline: none;
    background: var(--paper-up);
    border-bottom-style: solid;
  }
  .slot.pulse {
    animation: pulse var(--dur-feedback) ease;
  }

  .popover {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(-4px);
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 6px 0;
    min-width: 160px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
    z-index: 50;
    box-shadow:
      0 18px 40px -20px rgba(31, 26, 20, 0.35),
      0 0 0 1px var(--line-soft);
  }
  .popover::before {
    content: "";
    position: absolute;
    top: -5px;
    left: 50%;
    width: 8px;
    height: 8px;
    background: var(--paper-up);
    transform: translateX(-50%) rotate(45deg);
    border-left: 1px solid var(--line);
    border-top: 1px solid var(--line);
  }
  .slot[aria-expanded="true"] + .popover {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
  }

  .popover-item {
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 15px;
    color: var(--ink-soft);
    padding: 8px 18px;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.005em;
  }
  .popover-item:hover {
    background: rgba(176, 82, 46, 0.08);
    color: var(--ink);
  }
  .popover-item[aria-checked="true"] {
    color: var(--accent);
    font-weight: 500;
  }
  .popover-item[aria-checked="true"]::before {
    content: "·";
    margin-right: 6px;
    color: var(--accent);
  }
</style>
