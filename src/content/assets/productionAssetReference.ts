import manifest from '../../../assets/production-assets.json'

export interface ProductionAssetReference {
  readonly id: string
  readonly runtimeUrl: string
  readonly scale: readonly [number, number, number]
  readonly rotationRadians: readonly [number, number, number]
}

export function checkpointShrineAssetReference(): ProductionAssetReference {
  const asset = manifest.assets.find((entry) => entry.id === 'world.checkpoint.refuge-shrine')
  if (asset === undefined) throw new Error('[assets] missing canonical checkpoint shrine reference')
  if (!asset.runtimeUrl.startsWith('/assets/') || !asset.runtimeUrl.endsWith('.gltf')) {
    throw new Error(`[assets] ${asset.id}: invalid canonical runtime URL`)
  }
  if (asset.scale.length !== 3 || asset.rotationRadians.length !== 3) {
    throw new Error(`[assets] ${asset.id}: invalid runtime transform`)
  }
  const scale: readonly [number, number, number] = Object.freeze([
    asset.scale[0],
    asset.scale[1],
    asset.scale[2],
  ])
  const rotationRadians: readonly [number, number, number] = Object.freeze([
    asset.rotationRadians[0],
    asset.rotationRadians[1],
    asset.rotationRadians[2],
  ])
  return Object.freeze({
    id: asset.id,
    runtimeUrl: asset.runtimeUrl,
    scale,
    rotationRadians,
  })
}

export const CHECKPOINT_SHRINE_ASSET = checkpointShrineAssetReference()
