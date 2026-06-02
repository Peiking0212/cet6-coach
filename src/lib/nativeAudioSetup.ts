import { isNativeApp } from '@/lib/isNativeApp'

/** No-op: exam audio uses HTML5 in the WebView; native-audio caused silent playback on Android. */
export async function configureNativeAudio(): Promise<void> {
  if (!isNativeApp()) return
}
