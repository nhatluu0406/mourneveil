import { CHECKPOINT_SHRINE_ASSET } from '../content/assets/productionAssetReference'
import type { CheckpointSnapshot } from '../game/world/checkpoint'

export interface CheckpointShrinePresentation {
  readonly asset: typeof CHECKPOINT_SHRINE_ASSET
  readonly position: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
  readonly rotationRadians: readonly [number, number, number]
}

export function checkpointShrinePresentation(
  checkpoint: Pick<CheckpointSnapshot, 'visualPosition'>,
): CheckpointShrinePresentation {
  return {
    asset: CHECKPOINT_SHRINE_ASSET,
    position: [
      checkpoint.visualPosition.x,
      checkpoint.visualPosition.y,
      checkpoint.visualPosition.z,
    ],
    scale: CHECKPOINT_SHRINE_ASSET.scale,
    rotationRadians: CHECKPOINT_SHRINE_ASSET.rotationRadians,
  }
}
