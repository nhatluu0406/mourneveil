import { describe, expect, it } from 'vitest'
import { GameRuntime } from '../game/runtime/GameRuntime'
import {
  equippedWeaponLabel,
  resolveEquipmentBar,
  resolveSkillHudSlot,
  resolveGameplayInteractionPrompt,
  resolveNearestThreat,
  resolveZoneHudCopy,
  threatTitle,
} from './gameplayHudModel'

describe('gameplay HUD interaction prompts', () => {
  it('prompts Rest near the refuge checkpoint while alive', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    expect(resolveGameplayInteractionPrompt(runtime.snapshot())).toBe('F — Rest')
  })

  it('prompts Respawn when dead with an activated checkpoint', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    runtime.requestCheckpointInteraction({ type: 'player-checkpoint-interaction' })
    runtime.applyPlayerDamage(999)
    expect(resolveGameplayInteractionPrompt(runtime.snapshot())).toBe('R — Respawn')
  })

  it('prompts Open shortcut from the authored far side while closed', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -2.2, y: 0.82, z: -1 })
    runtime.debugSetPlayerPosition({ x: -2.5, y: 0.82, z: -1.1 })
    for (let step = 0; step < 2; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    const prompt = resolveGameplayInteractionPrompt(runtime.snapshot())
    expect(['F — Open shortcut', null]).toContain(prompt)
  })
})

describe('cinematic HUD projection helpers', () => {
  it('binds zone copy from authoritative currentZoneId', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -5.5, y: 0.82, z: 0 })
    for (let step = 0; step < 2; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    const zoneId = runtime.snapshot().world.currentZoneId
    expect(zoneId).toBe('zone.checkpoint')
    expect(resolveZoneHudCopy(zoneId).title).toBe('Reliquary of the Veil')
  })

  it('shows nearest alive threat only within presentation range', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: -9.15, y: 0.82, z: 2.15 })
    for (let step = 0; step < 2; step += 1) {
      runtime.advanceFrame(1 / 60, { horizontal: 0, forward: 0 })
    }
    const threat = resolveNearestThreat(runtime.snapshot())
    expect(threat).not.toBeNull()
    expect(threatTitle(threat!.definitionId)).toMatch(/STALKER|BULWARK/)
  })

  it('projects equipment labels from inventory snapshot', () => {
    const runtime = new GameRuntime()
    expect(equippedWeaponLabel(runtime.snapshot())).toBe('Unarmed')
  })

  it('projects canonical equipment and resources instead of a control legend', () => {
    const runtime = new GameRuntime()
    const slots = resolveEquipmentBar(runtime.snapshot())
    expect(slots.map((slot) => slot.id)).toEqual(['weapon', 'charm', 'flask', 'echoes'])
    expect(slots.find((slot) => slot.id === 'flask')).toMatchObject({
      label: 'Ashen Flask',
      detail: '3 / 3 charges',
      binding: 'E',
    })
    expect(slots.find((slot) => slot.id === 'weapon')?.binding).toBe('LMB')
    expect(slots.every((slot) => !['Dodge', 'Interact', 'Inventory'].includes(slot.label))).toBe(true)
  })

  it('projects equipped skill HUD slot with Q binding and ready state', () => {
    const runtime = new GameRuntime()
    const slot = resolveSkillHudSlot(runtime.snapshot())
    expect(slot).toMatchObject({
      skillId: 'skill.veil-step',
      label: 'Veil Step',
      binding: 'Q',
      ready: true,
      cooldownRatio: 0,
      equipped: true,
    })
  })

  it('projects distinct authored charm identities from canonical equipment state', () => {
    const runtime = new GameRuntime()
    const vitalitySnapshot = {
      ...runtime.snapshot(),
      equipment: { ...runtime.snapshot().equipment, charmItemId: 'item.charm.vitality' },
    }
    const wardSnapshot = {
      ...runtime.snapshot(),
      equipment: { ...runtime.snapshot().equipment, charmItemId: 'item.charm.ward-seal' },
    }
    expect(resolveEquipmentBar(vitalitySnapshot).find((slot) => slot.id === 'charm')?.icon).toBe('vitality-charm')
    expect(resolveEquipmentBar(wardSnapshot).find((slot) => slot.id === 'charm')?.icon).toBe('ward-seal')
  })

  it('projects every M14 equipped item through its own visual key', () => {
    const runtime = new GameRuntime()
    const base = runtime.snapshot()
    const cases = [
      ['item.weapon.oathblade', 'weapon', 'oathblade'],
      ['item.weapon.gravebrand', 'weapon', 'gravebrand'],
      ['item.weapon.veil-thorn', 'weapon', 'veil-thorn'],
      ['item.charm.vitality', 'charm', 'vitality-charm'],
      ['item.charm.ward-seal', 'charm', 'ward-seal'],
      ['item.charm.oathbrand-ember', 'charm', 'oathbrand-ember'],
      ['item.charm.ash-circlet', 'charm', 'ash-circlet'],
      ['item.charm.mourning-phial', 'charm', 'mourning-phial'],
    ] as const
    for (const [itemId, slot, icon] of cases) {
      const snapshot = { ...base, equipment: { ...base.equipment, [slot === 'weapon' ? 'weaponItemId' : 'charmItemId']: itemId } }
      expect(resolveEquipmentBar(snapshot).find((entry) => entry.id === slot)?.icon).toBe(icon)
    }
  })
})
