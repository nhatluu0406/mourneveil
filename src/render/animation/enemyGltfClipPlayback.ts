import {
  LoopOnce,
  LoopRepeat,
  type AnimationAction,
  type AnimationClip,
  type AnimationMixer,
} from 'three'
import type { ActorAnimationMode } from './animationPresentation'
import {
  clipNameForEnemyAnimationMode,
  type EnemyAnimationSemanticMapping,
} from '../../content/assets/productionAssetReference'

export interface EnemyGltfClipPlaybackState {
  readonly mode: ActorAnimationMode | null
  readonly action: AnimationAction | null
}

export function resolveEnemyClipLoop(mode: ActorAnimationMode): boolean {
  return mode === 'idle' || mode === 'locomotion'
}

export function syncEnemyGltfClipPlayback(options: {
  readonly mixer: AnimationMixer
  readonly clips: readonly AnimationClip[]
  readonly mapping: EnemyAnimationSemanticMapping
  readonly mode: ActorAnimationMode
  readonly blendSeconds: number
  readonly previous: EnemyGltfClipPlaybackState
}): EnemyGltfClipPlaybackState {
  const clipName = clipNameForEnemyAnimationMode(options.mapping, options.mode)
  const clip = options.clips.find((entry) => entry.name === clipName)
  if (clip === undefined) {
    throw new Error(
      `[assets] missing runtime animation clip "${clipName}" for mode "${options.mode}"`,
    )
  }
  if (options.previous.mode === options.mode && options.previous.action !== null) {
    return options.previous
  }

  const next = options.mixer.clipAction(clip)
  next.enabled = true
  const looping = resolveEnemyClipLoop(options.mode)
  next.setLoop(looping ? LoopRepeat : LoopOnce, Infinity)
  next.clampWhenFinished = !looping
  const fade = Math.max(0.01, options.blendSeconds)
  if (options.previous.action !== null && options.previous.action !== next) {
    options.previous.action.fadeOut(fade)
  }
  next.reset().fadeIn(fade).play()
  return { mode: options.mode, action: next }
}
