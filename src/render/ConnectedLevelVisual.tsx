import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import {
  CONNECTED_LEVEL_LANDMARKS,
  activeConnectedLevelColliders,
  type ConnectedLevelBoxCollider,
} from '../physics/connectedLevelCollision'
import {
  aabbFromCenterSize,
  occludingSolidIds,
} from './cameraOcclusion'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { forEachOcclusionMaterial, registerOcclusionMaterial } from './occlusionMaterials'

const COLORS = {
  floor: MOURNEVEIL_PALETTE.environment.floor,
  wall: MOURNEVEIL_PALETTE.environment.wall,
  blocker: MOURNEVEIL_PALETTE.environment.blocker,
  'shortcut-gate': MOURNEVEIL_PALETTE.shortcut.closed,
  'final-gate': MOURNEVEIL_PALETTE.finalGate.sealed,
} as const

const FADE_OPACITY = 0.22
const FADE_LERP = 10

function SolidVisual({
  collider,
  color,
}: {
  readonly collider: ConnectedLevelBoxCollider
  readonly color: string
}) {
  const materialRef = useRef<MeshStandardMaterial>(null)
  const isFloor = collider.kind === 'floor'
  const isGate = collider.kind === 'shortcut-gate' || collider.kind === 'final-gate'

  useEffect(() => {
    const material = materialRef.current
    if (material === null || isFloor) return
    return registerOcclusionMaterial({
      id: collider.id,
      material,
      baseOpacity: 1,
    })
  }, [collider.id, isFloor])

  // Explicit cuboid half-extents — do not use mesh auto-colliders (scale/AABB drift).
  const halfExtents: [number, number, number] = [
    collider.size[0] / 2,
    collider.size[1] / 2,
    collider.size[2] / 2,
  ]

  return (
    <RigidBody type="fixed" colliders={false} position={collider.position}>
      <CuboidCollider args={halfExtents} />
      <mesh castShadow={!isFloor} receiveShadow userData={{ solidId: collider.id }}>
        <boxGeometry args={collider.size} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          roughness={isGate ? 0.55 : 0.9}
          metalness={isGate ? 0.18 : 0.02}
          emissive={
            collider.kind === 'final-gate'
              ? MOURNEVEIL_PALETTE.finalGate.emissive
              : collider.kind === 'shortcut-gate'
                ? MOURNEVEIL_PALETTE.shortcut.emissive
                : '#000000'
          }
          transparent
          opacity={1}
          depthWrite
        />
      </mesh>
    </RigidBody>
  )
}

/** Presentation-only fade of foreground solids between camera and player. */
export function CameraOcclusionFader({ runtime }: { readonly runtime: GameRuntime }) {
  const solidsRef = useRef<Array<{ id: string; box: ReturnType<typeof aabbFromCenterSize> }>>([])

  useFrame(({ camera }, delta) => {
    const world = runtime.snapshot().world
    const colliders = activeConnectedLevelColliders({
      shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
      finalGateOpen: world.finalGateReached,
    })
    solidsRef.current = colliders
      .filter((collider) => collider.kind !== 'floor')
      .map((collider) => ({
        id: collider.id,
        box: aabbFromCenterSize(collider.position, collider.size),
      }))

    const player = runtime.snapshot().player.position
    const focus = { x: player.x, y: player.y + 0.55, z: player.z }
    const cam = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const occluded = new Set(occludingSolidIds(cam, focus, solidsRef.current))
    const blend = Math.min(1, delta * FADE_LERP)

    forEachOcclusionMaterial((id, entry) => {
      const target = occluded.has(id) ? FADE_OPACITY : entry.baseOpacity
      const material = entry.material
      material.transparent = true
      material.opacity += (target - material.opacity) * blend
      material.depthWrite = material.opacity > 0.85
      material.needsUpdate = true
    })
  })

  return null
}

