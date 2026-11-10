// Host is the actual incoming authority. Never trust a forwarded-host override.
export function isAllowedOrigin({ origin, host, url, fetchSite }) {
  if (fetchSite === 'cross-site') return false
  if (!origin) return true // Non-browser clients still require authenticated identity.
  try {
    const supplied = new URL(origin)
    const expectedHost = (host || new URL(url).host).trim().toLowerCase()
    return ['http:', 'https:'].includes(supplied.protocol) && supplied.host === expectedHost
  } catch {
    return false
  }
}
