import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { STORE_KEY } from '@/store/defaults'

export const EXAM_SET_FILTER_KEY = 'cet6-exam-set-filter'

const cache = new Map<string, string>()

function usePreferences(): boolean {
  return Capacitor.isNativePlatform()
}

/** Load native Preferences (+ one-time migration from WebView localStorage). */
export async function initAppStorage(): Promise<void> {
  if (!usePreferences()) return

  for (const key of [STORE_KEY, EXAM_SET_FILTER_KEY]) {
    let legacy: string | null = null
    try {
      legacy = localStorage.getItem(key)
    } catch {
      legacy = null
    }
    const { value } = await Preferences.get({ key })
    if (legacy && !value) {
      await Preferences.set({ key, value: legacy })
    }
    const final = value ?? legacy
    if (final != null) cache.set(key, final)
  }
}

export function storageGetSync(key: string): string | null {
  if (cache.has(key)) return cache.get(key)!
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function storageGet(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!
  if (usePreferences()) {
    const { value } = await Preferences.get({ key })
    if (value != null) cache.set(key, value)
    return value
  }
  return storageGetSync(key)
}

export async function storageSet(key: string, value: string): Promise<void> {
  cache.set(key, value)
  if (usePreferences()) {
    await Preferences.set({ key, value })
  }
  try {
    localStorage.setItem(key, value)
  } catch {
    /* quota */
  }
}

export async function storageRemove(key: string): Promise<void> {
  cache.delete(key)
  if (usePreferences()) await Preferences.remove({ key })
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
