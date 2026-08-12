/** Presentation tokens for Mourneveil game UI — not gameplay authority. */

export const UI_TYPOGRAPHY = Object.freeze({
  display:
    'Palatino Linotype, Palatino, "Book Antiqua", Georgia, "Times New Roman", serif',
  body: 'Candara, "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
})

export const UI_COLORS = Object.freeze({
  ink: '#e7dfd0',
  muted: '#9aa193',
  panel: 'rgb(10 12 14 / 78%)',
  panelStrong: 'rgb(8 10 12 / 88%)',
  hairline: 'rgb(196 170 120 / 28%)',
  hairlineStrong: 'rgb(196 170 120 / 48%)',
  accent: '#c4aa78',
  danger: '#c45a4a',
  echo: '#7eb6c8',
  flask: '#5f9eab',
})

export const UI_COMPACT_HINTS = Object.freeze([
  { id: 'guard', label: 'Guard', binding: 'RMB' },
  { id: 'dodge', label: 'Dodge', binding: 'Space' },
  { id: 'inventory', label: 'Inventory', binding: 'I' },
] as const)
