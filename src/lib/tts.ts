// Web Speech API wrapper. Voices load asynchronously (and on some browsers
// only after a `voiceschanged` event), so availability is exposed as a store
// the SpeakButton can subscribe to. A language is considered available on an
// exact BCP 47 match or a base-language match (a "pt-PT" voice can read
// pt-BR text; better than no audio at all).
import { atom } from 'nanostores';

export const ttsLangs = atom<ReadonlySet<string>>(new Set());

let inited = false;
let voices: SpeechSynthesisVoice[] = [];

function normalize(tag: string): string {
  return tag.toLowerCase().replace('_', '-');
}

export function initVoices(): void {
  if (inited || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  inited = true;
  const collect = () => {
    voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    const set = new Set<string>();
    for (const v of voices) {
      const tag = normalize(v.lang);
      set.add(tag);
      set.add(tag.split('-')[0]);
    }
    ttsLangs.set(set);
  };
  collect();
  window.speechSynthesis.addEventListener('voiceschanged', collect);
}

/** True if `tts` (e.g. "ja-JP") has an exact or base-language voice. */
export function isAvailable(langs: ReadonlySet<string>, tts: string): boolean {
  const want = normalize(tts);
  return langs.has(want) || langs.has(want.split('-')[0]);
}

/**
 * Speak `text` with the best voice for `tts`. Cancels anything currently
 * speaking (one utterance at a time, app-wide). `onDone` fires on natural
 * end, on error, and when cancelled by a newer utterance.
 */
export function speak(text: string, tts: string, onDone: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const want = normalize(tts);
  const base = want.split('-')[0];
  const voice =
    voices.find((v) => normalize(v.lang) === want) ??
    voices.find((v) => normalize(v.lang).split('-')[0] === base);
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? tts;
  u.rate = 0.9;
  u.pitch = 1;
  u.onend = onDone;
  u.onerror = onDone;
  synth.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
