/** Resolve public-folder paths (e.g. /audio/...) against Vite base for GitHub Pages subpaths. */
export function assetUrl(path: string | undefined): string | undefined {
  if (!path?.trim()) return path
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.BASE_URL
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}
