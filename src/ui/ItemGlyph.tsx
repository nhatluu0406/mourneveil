import type { EquipmentBarIcon } from './gameplayHudModel'

/** Project-authored Mourneveil item marks. Shape, not recolor, carries identity at HUD scale. */
export function ItemGlyph({ icon }: { readonly icon: EquipmentBarIcon }) {
  if (icon === 'oathblade') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m29 4 8 5-10 25-4 3-4-4 3-5Z"/><path d="m13 32 5-4 8 8-4 5Z"/><path d="m10 39 4-4 4 4-4 5Z"/></svg>
  if (icon === 'gravebrand') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M20 5h11l5 6-9 25-8-2-5-7Z"/><path d="m10 28 6-5 15 12-5 6Z"/><path d="m14 39 5-5 4 4-5 6Z"/><path d="M23 10h7l-2 8h-8Z"/></svg>
  if (icon === 'veil-thorn') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M31 4c-1 12-5 20-13 28l5 5c9-10 13-20 12-31Z"/><path d="m15 27 4-5 11 9-5 6Z"/><path d="m14 34 5 4-5 6-4-4Z"/><path d="m27 14 8-3-5 7Z"/></svg>
  if (icon === 'flask') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5h10v6l-3 4v3c7 2 11 8 10 15-1 7-6 10-12 10S13 40 12 33c-1-7 3-13 10-15v-3l-3-4Z"/><path d="M16 30c5 2 11-2 17 0"/></svg>
  if (icon === 'vitality-charm') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5c8 0 14 7 14 15 0 10-7 18-14 23-7-5-14-13-14-23C10 12 16 5 24 5Z"/><path d="M24 14c5-6 11 2 5 8l-5 6-5-6c-6-6 0-14 5-8Z"/><path d="M24 28v8"/></svg>
  if (icon === 'ward-seal') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 5 15 8v11c0 9-6 15-15 19-9-4-15-10-15-19V13Z"/><path d="m24 13 8 10-8 11-8-11Z"/><path d="M14 17h20M14 29h20"/></svg>
  if (icon === 'oathbrand-ember') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 4c3 8-4 10 2 17 2-5 7-6 8-12 7 9 7 19 1 27-6 8-19 8-25 0-5-7-2-17 5-23-1 8 3 10 6 12 2-8-4-12 3-21Z"/><path d="m24 23 6 8-6 9-6-9Z"/></svg>
  if (icon === 'ash-circlet') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 28c5-13 29-13 34 0-7 11-27 11-34 0Z"/><path d="m12 27 5-11 7 8 7-8 5 11"/><path d="M15 34c6 4 12 4 18 0"/><circle cx="24" cy="27" r="3"/></svg>
  if (icon === 'mourning-phial') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5h10l-1 8 6 8c6 9 1 22-10 22S8 30 14 21l6-8Z"/><path d="M15 29c7 4 11-4 18 0"/><path d="m24 18 4 7-4 5-4-5Z"/></svg>
  if (icon === 'charm') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5c8 0 14 7 14 15 0 10-7 18-14 23-7-5-14-13-14-23C10 12 16 5 24 5Z"/><path d="m24 13 5 8-5 9-5-9Z"/></svg>
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 15 20-15 20L9 24Z"/><path d="m24 12 7 12-7 12-7-12Z"/><circle cx="24" cy="24" r="3"/></svg>
}