export function ConnectedLevelVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const world = runtime.snapshot().world
  const shortcutOpen = world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  const finalGateOpen = world.finalGateReached
  const colliders = activeConnectedLevelColliders({
    shortcutOpen,
    finalGateOpen,
  })
  const landmarkIds = new Set(CONNECTED_LEVEL_LANDMARKS.map((entry) => entry.id))

  return (
    <>
      {colliders.map((collider) => {
        const color =
          collider.color ??
          (landmarkIds.has(collider.id) ? COLORS.blocker : COLORS[collider.kind])
        return <SolidVisual key={collider.id} collider={collider} color={color} />
      })}

      {MOURNEVEIL_CONNECTED_LEVEL.zones.map((zone) => {
        const width = zone.bounds.maximumX - zone.bounds.minimumX
        const depth = zone.bounds.maximumZ - zone.bounds.minimumZ
        const cx = (zone.bounds.minimumX + zone.bounds.maximumX) / 2
        const cz = (zone.bounds.minimumZ + zone.bounds.maximumZ) / 2
        return (
          <group key={zone.id}>
            <mesh receiveShadow position={[cx, 0.012, cz]}>
              <boxGeometry args={[width, 0.02, depth]} />
              <meshStandardMaterial color={zone.presentation.floorColor} roughness={0.96} />
            </mesh>
            {/* Large stone division lines — authored floor treatment, not a debug grid. */}
            <mesh receiveShadow position={[cx, 0.02, cz]}>
              <boxGeometry args={[width * 0.98, 0.01, 0.04]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.border} roughness={1} />
            </mesh>
            <mesh receiveShadow position={[cx, 0.02, cz]}>
              <boxGeometry args={[0.04, 0.01, depth * 0.98]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.border} roughness={1} />
            </mesh>
          </group>
        )
      })}

      {/*
        Decorative props must read as debris/background — never full-height fake walls.
        Gameplay solids already render via SolidVisual / CONNECTED_LEVEL_COLLIDERS.
      */}
      {/* Wall caps sit atop solid dividers (not walkable path blockers). */}
      <mesh position={[-3, 1.55, 1]} castShadow>
        <boxGeometry args={[0.55, 0.18, 3.2]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.88} />
      </mesh>
      <mesh position={[10, 1.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.18, 4]} />
        <meshStandardMaterial color="#52444c" roughness={0.88} />
      </mesh>

      {/* Arrival rubble near solid post — low silhouette. */}
      <mesh position={[-12.6, 0.18, 7.5]} castShadow>
        <boxGeometry args={[0.55, 0.28, 0.4]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.wall} roughness={0.92} />
      </mesh>
      <mesh position={[-12.35, 0.12, 7.85]} rotation={[0, 0.4, 0.15]} castShadow>
        <boxGeometry args={[0.35, 0.18, 0.28]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.94} />
      </mesh>

      {/* Outer watch rubble scrap (was fake wall). */}
      <mesh position={[-9.2, 0.22, 4.6]} castShadow>
        <boxGeometry args={[1.1, 0.28, 0.45]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.93} />
      </mesh>
      <mesh position={[-8.7, 0.16, 4.9]} rotation={[0.2, 0.3, 0]} castShadow>
        <boxGeometry args={[0.45, 0.2, 0.3]} />
        <meshStandardMaterial color="#4a524c" roughness={0.94} />
      </mesh>

      {/* Mixed court floor borders — clearly ground dressing. */}
      <mesh position={[1, 0.08, -1.4]} castShadow>
        <boxGeometry args={[3.2, 0.12, 0.28]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.border} roughness={0.95} />
      </mesh>
      <mesh position={[1, 0.08, -6.5]} castShadow>
        <boxGeometry args={[3.2, 0.12, 0.28]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.border} roughness={0.95} />
      </mesh>

      {/* Ash walk rubble clusters. */}
      <mesh position={[6.2, 0.2, -6.35]} castShadow>
        <boxGeometry args={[0.7, 0.32, 0.4]} />
        <meshStandardMaterial color="#4a3a38" roughness={0.93} />
      </mesh>
      <mesh position={[8.9, 0.16, -1.55]} castShadow>
        <boxGeometry args={[0.55, 0.24, 0.35]} />
        <meshStandardMaterial color="#453532" roughness={0.93} />
      </mesh>

      {/* Arena approach debris — low, not pillars. */}
      <mesh position={[12.4, 0.18, -6.5]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.45]} />
        <meshStandardMaterial color="#3a2c38" roughness={0.9} />
      </mesh>
      <mesh position={[12.4, 0.18, -1.5]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.45]} />
        <meshStandardMaterial color="#3a2c38" roughness={0.9} />
      </mesh>

      {/* Shortcut / final-gate language: lintels above solids, floor marks when open — no walk-through towers. */}
      {!shortcutOpen ? (
        <mesh position={[-3, 1.6, -1.3]} castShadow>
          <boxGeometry args={[0.7, 0.22, 1.5]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.shortcut.closed}
            emissive={MOURNEVEIL_PALETTE.shortcut.emissive}
            emissiveIntensity={0.45}
            roughness={0.5}
          />
        </mesh>
      ) : (
        <mesh position={[-3, 0.06, -1.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.9, 20]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.shortcut.open}
            emissive={MOURNEVEIL_PALETTE.shortcut.emissive}
            roughness={0.55}
          />
        </mesh>
      )}

      {!finalGateOpen ? (
        <>
          <mesh position={[10, 1.65, -4]} castShadow>
            <boxGeometry args={[0.85, 0.28, 2.2]} />
            <meshStandardMaterial
              color={MOURNEVEIL_PALETTE.finalGate.sealed}
              emissive={MOURNEVEIL_PALETTE.finalGate.emissive}
              emissiveIntensity={0.55}
              roughness={0.48}
            />
          </mesh>
          <mesh position={[10, 2.05, -4]} castShadow>
            <boxGeometry args={[1.3, 0.2, 0.4]} />
            <meshStandardMaterial color="#3a2430" roughness={0.7} />
          </mesh>
        </>
      ) : (
        <mesh position={[10, 0.06, -4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 1.15, 22]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.finalGate.open}
            emissive={MOURNEVEIL_PALETTE.finalGate.emissive}
            roughness={0.5}
          />
        </mesh>
      )}
    </>
  )
}
