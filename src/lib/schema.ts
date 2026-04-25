import { z } from 'zod';

export const Tone = z.enum(['close', 'casual', 'neutral', 'polite']);
export const Gender = z.enum(['m', 'f']);
export const Count = z.enum(['one', 'many']);

export const Variant = z.object({
  text: z.string().min(1),
  rom: z.string().optional(),
  tone: Tone.optional(),
  speakerGender: Gender.optional(),
  addresseeGender: Gender.optional(),
  addresseeCount: Count.optional(),
  region: z.string().optional(),
  note: z.string().optional(),
  reviewed: z.boolean().optional(),
});

export const LangTrans = z.object({
  gloss: z.string(),
  variants: z.array(Variant).min(1),
});

export const Phrase = z.object({
  id: z.string(),
  scene: z.string(),
  order: z.number().int(),
  trans: z.record(z.string(), LangTrans),
});

export const Language = z.object({
  code: z.string(),
  native: z.string(),
  tts: z.string(),
  rtl: z.boolean().default(false),
  defaultOn: z.boolean().default(false),
  defaultAnchor: z.boolean().default(false),
});

export const Scene = z.object({
  id: z.string(),
  num: z.string(),
  title: z.string(),
  em: z.string(),
});

export const PhrasesFile = z.array(Phrase);
export const LanguagesFile = z.array(Language);
export const ScenesFile = z.array(Scene);

export type TVariant = z.infer<typeof Variant>;
export type TLangTrans = z.infer<typeof LangTrans>;
export type TPhrase = z.infer<typeof Phrase>;
export type TLanguage = z.infer<typeof Language>;
export type TScene = z.infer<typeof Scene>;
export type TTone = z.infer<typeof Tone>;
