import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { Object3D, type InstancedMesh, type MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  CONNECTED_LEVEL_LANDMARKS,
  activeConnectedLevelColliders,
  type ConnectedLevelBoxCollider,
} from '../physics/connectedLevelCollision'
import { aabbFromCenterSize, occludingSolidIds } from './cameraOcclusion'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { forEachOcclusionMaterial, registerOcclusionMaterial } from './occlusionMaterials'
import { OssuaryEnvironmentKit } from './OssuaryEnvironmentKit'

const COLORS = {
  wall: MOURNEVEIL_PALETTE.environment.wall,
  blocker: MOURNEVEIL_PALETTE.environment.blocker,
  'shortcut-gate': MOURNEVEIL_PALETTE.shortcut.closed,
  'final-gate': MOURNEVEIL_PALETTE.finalGate.sealed,
} as const

/** Blockers/landmarks dressed by ADR-0002 production shells — collider only. */
const DRESSED_PROXY_IDS = Object.freeze(
  new Set([
    'blocker.first-combat',
    'blocker.mixed.west',
    'blocker.mixed.east',
    'blocker.approach',
    'landmark.watch-column',
    'landmark.court-obelisk',
    'landmark.approach-cairn',
  ]),
)

const FADE_OPACITY = 0.22
const FADE_LERP = 10

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

function SolidVisual({ collider, color }: { readonly collider: ConnectedLevelBoxCollider; readonly color: string }) {
  const materialRef = useRef<MeshStandardMaterial>(null)
  const isFloor = collider.kind === 'floor'
  const isGate = collider.kind === 'shortcut-gate' || collider.kind === 'final-gate'
  const isCheckpoint = collider.kind === 'checkpoint'
  const isDressedBlocker = DRESSED_PROXY_IDS.has(collider.id)
  const showProxyMesh = !isFloor && !isCheckpoint && !isDressedBlocker

  useEffect(() => {
    const material = materialRef.current
    if (material === null || !showProxyMesh || isGate) return
    return registerOcclusionMaterial({ id: collider.id, material, baseOpacity: 1 })
  }, [collider.id, isGate, showProxyMesh])

  const halfExtents: [number, number, number] = [
    collider.size[0] / 2,
    collider.size[1] / 2,
    collider.size[2] / 2,
  ]

  return (
    <RigidBody type="fixed" colliders={false} position={collider.position}>
      <CuboidCollider args={halfExtents} />
      {!showProxyMesh ? null : isGate ? (
        <FuneraryGateVisual collider={collider} materialRef={materialRef} />
      ) : (
        <mesh castShadow receiveShadow userData={{ solidId: collider.id }}>
          <boxGeometry args={collider.size} />
          <meshStandardMaterial
            ref={materialRef}
            color={color}
            roughness={0.9}
            metalness={0.03}
            transparent
            opacity={1}
            depthWrite
          />
        </mesh>
      )}
    </RigidBody>
  )
}

/** Presentation-only fade of foreground solids between camera and player. */
export function CameraOcclusionFader({ runtime }: { readonly runtime: GameRuntime }) {
  const solidsRef = useRef<Array<{ id: string; box: ReturnType<typeof aabbFromCenterSize> }>>([])

  useFrame(({ camera }, delta) => {
    const world = runtime.snapshot().world
    solidsRef.current = activeConnectedLevelColliders({
      shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
      finalGateOpen: world.finalGateReached,
    })
      .filter((collider) => collider.kind !== 'floor')
      .map((collider) => ({ id: collider.id, box: aabbFromCenterSize(collider.position, collider.size) }))

    const player = runtime.snapshot().player.position
    const occluded = new Set(
      occludingSolidIds(
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        { x: player.x, y: player.y + 0.55, z: player.z },
        solidsRef.current,
      ),
    )
    const blend = Math.min(1, delta * FADE_LERP)

    forEachOcclusionMaterial((id, entry) => {
      const target = occluded.has(id) ? FADE_OPACITY : entry.baseOpacity
      entry.material.transparent = true
      entry.material.opacity += (target - entry.material.opacity) * blend
      entry.material.depthWrite = entry.material.opacity > 0.85
      entry.material.needsUpdate = true
    })
  })

  return null
}

export function ConnectedLevelVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const world = runtime.snapshot().world
  const colliders = activeConnectedLevelColliders({
    shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
    finalGateOpen: world.finalGateReached,
  })
  const landmarkIds = new Set(CONNECTED_LEVEL_LANDMARKS.map((entry) => entry.id))

  return (
    <>
      {colliders.map((collider) => (
        <SolidVisual
          key={collider.id}
          collider={collider}
          color={
            collider.color ??
            (landmarkIds.has(collider.id)
              ? COLORS.blocker
              : COLORS[collider.kind as keyof typeof COLORS] ?? COLORS.wall)
          }
        />
      ))}

      <OssuaryEnvironmentKit />
    </>
  )
}
