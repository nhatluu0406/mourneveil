import { describe, expect, it } from 'vitest'
import { resolveSepulchrePresentation, sepulchreAttackKind } from './sepulchrePresentation'

const base = {
  alive: true,
  healthCurrent: 420,
  healthMaximum: 420,
  actionId: null,
  phase: 'idle' as const,
  phaseProgress: 0,
  hitReacting: false,
}

describe('Sepulchre presentation projection', () => {
  it('maps the four authoritative action ids without changing timing', () => {
    expect(sepulchreAttackKind('enemy.boss.slash')).toBe('slash')
    expect(sepulchreAttackKind('enemy.boss.crush')).toBe('crush')
    expect(sepulchreAttackKind('enemy.boss.lunge')).toBe('lunge')
    expect(sepulchreAttackKind('enemy.boss.slam')).toBe('slam')
  })

  it('opens the reliquary structure only from the authoritative HP threshold', () => {
    expect(resolveSepulchrePresentation({ ...base, healthCurrent: 211 }).phaseTwo).toBe(false)
    expect(resolveSepulchrePresentation({ ...base, healthCurrent: 210 }).phaseTwo).toBe(true)
  })

  it('gives every attack a distinct committed pose', () => {
    const poses = ['slash', 'crush', 'lunge', 'slam'].map((kind) =>
      resolveSepulchrePresentation({
        ...base,
        actionId: `enemy.boss.${kind}`,
        phase: 'startup',
        phaseProgress: 0.75,
      }),
    )
    expect(new Set(poses.map((pose) => `${pose.weaponPitch}:${pose.weaponYaw}:${pose.weaponRoll}`)).size).toBe(4)
  })

  it('projects defeat as an override without mutating the input', () => {
    const input = { ...base, alive: false, healthCurrent: 0 }
    const pose = resolveSepulchrePresentation(input)
    expect(pose.defeated).toBe(true)
    expect(pose.bodyPitch).toBeLessThan(-0.5)
    expect(input).toEqual({ ...base, alive: false, healthCurrent: 0 })
  })

  it('shows startup telegraphs only during startup and clears elsewhere', () => {
    for (const kind of ['slash', 'crush', 'lunge', 'slam'] as const) {
      const startup = resolveSepulchrePresentation({
        ...base,
        actionId: `enemy.boss.${kind}`,
        phase: 'startup',
        phaseProgress: 0.4,
      })
      expect(startup.startupCue).toBe(kind)
      expect(startup.impactAccent).toBe(0)

      const active = resolveSepulchrePresentation({
        ...base,
        actionId: `enemy.boss.${kind}`,
        phase: 'active',
        phaseProgress: 0.5,
      })
      expect(active.startupCue).toBeNull()
      expect(active.impactAccent).toBe(1)

      const recovery = resolveSepulchrePresentation({
        ...base,
        actionId: `enemy.boss.${kind}`,
        phase: 'recovery',
        phaseProgress: 0.2,
      })
      expect(recovery.startupCue).toBeNull()
      expect(recovery.impactAccent).toBe(0)
    }
  })

  it('clears attack cues on idle, interrupt-style idle, and defeat', () => {
    const interrupted = resolveSepulchrePresentation({
      ...base,
      actionId: null,
      phase: 'idle',
      phaseProgress: 0,
      hitReacting: true,
    })
    expect(interrupted.startupCue).toBeNull()
    expect(interrupted.committed).toBe(false)

    const defeated = resolveSepulchrePresentation({
      ...base,
      alive: false,
      healthCurrent: 0,
      actionId: 'enemy.boss.slash',
      phase: 'startup',
      phaseProgress: 0.5,
    })
    expect(defeated.startupCue).toBeNull()
    expect(defeated.defeated).toBe(true)
  })
})
