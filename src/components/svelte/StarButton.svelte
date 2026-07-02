<script lang="ts">
  import { onMount } from 'svelte';
  import { starred, toggleStar } from '../../lib/stores';

  interface Props {
    phraseId: string;
  }
  let { phraseId }: Props = $props();

  const isStarred = $derived($starred.includes(phraseId));

  // Transient celebration on STARRING only (not unstar, not initial render).
  let burst = $state(false);
  let burstTimer: number | undefined;
  onMount(() => () => clearTimeout(burstTimer));

  function onClick() {
    const turningOn = !isStarred;
    toggleStar(phraseId);
    if (turningOn) {
      burst = false; // restart the animation if re-starred quickly
      requestAnimationFrame(() => (burst = true));
      clearTimeout(burstTimer);
      burstTimer = window.setTimeout(() => (burst = false), 700);
    }
  }
</script>

<button
  class="star"
  class:on={isStarred}
  class:burst
  type="button"
  aria-pressed={isStarred}
  aria-label={isStarred ? 'Unstar this phrase' : 'Star this phrase'}
  onclick={onClick}
>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M8 1.8l1.86 3.92 4.14.55-3.04 2.98.76 4.27L8 11.46l-3.72 2.04.76-4.27L2 6.27l4.14-.55z"
      fill={isStarred ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="1.1"
      stroke-linejoin="round"
    />
  </svg>
</button>

<style>
  .star {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--gold);
    opacity: 0.35;
    cursor: pointer;
    transition:
      opacity var(--dur-hover) var(--ease-out),
      transform var(--dur-hover) var(--ease-out);
  }
  .star svg {
    width: 15px;
    height: 15px;
  }
  .star:hover {
    opacity: 0.9;
    transform: scale(1.12);
  }
  .star:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 3px;
    opacity: 0.9;
  }
  .star.on {
    opacity: 0.95;
  }
  /* No hover on touch — keep the affordance visible. */
  @media (hover: none) {
    .star {
      opacity: 0.5;
    }
  }

  /* —— starring celebration: the star pops, six gold ink specks fly out ——
     (CSS-only; the global reduced-motion override collapses it to an
     instant fill) */
  .star.burst svg {
    animation: star-pop 0.45s var(--ease-spring);
  }
  .star::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4px;
    height: 4px;
    margin: -2px 0 0 -2px;
    border-radius: 50%;
    pointer-events: none;
  }
  .star.burst::after {
    animation: speck-burst 0.6s ease-out forwards;
  }
  @keyframes star-pop {
    0% {
      transform: scale(0.7);
    }
    55% {
      transform: scale(1.32);
    }
    100% {
      transform: scale(1);
    }
  }
  /* six specks emerge from behind the star, scatter, hold, then vanish */
  @keyframes speck-burst {
    0% {
      box-shadow:
        0 0 0 -1px var(--gold),
        0 0 0 -1px var(--gold),
        0 0 0 -1px var(--gold),
        0 0 0 -1px var(--gold),
        0 0 0 -1px var(--gold),
        0 0 0 -1px var(--gold);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    65% {
      opacity: 1;
    }
    100% {
      box-shadow:
        13px 0 0 0 var(--gold),
        6.5px 11.3px 0 0 var(--gold),
        -6.5px 11.3px 0 0 var(--gold),
        -13px 0 0 0 var(--gold),
        -6.5px -11.3px 0 0 var(--gold),
        6.5px -11.3px 0 0 var(--gold);
      opacity: 0;
    }
  }
</style>
