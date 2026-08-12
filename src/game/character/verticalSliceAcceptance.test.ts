import { describe, expect, it } from 'vitest'
import { FIXED_STEP_SECONDS } from '../core/fixedStepClock'
import { BOSS_TECHNICAL_ID } from '../enemies/bossKit'
import { GameRuntime } from '../runtime/GameRuntime'
import {
  isVerticalSliceComplete,
  resolveAcquisitionToast,
  resolveNearestThreat,
  resolveZoneHudCopy,
} from '../../ui/gameplayHudModel'

describe('vertical slice completion projection', () => {
  it('keeps arena objective until the boss is defeated', () => {
    const runtime = new GameRuntime()
    runtime.debugSetPlayerPosition({ x: 13, y: 0.82, z: -4 })
    for (let step = 0; step < 4; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(isVerticalSliceComplete(runtime.snapshot())).toBe(false)
    expect(resolveZoneHudCopy('zone.final-arena', runtime.snapshot()).objective).toMatch(/End the rite/)
  })

  it('projects rite-complete copy after boss defeat', () => {
    const runtime = new GameRuntime()
    runtime.applySave({
      ...runtime.captureSave(),
      world: {
        openedShortcutIds: [],
        finalGateReached: true,
        defeatedBossIds: [BOSS_TECHNICAL_ID],
      },
    })
    expect(isVerticalSliceComplete(runtime.snapshot())).toBe(true)
    expect(resolveZoneHudCopy('zone.final-arena', runtime.snapshot())).toMatchObject({
      eyebrow: 'Rite I · Complete',
      objective: expect.stringContaining('Rite complete'),
    })
  })

  it('projects acquisition toast with equip guidance', () => {
    const runtime = new GameRuntime()
    runtime.debugDefeatEnemy('enemy.skirmisher.1')
    const loot = runtime.snapshot().lootPickup
    runtime.debugSetPlayerPosition({
      x: loot.position!.x,
      y: 0.82,
      z: loot.position!.z,
    })
    for (let step = 0; step < 8; step += 1) {
      runtime.advanceFrame(FIXED_STEP_SECONDS, { horizontal: 0, forward: 0 })
    }
    expect(runtime.snapshot().lastLootAcquisition?.itemId).toBe('item.weapon.oathblade')
    expect(runtime.snapshot().lastLootAcquisition?.isNew).toBe(true)
    expect(resolveAcquisitionToast(runtime.snapshot())).toMatchObject({
      title: 'New · Oathblade',
      detail: expect.stringContaining('Press I to compare & equip'),
    })
  })

  it('hides threat projection after rite complete', () => {
    const runtime = new GameRuntime()
    runtime.applySave({
      ...runtime.captureSave(),
      world: {
        openedShortcutIds: [],
        finalGateReached: true,
        defeatedBossIds: [BOSS_TECHNICAL_ID],
      },
    })
    runtime.debugSetPlayerPosition({ x: 1.4, y: 0.82, z: -2.6 })
    expect(isVerticalSliceComplete(runtime.snapshot())).toBe(true)
    expect(resolveNearestThreat(runtime.snapshot())).toBeNull()
  })
})
