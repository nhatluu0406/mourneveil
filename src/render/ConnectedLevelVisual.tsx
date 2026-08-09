import { RigidBody } from '@react-three/rapier'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import { activeConnectedLevelColliders } from '../physics/connectedLevelCollision'

const COLORS = {
  floor: '#202925',
  wall: '#66736c',
  blocker: '#8a7457',
  'shortcut-gate': '#b78247',
  'final-gate': '#745260',
} as const

export function ConnectedLevelVisual({ runtime }: { readonly runtime: GameRuntime }) {
  const world = runtime.snapshot().world
  const colliders = activeConnectedLevelColliders({
    shortcutOpen: world.openedShortcutIds.includes('connection.shortcut-checkpoint-mixed'),
    finalGateOpen: world.finalGateReached,
  })
  return (
    <>
      {colliders.map((collider) => (
        <RigidBody
          key={collider.id}
          type="fixed"
          colliders="cuboid"
          position={collider.position}
        >
          <mesh castShadow={collider.kind !== 'floor'} receiveShadow>
            <boxGeometry args={collider.size} />
            <meshStandardMaterial color={COLORS[collider.kind]} roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
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
    </>
  )
}
