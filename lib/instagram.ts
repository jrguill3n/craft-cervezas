const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'm.instagram.com'])

export function normalizeInstagramUrl(value: string) {
  const input = value.trim()
  if (!input) return ''

  let url: URL
  try {
    url = new URL(input)
  } catch {
    return input
  }

  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || !INSTAGRAM_HOSTS.has(host)) return input

  const segments = url.pathname.split('/').filter(Boolean)
  const [first, second] = segments

  if (first === 'p' && second) {
    return `https://www.instagram.com/p/${second}/`
  }

  if ((first === 'reel' || first === 'reels') && second) {
    return `https://www.instagram.com/reel/${second}/`
  }

  if (first && !first.startsWith('@')) {
    return `https://www.instagram.com/${first}/`
  }

  return 'https://www.instagram.com/'
}

export function isInstagramUrl(value: string) {
  try {
    const url = new URL(normalizeInstagramUrl(value))
    return url.protocol === 'https:' && url.hostname === 'www.instagram.com'
  } catch {
    return false
  }
}

export function isCanonicalInstagramPostUrl(value: string) {
  try {
    const url = new URL(value)
    const segments = url.pathname.split('/').filter(Boolean)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'www.instagram.com' &&
      segments.length === 2 &&
      segments[0] === 'p' &&
      segments[1].length > 0 &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}
