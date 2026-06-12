<script lang="ts">
  import { starred, toggleStar } from '../../lib/stores';

  interface Props {
    phraseId: string;
  }
  let { phraseId }: Props = $props();

  const isStarred = $derived($starred.includes(phraseId));
</script>

<button
  class="star"
  class:on={isStarred}
  type="button"
  aria-pressed={isStarred}
  aria-label={isStarred ? 'Unstar this phrase' : 'Star this phrase'}
  onclick={() => toggleStar(phraseId)}
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
</style>
