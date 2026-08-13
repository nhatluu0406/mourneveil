import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { Object3D, type InstancedMesh, type MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  activeConnectedLevelColliders,
  type ConnectedLevelBoxCollider,
} from '../physics/connectedLevelCollision'
import { aabbFromCenterSize, occludingSolidIds } from './cameraOcclusion'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { forEachOcclusionMaterial, registerOcclusionMaterial } from './occlusionMaterials'
import { OssuaryEnvironmentKit } from './OssuaryEnvironmentKit'
import { playerVisualPosition, usesInterpolatedPresentation } from './presentationSampling'
import {
  listFadeOcclusionSolids,
  setOccludedPlacementIds,
} from './world/occlusionPlacementState'

const FADE_OPACITY = 0.05
const FADE_LERP = 14

/**
 * Default presentation: gameplay colliders only for walls/blockers/floors/checkpoints.
 * Authored ADR-0002 shell owns visible architecture (resolves D-005 default double-draw).
 * Gates keep presentation because their visual state is simulation-driven.
 */
function shouldRenderProxyMesh(collider: ConnectedLevelBoxCollider): boolean {
  return collider.kind === 'shortcut-gate' || collider.kind === 'final-gate'
}

function FuneraryGateVisual({
  collider,
  materialRef,
}: {
  readonly collider: ConnectedLevelBoxCollider
  readonly materialRef: RefObject<MeshStandardMaterial | null>
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const isFinal = collider.kind === 'final-gate'
  const verticalCount = isFinal ? 7 : 5
  const instanceCount = verticalCount + 2

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) return
    const transform = new Object3D()
    const span = collider.size[2] * 0.72
    for (let index = 0; index < verticalCount; index += 1) {
      const ratio = index / (verticalCount - 1) - 0.5
      transform.position.set(0, 0, ratio * span)
      transform.rotation.set(0, 0, 0)
      transform.scale.set(1, collider.size[1] / 1.32, 1)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)
    }
    for (let rail = 0; rail < 2; rail += 1) {
      transform.position.set(0, rail === 0 ? -0.43 : 0.43, 0)
      transform.rotation.set(Math.PI / 2, 0, 0)
      transform.scale.set(1, span / 1.32, 1)
      transform.updateMatrix()
      mesh.setMatrixAt(verticalCount + rail, transform.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [collider.size, verticalCount])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instanceCount]}
      castShadow
      receiveShadow
      userData={{ solidId: collider.id }}
    >
      <boxGeometry args={[0.16, 1.32, 0.12]} />
      <meshStandardMaterial
        ref={materialRef}
        color={isFinal ? MOURNEVEIL_PALETTE.finalGate.sealed : MOURNEVEIL_PALETTE.environment.iron}
        emissive={isFinal ? MOURNEVEIL_PALETTE.finalGate.emissive : MOURNEVEIL_PALETTE.shortcut.emissive}
        emissiveIntensity={isFinal ? 0.34 : 0.12}
        roughness={0.46}
        metalness={0.74}
        transparent
        opacity={1}
        depthWrite
      />
    </instancedMesh>
  )
}

function SolidVisual({ collider }: { readonly collider: ConnectedLevelBoxCollider }) {
  const materialRef = useRef<MeshStandardMaterial>(null)
  const showProxyMesh = shouldRenderProxyMesh(collider)

  useEffect(() => {
    const material = materialRef.current
    if (material === null || !showProxyMesh) return
    return registerOcclusionMaterial({ id: collider.id, material, baseOpacity: 1 })
  }, [collider.id, showProxyMesh])

  const halfExtents: [number, number, number] = [
    collider.size[0] / 2,
    collider.size[1] / 2,
    collider.size[2] / 2,
  ]

  return (
    <RigidBody type="fixed" colliders={false} position={collider.position}>
      <CuboidCollider args={halfExtents} />
      {showProxyMesh ? <FuneraryGateVisual collider={collider} materialRef={materialRef} /> : null}
    </RigidBody>
  )
}

/** Presentation-only fade of foreground gate bars + ADR-0002 fade-eligible architecture. */
export function CameraOcclusionFader({ runtime }: { readonly runtime: GameRuntime }) {
  useFrame(({ camera }, delta) => {
    const world = runtime.snapshot().world
    const gateSolids = activeConnectedLevelColliders({
      shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
      finalGateOpen: world.finalGateReached,
    })
      .filter((collider) => shouldRenderProxyMesh(collider))
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
      {colliders.map((collider) => (
        <SolidVisual key={collider.id} collider={collider} />
      ))}

      <OssuaryEnvironmentKit runtime={runtime} />
    </>
  )
}
