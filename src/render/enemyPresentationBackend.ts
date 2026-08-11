import type { EnemyRole } from '../game/enemies/enemyDefinition'

export type EnemyPresentationBackend = 'procedural' | 'skirmisher-proof-glb'

/** Default gameplay remains Product Owner-accepted procedural art; GLB is an isolated dev proof. */
export function resolveEnemyPresentationBackend(
  role: EnemyRole,
  proofAssetId: string | null,
): EnemyPresentationBackend {
  return role === 'skirmisher' && proofAssetId === 'enemy.skirmisher.proof'
    ? 'skirmisher-proof-glb'
    : 'procedural'
}

export function requestedEnemyProofAsset(search: string): string | null {
  return new URLSearchParams(search).get('assetProof')
}
