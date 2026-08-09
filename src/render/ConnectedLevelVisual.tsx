import { RigidBody } from '@react-three/rapier'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import { activeConnectedLevelColliders } from '../physics/connectedLevelCollision'

const COLORS = {
  floor: '#1a221e',
  wall: '#5f6b64',
  blocker: '#8a7457',
  'shortcut-gate': '#c4893d',
  'final-gate': '#8a4d63',
} as const

const LANDMARKS = [
  { id: 'landmark.arrival-post', position: [-14.2, 0.95, 7.4] as const, size: [0.35, 1.9, 0.35] as const, color: '#6f8578' },
  { id: 'landmark.watch-column', position: [-10.4, 1.1, 1.2] as const, size: [0.45, 2.2, 0.45] as const, color: '#748a7a' },
  { id: 'landmark.court-obelisk', position: [1.1, 1.15, -6.4] as const, size: [0.4, 2.3, 0.4] as const, color: '#8a6b52' },
  { id: 'landmark.approach-cairn', position: [8.4, 0.85, -2.4] as const, size: [0.7, 1.5, 0.7] as const, color: '#6e5858' },
  { id: 'landmark.arena-frame-left', position: [11.2, 1.35, -5.4] as const, size: [0.35, 2.7, 0.35] as const, color: '#6a4f5d' },
  { id: 'landmark.arena-frame-right', position: [11.2, 1.35, -2.6] as const, size: [0.35, 2.7, 0.35] as const, color: '#6a4f5d' },
] as const

export function ConnectedLevelVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const world = runtime.snapshot().world
  const shortcutOpen = world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed')
  const finalGateOpen = world.finalGateReached
  const colliders = activeConnectedLevelColliders({
    shortcutOpen,
    finalGateOpen,
  })
  return (
    <>
      {colliders.map((collider) => {
        const isGate =
          collider.kind === 'shortcut-gate' || collider.kind === 'final-gate'
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
                color={COLORS[collider.kind]}
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

      {LANDMARKS.map((landmark) => (
        <mesh key={landmark.id} castShadow position={[...landmark.position]}>
          <boxGeometry args={[...landmark.size]} />
          <meshStandardMaterial color={landmark.color} roughness={0.82} />
        </mesh>
      ))}

      {/* Decorative crown pieces on major dividers — presentation only. */}
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
