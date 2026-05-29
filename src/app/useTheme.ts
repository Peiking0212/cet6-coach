import { useEffect } from 'react'
import { useStore } from '@/store/StoreProvider'

export function useApplyTheme() {
  const { state } = useStore()
  const theme = state.theme

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const resolve = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      root.setAttribute('data-theme', dark ? 'dark' : 'light')
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', dark ? '#221b29' : '#ff6fa5')
    }
    resolve()
    if (theme === 'system') {
      mq.addEventListener('change', resolve)
      return () => mq.removeEventListener('change', resolve)
    }
  }, [theme])
}
