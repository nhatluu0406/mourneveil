import { describe, expect, it } from 'vitest'
import {
  M5_ENEMY_PLACEMENTS,
  createConnectedLevelEnemyRuntimes,
} from '../game/encounters/connectedLevelEncounters'
import { meleeRoleByDefinitionId, meleeRoleByRuntimeId } from '../game/enemies/enemyRoles'

describe('enemy presentation role resolution', () => {
  it('resolves a silhouette role for every connected-level enemy runtime', () => {
    const enemies = createConnectedLevelEnemyRuntimes()
    expect(enemies.length).toBe(M5_ENEMY_PLACEMENTS.length)
    for (const enemy of enemies) {
      const byDefinition = meleeRoleByDefinitionId(enemy.snapshot().definitionId)
      expect(byDefinition, enemy.id).not.toBeNull()
      expect(byDefinition?.role).toBe(
        M5_ENEMY_PLACEMENTS.find((placement) => placement.runtimeId === enemy.id)?.role,
      )
    }
  })

  it('does not rely on mixed-court runtime IDs alone for presentation', () => {
    expect(meleeRoleByRuntimeId('enemy.skirmisher.introduction')).toBeNull()
    expect(meleeRoleByRuntimeId('enemy.skirmisher.pressure')).toBeNull()
    expect(meleeRoleByDefinitionId('enemy.skirmisher.graybox')?.role).toBe('skirmisher')
  })
})
