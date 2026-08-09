import { describe, expect, it } from 'vitest'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../world/connectedLevel'
import {
  M5_ENCOUNTERS,
  M5_ENEMY_PLACEMENTS,
  createConnectedLevelEnemyRuntimes,
  validateConnectedEncounterPlacements,
} from './connectedLevelEncounters'

describe('connected-level encounter placement', () => {
  it('resolves every encounter and enemy placement to authored world IDs', () => {
    expect(() => validateConnectedEncounterPlacements()).not.toThrow()
    const zoneEncounterIds = new Set(
      MOURNEVEIL_CONNECTED_LEVEL.zones.flatMap((zone) =>
        zone.encounterId === undefined ? [] : [zone.encounterId],
      ),
    )
    expect(M5_ENCOUNTERS.every((encounter) => zoneEncounterIds.has(encounter.id))).toBe(true)
    expect(createConnectedLevelEnemyRuntimes().map((enemy) => enemy.id)).toEqual(
      M5_ENEMY_PLACEMENTS.map((placement) => placement.runtimeId),
    )
  })

  it('fails explicitly when an encounter references an invalid placement ID', () => {
    expect(() =>
      validateConnectedEncounterPlacements(
        [{ ...M5_ENCOUNTERS[0], enemyIds: ['enemy.missing'] }],
        [M5_ENEMY_PLACEMENTS.find((placement) => placement.encounterId === M5_ENCOUNTERS[0].id)!],
      ),
    ).toThrow('invalid enemy placement')
  })
})
