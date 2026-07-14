<script lang="ts">
  import LanguagePicker from './LanguagePicker.svelte';
  import SlotPicker from './SlotPicker.svelte';
  import { anchor, tone, speakerGender, addresseeGender, selectedLangs, markFreshLang } from '../../lib/stores';
  import { langsByCodes, langTag } from '../../lib/lang';
  import { toneOptions, speakerOptions, addresseeOptions } from '../../lib/slot-options';
  import type { ToneFilter, GenderFilter } from '../../lib/filter';
  import ui from '../../content/ui/en.json';

  // Anchor options restricted to currently-selected languages — adding a new
  // language goes through LanguagePicker, switching focus among them goes
  // through here. This sidesteps the cap-bypass that would happen if "Anchored in"
  // could pull in a 6th language through the back door. Listed in column
  // order: anchor first, then the selection in its own order.
  const anchorOptions = $derived(
    langsByCodes([$anchor, ...($selectedLangs ?? []).filter((c) => c !== $anchor)]).map(
      (l) => ({
        key: l.code,
        label: l.native,
        lang: langTag(l),
        dir: l.rtl ? ('rtl' as const) : ('ltr' as const),
      }),
    ),
  );
  function setAnchor(code: string) {
    if (code !== anchor.get()) markFreshLang(code); // promoted column writes in
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
  <LanguagePicker />

  <!-- .tie groups keep a slot with its surrounding word/punctuation, so a
       mobile wrap can never strand ", as myself" or a bare "—" at a line
       start — lines break only between whole phrase groups. -->
  <p class="prose">
    <span class="tie">
      <em>{ui.stationery.anchoredIn}</em>
      <SlotPicker
        name="anchor"
        options={anchorOptions}
        value={$anchor}
        onChange={setAnchor}
      /><span class="punct">.</span>
    </span>
  </p>
  <p class="prose">
    <span class="tie">
      <em>{ui.stationery.iWrite}</em>
      <!-- .dash: the em-dash pair is a one-line rhetorical pause; once the
           sentence wraps (mobile) a dash dangling at a line end reads as a
           strikethrough, so narrow screens drop the pair -->
      <span class="punct dash">—</span>
    </span>
    <span class="tie">
      <SlotPicker
        name="tone"
        options={toneOptions}
        value={$tone}
        onChange={setTone}
      />
      <span class="punct dash">—</span>
    </span>
    <span class="tie">
      <em>{ui.stationery.to}</em>
      <SlotPicker
        name="addressee"
        options={addresseeOptions}
        value={$addresseeGender}
        onChange={setAddressee}
      /><span class="punct">,</span>
    </span>
    <span class="tie">
      <em>{ui.stationery.asWord}</em>
      <SlotPicker
        name="speaker"
        options={speakerOptions}
        value={$speakerGender}
        onChange={setSpeaker}
      /><span class="punct">.</span>
    </span>
  </p>
</section>

<style>
  .stationery {
    margin: 56px auto 0;
    padding: 0 12px;
    text-align: center;
    max-width: 760px;
    /* entrance choreography, third beat (mark → tagline → here → toc) */
    animation: rise 0.6s var(--ease-out) backwards 0.27s;
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
    /* when the sentence must wrap (mobile), break it into even lines
       instead of a long line + orphan ("as myself ." used to sit alone) */
    text-wrap: balance;
  }
  .prose:last-child {
    margin-bottom: 0;
  }
  .prose em {
    font-style: italic;
  }
  .prose .tie {
    white-space: nowrap;
  }
  .prose .punct {
    color: var(--ink-mute);
  }
  /* pull sentence punctuation back toward the slot it follows — the slot's
     hover padding + caret otherwise leave the period floating mid-air */
  .prose :global(.slot-wrap + .punct) {
    margin-left: -5px;
  }
  @media (max-width: 640px) {
    .stationery {
      margin-top: 32px;
    }
    .prose {
      font-size: 18px;
      line-height: 1.55;
      margin-bottom: 10px; /* the three sentences read as strophes, not one blob */
    }
    .prose .punct.dash {
      display: none;
    }
  }
</style>
