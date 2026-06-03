import { isNativeApp } from '@/lib/isNativeApp'
import { useExamAudioNative } from './useExamAudioNative'
import { useExamAudioWeb } from './useExamAudioWeb'

/**
 * Exam MP3 playback. Uses HTML5 Audio in browser and inside the Capacitor WebView
 * (reliable for bundled dist/audio). @capgo/native-audio cannot load https://localhost
 * assets on Android and shows a stuck notification with no sound.
 */
export function useExamAudio(audioUrl?: string) {
  const native = isNativeApp()
  const web = useExamAudioWeb(native ? undefined : audioUrl)
  const nat = useExamAudioNative(native ? audioUrl : undefined)
  return native ? nat : web
}
