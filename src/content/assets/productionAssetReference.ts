import manifest from '../../../assets/production-assets.json'
import type { ActorAnimationMode } from '../../render/animation/animationPresentation'

export interface ProductionAssetReference {
  readonly id: string
  readonly runtimeUrl: string
  readonly scale: readonly [number, number, number]
  readonly rotationRadians: readonly [number, number, number]
}

export type EnemyAnimationSemantic =
  | 'idle'
  | 'locomotion'
  | 'enemy-attack'
  | 'hit-reaction'
  | 'defeated'

export type EnemyAnimationSemanticMapping = Readonly<
  Record<EnemyAnimationSemantic, string>
>

export interface SkirmisherProofAssetReference extends ProductionAssetReference {
  readonly animationSemantics: EnemyAnimationSemanticMapping
}

function freezeTransform(asset: {
  readonly scale: readonly number[]
  readonly rotationRadians: readonly number[]
}): {
  readonly scale: readonly [number, number, number]
  readonly rotationRadians: readonly [number, number, number]
} {
  if (asset.scale.length !== 3 || asset.rotationRadians.length !== 3) {
    throw new Error('[assets] invalid runtime transform')
  }
  return {
    scale: Object.freeze([asset.scale[0], asset.scale[1], asset.scale[2]]),
    rotationRadians: Object.freeze([
      asset.rotationRadians[0],
      asset.rotationRadians[1],
      asset.rotationRadians[2],
    ]),
  }
}

function requireRuntimeUrl(id: string, runtimeUrl: string, extension: '.gltf' | '.glb'): string {
  if (!runtimeUrl.startsWith('/assets/') || !runtimeUrl.endsWith(extension)) {
    throw new Error(`[assets] ${id}: invalid canonical runtime URL`)
  }
  return runtimeUrl
}

export function checkpointShrineAssetReference(): ProductionAssetReference {
  const asset = manifest.assets.find((entry) => entry.id === 'world.checkpoint.refuge-shrine')
  if (asset === undefined) throw new Error('[assets] missing canonical checkpoint shrine reference')
  const transform = freezeTransform(asset)
  return Object.freeze({
    id: asset.id,
    runtimeUrl: requireRuntimeUrl(asset.id, asset.runtimeUrl, '.gltf'),
    ...transform,
  })
}

export function skirmisherProofAssetReference(): SkirmisherProofAssetReference {
  const asset = manifest.assets.find((entry) => entry.id === 'enemy.skirmisher.proof')
  if (asset === undefined) throw new Error('[assets] missing canonical skirmisher proof reference')
  if (!('animationSemantics' in asset) || asset.animationSemantics === undefined) {
    throw new Error(`[assets] ${asset.id}: missing animationSemantics mapping`)
  }
  const transform = freezeTransform(asset)
  return Object.freeze({
    id: asset.id,
    runtimeUrl: requireRuntimeUrl(asset.id, asset.runtimeUrl, '.glb'),
    ...transform,
    animationSemantics: Object.freeze({ ...asset.animationSemantics }),
  })
}

export function clipNameForEnemyAnimationMode(
  mapping: EnemyAnimationSemanticMapping,
  mode: ActorAnimationMode,
): string {
  switch (mode) {
    case 'idle':
      return mapping.idle
    case 'locomotion':
      return mapping.locomotion
    case 'enemy-attack':
      return mapping['enemy-attack']
    case 'hit-reaction':
      return mapping['hit-reaction']
    case 'defeated':
      return mapping.defeated
    case 'guard':
    case 'dodge':
    case 'heal':
    case 'light-attack':
    case 'heavy-attack':
      return mapping.idle
  }
}

export const CHECKPOINT_SHRINE_ASSET = checkpointShrineAssetReference()
export const SKIRMISHER_PROOF_ASSET = skirmisherProofAssetReference()
