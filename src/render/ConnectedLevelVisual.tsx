import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  activeConnectedLevelColliders,
  type ConnectedLevelBoxCollider,
} from '../physics/connectedLevelCollision'
import { aabbFromCenterSize, occludingSolidIds } from './cameraOcclusion'
import { isAllowedOcclusionFadeId } from './allowedOcclusionFade'
import { forEachOcclusionMaterial } from './occlusionMaterials'
import { OssuaryEnvironmentKit } from './OssuaryEnvironmentKit'
import { playerVisualPosition, usesInterpolatedPresentation } from './presentationSampling'
import {
  listFadeOcclusionSolids,
  setOccludedPlacementIds,
} from './world/occlusionPlacementState'

const FADE_OPACITY = 0.05
const FADE_LERP = 14

function isGateCollider(collider: ConnectedLevelBoxCollider): boolean {
  return collider.kind === 'shortcut-gate' || collider.kind === 'final-gate'
}

function SolidCollider({ collider }: { readonly collider: ConnectedLevelBoxCollider }) {
  const halfExtents: [number, number, number] = [
    collider.size[0] / 2,
    collider.size[1] / 2,
    collider.size[2] / 2,
  ]

  return <CuboidCollider args={halfExtents} position={collider.position} />
}

/** Presentation-only fade of foreground gate bars. Architecture stays opaque. */
export function CameraOcclusionFader({ runtime }: { readonly runtime: GameRuntime }) {
  useFrame(({ camera }, delta) => {
    const world = runtime.snapshot().world
    const gateSolids = activeConnectedLevelColliders({
      shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
      finalGateOpen: world.finalGateReached,
    })
      .filter((collider) => isGateCollider(collider) && isAllowedOcclusionFadeId(collider.id))
      .map((collider) => ({ id: collider.id, box: aabbFromCenterSize(collider.position, collider.size) }))

    const player = playerVisualPosition(runtime, usesInterpolatedPresentation())
    const focus = { x: player.x, y: player.y + 0.55, z: player.z }
    const cameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const placementSolids = listFadeOcclusionSolids()
    setOccludedPlacementIds(new Set(occludingSolidIds(cameraPos, focus, placementSolids)))

    const occludedGates = new Set(occludingSolidIds(cameraPos, focus, gateSolids))
    const blend = Math.min(1, delta * FADE_LERP)

    forEachOcclusionMaterial((id, entry) => {
      const target = occludedGates.has(id) ? FADE_OPACITY : entry.baseOpacity
      const next = entry.material.opacity + (target - entry.material.opacity) * blend
      if (Math.abs(next - entry.material.opacity) < 0.001) return
      entry.material.transparent = true
      entry.material.opacity = next
      entry.material.depthWrite = entry.material.opacity > 0.85
      entry.material.needsUpdate = true
    })
  }, -1)

  return null
}

export function ConnectedLevelVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const world = runtime.snapshot().world
  const colliders = activeConnectedLevelColliders({
    shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
    finalGateOpen: world.finalGateReached,
  })

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {colliders.map((collider) => (
          <SolidCollider key={collider.id} collider={collider} />
        ))}
      </RigidBody>

      <OssuaryEnvironmentKit runtime={runtime} />
    </>
  )
}
