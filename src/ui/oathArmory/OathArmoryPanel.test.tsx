import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../../game/runtime/GameRuntime'
import { OathArmoryPanel } from './OathArmoryPanel'
import { OathView } from './OathView'
import { ArmoryView } from './ArmoryView'
import { TitleScreen } from '../TitleScreen'

describe('Oath & Armory information architecture', () => {
  it('opens Armory by default without Oath inventory mixing', () => {
    const runtime = new GameRuntime()
    const snapshot = runtime.snapshot()
    const markup = renderToStaticMarkup(
      <OathArmoryPanel snapshot={snapshot} runtime={runtime} open onClose={() => undefined} />,
    )
    expect(markup).toContain('data-panel-mode="armory"')
    expect(markup).toContain('data-armory-view="1"')
    expect(markup).not.toContain('data-oath-view="1"')
    expect(markup).not.toContain('data-oath-attributes="1"')
    expect(markup).toContain('data-armory-loadout="1"')
    expect(markup).toContain('data-inventory-scroll="1"')
  })

  it('keeps Armory item lists separate from Oath attributes and skills', () => {
    const runtime = new GameRuntime()
    const snapshot = runtime.snapshot()
    const armory = renderToStaticMarkup(<ArmoryView snapshot={snapshot} runtime={runtime} />)
    const oath = renderToStaticMarkup(<OathView snapshot={snapshot} runtime={runtime} />)
    expect(armory).toContain('data-item-detail="1"')
    expect(armory).not.toContain('data-skill-loadout="1"')
    expect(armory).not.toContain('data-progression-panel="1"')
    expect(oath).toContain('data-oath-view="1"')
    expect(oath).toContain('data-progression-panel="1"')
    expect(oath).toContain('data-skill-loadout="1"')
    expect(oath).not.toContain('data-inventory-scroll="1"')
    expect(oath).not.toContain('data-item-detail="1"')
  })
})

describe('title session actions', () => {
  it('offers Begin Rite when no save exists', () => {
    const markup = renderToStaticMarkup(
      <TitleScreen
        hasSave={false}
        confirmingNewRite={false}
        onContinue={() => undefined}
        onNewRite={() => undefined}
        onConfirmNewRite={() => undefined}
        onCancelNewRite={() => undefined}
      />,
    )
    expect(markup).toContain('data-title-action="begin-rite"')
    expect(markup).not.toContain('data-title-action="continue"')
  })

  it('asks for confirmation before New Rite when a save exists', () => {
    const markup = renderToStaticMarkup(
      <TitleScreen
        hasSave
        confirmingNewRite
        onContinue={() => undefined}
        onNewRite={() => undefined}
        onConfirmNewRite={() => undefined}
        onCancelNewRite={() => undefined}
      />,
    )
    expect(markup).toContain('data-title-confirm="1"')
    expect(markup).toContain('data-title-confirm-yes="1"')
  })
})
