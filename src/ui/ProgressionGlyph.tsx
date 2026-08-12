import type { ProgressionAttributeId } from '../game/character/playerProgression'

export type ProgressionGlyphId = ProgressionAttributeId | 'level' | 'experience' | 'point'

export function ProgressionGlyph({ id }: { readonly id: ProgressionGlyphId }) {
  if (id === 'vitality') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42C14 35 8 27 10 18c1-6 6-10 11-7l3 3 3-3c5-3 10 1 11 7 2 9-4 17-14 24Z"/><path d="M24 16v18M18 24h12"/></svg>
  if (id === 'resolve') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 5 15 7v11c0 10-6 16-15 20-9-4-15-10-15-20V12Z"/><path d="m16 25 8-11 8 11-8 9Z"/><path d="M24 14v20"/></svg>
  if (id === 'might') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m29 5 8 4-17 27-7 4 2-8Z"/><path d="m10 31 8 8M8 40l4-4 4 4-4 4Z"/><path d="m30 18 6 6"/></svg>
  if (id === 'level') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 5 14 8v22l-14 8-14-8V13Z"/><path d="m24 12 7 12-7 12-7-12Z"/></svg>
  if (id === 'point') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="15"/><path d="M24 14v20M14 24h20"/><path d="m24 5 4 5-4 4-4-4Z"/></svg>
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 33c7-16 13-20 32-18-7 4-11 8-13 15-6-3-12-2-19 3Z"/><path d="M12 37h25M17 31l4-8M26 29l4-10"/></svg>
}
