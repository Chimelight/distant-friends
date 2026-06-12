<script lang="ts">
  import LangChips from './LangChips.svelte';
  import SlotPicker from './SlotPicker.svelte';
  import { anchor, tone, speakerGender, addresseeGender, selectedLangs } from '../../lib/stores';
  import type { ToneFilter, GenderFilter } from '../../lib/filter';
  import languages from '../../data/languages.json';
  import ui from '../../content/ui/en.json';

  // Anchor options restricted to currently-selected languages — adding a new
  // language goes through LangChips, switching focus among them goes through
  // here. This sidesteps the cap-bypass that would happen if "Anchored in"
  // could pull in a 6th language through the back door.
  const anchorOptions = $derived(
    languages
      .filter((l) => ($selectedLangs ?? []).includes(l.code))
      .map((l) => ({ key: l.code, label: l.native })),
  );
  const toneOptions: { key: ToneFilter; label: string }[] = [
    { key: 'any', label: ui.stationery.tones.any },
    { key: 'close', label: ui.stationery.tones.close },
    { key: 'casual', label: ui.stationery.tones.casual },
    { key: 'neutral', label: ui.stationery.tones.neutral },
    { key: 'polite', label: ui.stationery.tones.polite },
  ];

  const speakerOptions: { key: GenderFilter; label: string }[] = [
    { key: 'any', label: ui.stationery.speakers.any },
    { key: 'm', label: ui.stationery.speakers.m },
    { key: 'f', label: ui.stationery.speakers.f },
  ];
  const addresseeOptions: { key: GenderFilter; label: string }[] = [
    { key: 'any', label: ui.stationery.addressees.any },
    { key: 'm', label: ui.stationery.addressees.m },
    { key: 'f', label: ui.stationery.addressees.f },
  ];

  function setAnchor(code: string) {
    anchor.set(code);
  }
  function setTone(t: ToneFilter) {
    tone.set(t);
  }
  function setSpeaker(g: GenderFilter) {
    speakerGender.set(g);
  }
  function setAddressee(g: GenderFilter) {
    addresseeGender.set(g);
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
      name="addressee"
      options={addresseeOptions}
      value={$addresseeGender}
      onChange={setAddressee}
    />
    <span class="punct">,</span>
    <em>{ui.stationery.asWord}</em>
    <SlotPicker
      name="speaker"
      options={speakerOptions}
      value={$speakerGender}
      onChange={setSpeaker}
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
