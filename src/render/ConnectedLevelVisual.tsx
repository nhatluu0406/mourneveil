import { RigidBody } from '@react-three/rapier'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import {
  CONNECTED_LEVEL_LANDMARKS,
  activeConnectedLevelColliders,
} from '../physics/connectedLevelCollision'

const COLORS = {
  floor: '#1a221e',
  wall: '#5f6b64',
  blocker: '#8a7457',
  'shortcut-gate': '#c4893d',
  'final-gate': '#8a4d63',
} as const

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
        const isGate =
          collider.kind === 'shortcut-gate' || collider.kind === 'final-gate'
        const color =
          collider.color ??
          (landmarkIds.has(collider.id) ? COLORS.blocker : COLORS[collider.kind])
        return (
          <RigidBody
            key={collider.id}
            type="fixed"
            colliders="cuboid"
            position={collider.position}
          >
            <mesh castShadow={collider.kind !== 'floor'} receiveShadow>
              <boxGeometry args={collider.size} />
              <meshStandardMaterial
                color={color}
                roughness={isGate ? 0.55 : 0.9}
                metalness={isGate ? 0.18 : 0.02}
                emissive={
                  collider.kind === 'final-gate'
                    ? '#3a1824'
                    : collider.kind === 'shortcut-gate'
                      ? '#3a2810'
                      : '#000000'
                }
              />
            </mesh>
          </RigidBody>
        )
      })}

      {MOURNEVEIL_CONNECTED_LEVEL.zones.map((zone) => {
        const width = zone.bounds.maximumX - zone.bounds.minimumX
        const depth = zone.bounds.maximumZ - zone.bounds.minimumZ
        return (
          <mesh
            key={zone.id}
            receiveShadow
            position={[
              (zone.bounds.minimumX + zone.bounds.maximumX) / 2,
              0.012,
              (zone.bounds.minimumZ + zone.bounds.maximumZ) / 2,
            ]}
          >
            <boxGeometry args={[width, 0.02, depth]} />
            <meshStandardMaterial color={zone.presentation.floorColor} roughness={0.96} />
          </mesh>
        )
      })}

      {/* Decorative crown pieces sit above authored divider colliders — not solids. */}
      <mesh position={[-3, 1.65, 1]} castShadow>
        <boxGeometry args={[0.35, 0.4, 4]} />
        <meshStandardMaterial color="#4f5a54" roughness={0.88} />
      </mesh>
      <mesh position={[10, 1.65, 0]} castShadow>
        <boxGeometry args={[0.35, 0.4, 5]} />
        <meshStandardMaterial color="#52444c" roughness={0.88} />
      </mesh>

      {shortcutOpen ? (
        <mesh position={[-3, 0.08, -1.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.85, 20]} />
          <meshStandardMaterial color="#d7a35a" emissive="#5a3a12" roughness={0.55} />
        </mesh>
      ) : (
        <mesh position={[-3, 1.7, -1.3]}>
          <boxGeometry args={[0.2, 0.35, 1.2]} />
          <meshStandardMaterial color="#e0a45a" emissive="#4a3010" roughness={0.5} />
        </mesh>
      )}
      {finalGateOpen ? (
        <mesh position={[10, 0.08, -4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 1.05, 22]} />
          <meshStandardMaterial color="#c27a96" emissive="#401828" roughness={0.5} />
        </mesh>
      ) : (
        <mesh position={[10, 1.85, -4]}>
          <boxGeometry args={[0.25, 0.45, 1.5]} />
          <meshStandardMaterial color="#c27a96" emissive="#401828" roughness={0.48} />
        </mesh>
      )}
    </>
  )
}
