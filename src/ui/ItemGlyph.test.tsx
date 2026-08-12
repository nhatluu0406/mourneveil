import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ItemGlyph } from './ItemGlyph'
import type { EquipmentBarIcon } from './gameplayHudModel'

const ITEM_ICONS: readonly EquipmentBarIcon[] = [
  'oathblade', 'gravebrand', 'veil-thorn', 'vitality-charm', 'ward-seal',
  'oathbrand-ember', 'ash-circlet', 'mourning-phial',
]

describe('M14 item glyph family', () => {
  it('renders eight distinct project-authored silhouettes', () => {
    const markup = ITEM_ICONS.map((icon) => renderToStaticMarkup(<ItemGlyph icon={icon}/>))
    expect(new Set(markup).size).toBe(ITEM_ICONS.length)
    expect(markup.every((entry) => entry.startsWith('<svg'))).toBe(true)
  })
})
