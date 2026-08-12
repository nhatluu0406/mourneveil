import type { EquipmentBarIcon } from './gameplayHudModel'

export function ItemGlyph({ icon }: { readonly icon: EquipmentBarIcon }) {
  if (icon === 'oathblade') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M33 5 40 8 27 29l-5 2-3 6-4-4 6-4 2-5Z"/><path d="m12 34 3-3 5 5-3 3Z"/><path d="m9 39 3-3 3 3-3 4Z"/></svg>
  }
  if (icon === 'flask') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5h10v6l-3 4v3c7 2 11 8 10 15-1 7-6 10-12 10S13 40 12 33c-1-7 3-13 10-15v-3l-3-4Z"/><path d="M16 30c5 2 11-2 17 0"/></svg>
  }
  if (icon === 'vitality-charm') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5c8 0 14 7 14 15 0 10-7 18-14 23-7-5-14-13-14-23C10 12 16 5 24 5Z"/><path d="M24 14c5-6 11 2 5 8l-5 6-5-6c-6-6 0-14 5-8Z"/><path d="M24 28v8"/></svg>
  }
  if (icon === 'ward-seal') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 5 15 8v11c0 9-6 15-15 19-9-4-15-10-15-19V13Z"/><path d="m24 13 8 10-8 11-8-11Z"/><path d="M14 17h20M14 29h20"/></svg>
  }
  if (icon === 'charm') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5c8 0 14 7 14 15 0 10-7 18-14 23-7-5-14-13-14-23C10 12 16 5 24 5Z"/><path d="m24 13 5 8-5 9-5-9Z"/></svg>
  }
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 15 20-15 20L9 24Z"/><path d="m24 12 7 12-7 12-7-12Z"/><circle cx="24" cy="24" r="3"/></svg>
}
