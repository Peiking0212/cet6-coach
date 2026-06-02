import { useExamAudioWeb } from './useExamAudioWeb'

/**
 * Exam MP3 playback. Uses HTML5 Audio in browser and inside the Capacitor WebView
 * (reliable for bundled dist/audio). @capgo/native-audio cannot load https://localhost
 * assets on Android and shows a stuck notification with no sound.
 */
export function useExamAudio(audioUrl?: string) {
  return useExamAudioWeb(audioUrl)
}
