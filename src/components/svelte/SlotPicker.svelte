<script lang="ts" generics="T extends string">
  import { onMount, tick } from 'svelte';
  import { openPopover, togglePopover, closePopover, popover, menuKeys } from '../../lib/popover';

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

  // Unique per instance: the same slot (e.g. "tone") renders in both the
  // Stationery and the StickyBar, and popover ids must not collide.
  const uid = $props.id();
  const id = `slot-${name}-${uid}`;
  const open = $derived($openPopover === id);

  let pulsing = $state(false);
  let triggerEl = $state<HTMLElement>();
  let popEl = $state<HTMLElement>();
  let pulseTimer: number | undefined;
  onMount(() => () => clearTimeout(pulseTimer));

  const currentLabel = $derived(
    options.find((o) => o.key === value)?.label ?? value,
  );

  // Menu-button keyboard contract: opening with the keyboard moves focus to
  // the checked item (mouse opens leave focus on the trigger).
  async function focusChecked() {
    await tick();
    popEl?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }

  function onTriggerClick(e: MouseEvent) {
    togglePopover(id);
    // detail === 0 → the click came from Enter/Space, not a pointer.
    if (openPopover.get() === id && e.detail === 0) focusChecked();
  }

  function onTriggerKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    openPopover.set(id);
    focusChecked();
  }

  function pick(opt: Option) {
    onChange(opt.key);
    closePopover();
    triggerEl?.focus();
    pulsing = true;
    clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => (pulsing = false), 400);
  }
</script>

<!-- Wrapper (not a button) so the trigger and the menu items are siblings,
     never nested interactive controls (WCAG / valid HTML). -->
<span class="slot-wrap" use:popover={id}>
  <button
    class="slot"
    class:pulse={pulsing}
    data-slot={name}
    aria-haspopup="menu"
    aria-expanded={open}
    bind:this={triggerEl}
    onclick={onTriggerClick}
    onkeydown={onTriggerKeydown}
    type="button"
  >
    <span class="slot-label">{currentLabel}</span>
  </button>
  {#if open}
    <span class="popover" role="menu" use:menuKeys bind:this={popEl}>
      {#each options as opt (opt.key)}
        <button
          type="button"
          class="popover-item"
          role="menuitemradio"
          aria-checked={opt.key === value}
          onclick={() => pick(opt)}
        >
          {opt.label}
        </button>
      {/each}
    </span>
  {/if}
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
    padding: 1px 6px 3px;
    color: var(--accent);
    cursor: pointer;
    transition: all var(--dur-switch) ease;
    font-style: italic;
    /* hand-inked underline — a pen squiggle, not a mechanical dash row;
       native decoration so it wraps and skips descenders correctly */
    text-decoration: underline;
    text-decoration-style: wavy;
    text-decoration-color: var(--ink-mute);
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
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
    /* atomic inline: the caret is UI, keep it clear of the written line */
    display: inline-block;
  }
  /* Lighter highlight, not a darkening tint, so the accent text keeps AA. */
  .slot:hover {
    background: var(--paper-up);
    text-decoration-color: var(--accent);
  }
  .slot:hover::after {
    opacity: 1;
    color: var(--accent);
    transform: translateY(1px);
  }
  .slot:focus-visible {
    outline: none;
    background: var(--paper-up);
    text-decoration-style: solid;
  }
  .slot.pulse {
    animation: pulse var(--dur-feedback) ease;
  }

  /* mounted only while open */
  .popover {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--paper-up);
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 6px 0;
    min-width: 160px;
    z-index: 50;
    box-shadow:
      0 18px 40px -20px rgba(31, 26, 20, 0.35),
      0 0 0 1px var(--line-soft);
    animation: popover-in 0.2s ease;
  }
  @keyframes popover-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-4px);
    }
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
