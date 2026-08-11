import { describe, expect, it } from 'vitest'
import {
  M5_ENEMY_PLACEMENTS,
  createConnectedLevelEnemyRuntimes,
} from '../game/encounters/connectedLevelEncounters'
import { meleeRoleByDefinitionId, meleeRoleByRuntimeId } from '../game/enemies/enemyRoles'
import {
  requestedEnemyProofAsset,
  resolveEnemyPresentationBackend,
} from './enemyPresentationBackend'

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

  it('keeps procedural skirmisher art in gameplay and isolates the GLB proof behind a dev request', () => {
    expect(resolveEnemyPresentationBackend('skirmisher', null)).toBe('procedural')
    expect(resolveEnemyPresentationBackend('brute', 'enemy.skirmisher.proof')).toBe('procedural')
    expect(
      resolveEnemyPresentationBackend(
        'skirmisher',
        requestedEnemyProofAsset('?assetProof=enemy.skirmisher.proof'),
      ),
    ).toBe('skirmisher-proof-glb')
  })
})
