<script lang="ts">
  import LangChips from './LangChips.svelte';
  import SlotPicker from './SlotPicker.svelte';
  import {
    anchor,
    tone,
    addressee,
    selectedLangs,
  } from '../../lib/stores';
  import type { ToneFilter, AddresseeFilter } from '../../lib/filter';
  import languages from '../../data/languages.json';
  import ui from '../../content/ui/en.json';

  const anchorOptions = languages.map((l) => ({ key: l.code, label: l.native }));
  const toneOptions: { key: ToneFilter; label: string }[] = [
    { key: 'any', label: ui.stationery.tones.any },
    { key: 'close', label: ui.stationery.tones.close },
    { key: 'casual', label: ui.stationery.tones.casual },
    { key: 'neutral', label: ui.stationery.tones.neutral },
    { key: 'polite', label: ui.stationery.tones.polite },
  ];
  const addrOptions: { key: AddresseeFilter; label: string }[] = [
    { key: 'friend', label: ui.stationery.addressees.friend },
    { key: 'woman', label: ui.stationery.addressees.woman },
    { key: 'man', label: ui.stationery.addressees.man },
    { key: 'everyone', label: ui.stationery.addressees.everyone },
  ];

  function setAnchor(code: string) {
    anchor.set(code);
    const set = new Set(selectedLangs.get() ?? []);
    set.add(code);
    selectedLangs.set([...set]);
  }
  function setTone(t: ToneFilter) {
    tone.set(t);
  }
  function setAddr(a: AddresseeFilter) {
    addressee.set(a);
  }
</script>

<section class="stationery">
  <LangChips />

  <p class="prose">
    <em>{ui.stationery.anchoredIn}</em>
    <SlotPicker
      name="anchor"
      options={anchorOptions}
      value={$anchor}
      onChange={setAnchor}
    />
    <span class="punct">.</span>
  </p>
  <p class="prose">
    <em>{ui.stationery.iWrite}</em>
    <span class="punct">—</span>
    <SlotPicker
      name="tone"
      options={toneOptions}
      value={$tone}
      onChange={setTone}
    />
    <span class="punct">—</span>
    <em>{ui.stationery.to}</em>
    <SlotPicker
      name="addr"
      options={addrOptions}
      value={$addressee}
      onChange={setAddr}
    />
    <span class="punct">.</span>
  </p>
</section>

<style>
  .stationery {
    margin: 56px auto 0;
    padding: 0 12px;
    text-align: center;
    max-width: 760px;
  }
  .prose {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 300;
    font-size: clamp(19px, 2.2vw, 26px);
    line-height: 1.7;
    margin: 0 0 6px;
    color: var(--ink-soft);
    letter-spacing: 0.005em;
  }
  .prose:last-child {
    margin-bottom: 0;
  }
  .prose em {
    font-style: italic;
  }
  .prose .punct {
    color: var(--ink-mute);
  }
  @media (max-width: 640px) {
    .stationery {
      margin-top: 40px;
    }
    .prose {
      line-height: 1.8;
    }
  }
</style>
