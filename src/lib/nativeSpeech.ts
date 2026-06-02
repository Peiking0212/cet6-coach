import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { isNativeApp } from '@/lib/isNativeApp'

export function canUseNativeSpeech(): boolean {
  return isNativeApp()
}

/** Map UI rate (0.6–1.2) to Android/iOS TTS rate (~1.0 default). */
export function ttsRateToNative(rate: number): number {
  return Math.min(2, Math.max(0.5, rate))
}

export async function nativeSpeak(
  text: string,
  opts: { rate?: number; lang?: string } = {},
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  await TextToSpeech.stop()
  await TextToSpeech.speak({
    text: trimmed,
    lang: opts.lang ?? 'en-US',
    rate: ttsRateToNative(opts.rate ?? 1),
    pitch: 1,
    volume: 1,
    category: 'playback',
  })
}

export async function nativeStopSpeech(): Promise<void> {
  await TextToSpeech.stop()
}
