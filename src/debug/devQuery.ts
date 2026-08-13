export function readQueryParam(
  search: string,
  key: string,
): string | null {
  if (search.length === 0) return null
  return new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get(key)
}

export function isDevQueryEnabled(search: string, key: string): boolean {
  const value = readQueryParam(search, key)
  return value === '1' || value === 'true'
}

/** Same-build A/B: current camera, authoritative poses, no zone culling. */
export function isM15Baseline(search: string): boolean {
  return isDevQueryEnabled(search, 'm15Baseline')
}

export function isZoneCullEnabled(search: string): boolean {
  if (isM15Baseline(search)) return false
  const value = readQueryParam(search, 'zoneCull')
  if (value === '0' || value === 'false') return false
  return true
}

export function shouldShowPerfHud(
  search: string,
  development: boolean,
  f3Visible: boolean,
): boolean {
  if (!development) return false
  return f3Visible || isDevQueryEnabled(search, 'perfHud')
}
