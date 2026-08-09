import { describe, expect, it } from 'vitest'
import { createGrayboxEncounterSnapshot } from './grayboxEncounter'

describe('graybox mixed encounter', () => {
  const ids = ['enemy.skirmisher.1', 'enemy.brute.1'] as const

  it('stays active while any encounter enemy is alive', () => {
    expect(
      createGrayboxEncounterSnapshot(ids, [
        { id: 'enemy.skirmisher.1', alive: false },
        { id: 'enemy.brute.1', alive: true },
      ]),
    ).toMatchObject({
      phase: 'active',
      defeatedEnemyIds: ['enemy.skirmisher.1'],
    })
  })

  it('completes only when all encounter enemies are defeated', () => {
    expect(
      createGrayboxEncounterSnapshot(ids, [
        { id: 'enemy.skirmisher.1', alive: false },
        { id: 'enemy.brute.1', alive: false },
      ]),
    ).toMatchObject({
      phase: 'complete',
      defeatedEnemyIds: ['enemy.skirmisher.1', 'enemy.brute.1'],
    })
  })

  it('does not complete early when only one enemy is defeated', () => {
    const snapshot = createGrayboxEncounterSnapshot(ids, [
      { id: 'enemy.skirmisher.1', alive: true },
      { id: 'enemy.brute.1', alive: false },
    ])
    expect(snapshot.phase).toBe('active')
    expect(snapshot.defeatedEnemyIds).toEqual(['enemy.brute.1'])
  })
})
