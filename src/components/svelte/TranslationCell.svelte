<script lang="ts">
  import VariantRow from './VariantRow.svelte';
  import type { TVariant } from '../../lib/schema';

  interface Props {
    /** Pre-filtered visible variants (parent runs visibleVariants()). */
    vs: TVariant[];
    langCode: string;
  }
  let { vs, langCode }: Props = $props();
</script>

{#each vs as v, i (`${langCode}-${i}-${v.text}`)}
  <VariantRow variant={v} {langCode} />
{/each}
