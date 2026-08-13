export type GameSessionIntent = 'continue' | 'new-rite'

/** DEV/gate helper: `?fresh=1` starts a new rite without the title screen. */
export function isFreshSessionQuery(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const value = params.get('fresh')
  return value === '1' || value === 'true'
}

export function resolveInitialSessionIntent(search: string): GameSessionIntent | null {
  return isFreshSessionQuery(search) ? 'new-rite' : null
}
