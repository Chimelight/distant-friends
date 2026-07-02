// Shared option lists for the Stationery sentence and its StickyBar echo —
// they were drifting apart as three hand-copied arrays.
import ui from '../content/ui/en.json';
import type { ToneFilter, GenderFilter } from './filter';

export type SlotOption<T extends string> = { key: T; label: string };

export const toneOptions: SlotOption<ToneFilter>[] = [
  { key: 'any', label: ui.stationery.tones.any },
  { key: 'casual', label: ui.stationery.tones.casual },
  { key: 'neutral', label: ui.stationery.tones.neutral },
  { key: 'polite', label: ui.stationery.tones.polite },
];

export const speakerOptions: SlotOption<GenderFilter>[] = [
  { key: 'any', label: ui.stationery.speakers.any },
  { key: 'm', label: ui.stationery.speakers.m },
  { key: 'f', label: ui.stationery.speakers.f },
];

export const addresseeOptions: SlotOption<GenderFilter>[] = [
  { key: 'any', label: ui.stationery.addressees.any },
  { key: 'm', label: ui.stationery.addressees.m },
  { key: 'f', label: ui.stationery.addressees.f },
];
