import { RigidBody } from '@react-three/rapier'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL } from '../game/world/connectedLevel'
import {
  CONNECTED_LEVEL_LANDMARKS,
  activeConnectedLevelColliders,
} from '../physics/connectedLevelCollision'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

const COLORS = {
  floor: MOURNEVEIL_PALETTE.environment.floor,
  wall: MOURNEVEIL_PALETTE.environment.wall,
  blocker: MOURNEVEIL_PALETTE.environment.blocker,
  'shortcut-gate': MOURNEVEIL_PALETTE.shortcut.closed,
  'final-gate': MOURNEVEIL_PALETTE.finalGate.sealed,
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
                    ? MOURNEVEIL_PALETTE.finalGate.emissive
                    : collider.kind === 'shortcut-gate'
                      ? MOURNEVEIL_PALETTE.shortcut.emissive
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

      {/* Decorative framing and zone landmarks — never collision-solid. */}
      <mesh position={[-3, 1.65, 1]} castShadow>
        <boxGeometry args={[0.35, 0.4, 4]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.88} />
      </mesh>
      <mesh position={[10, 1.65, 0]} castShadow>
        <boxGeometry args={[0.35, 0.4, 5]} />
        <meshStandardMaterial color="#52444c" roughness={0.88} />
      </mesh>
      {/* Arrival columns */}
      <mesh position={[-14.2, 1.1, 7.6]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 2.2, 8]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.9} />
      </mesh>
      <mesh position={[-12.4, 1.1, 7.8]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 2.0, 8]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.wall} roughness={0.9} />
      </mesh>
      {/* Outer watch ruined wall scrap */}
      <mesh position={[-9.2, 0.7, 4.6]} castShadow>
        <boxGeometry args={[1.4, 1.2, 0.28]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.masonry} roughness={0.92} />
      </mesh>
      {/* Mixed court floor border plinths */}
      <mesh position={[1, 0.12, -1.4]} castShadow>
        <boxGeometry args={[3.2, 0.18, 0.35]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.border} roughness={0.95} />
      </mesh>
      <mesh position={[1, 0.12, -6.5]} castShadow>
        <boxGeometry args={[3.2, 0.18, 0.35]} />
        <meshStandardMaterial color={MOURNEVEIL_PALETTE.environment.border} roughness={0.95} />
      </mesh>
      {/* Ash walk broken masonry */}
      <mesh position={[6.2, 0.45, -6.2]} castShadow>
        <boxGeometry args={[0.9, 0.7, 0.45]} />
        <meshStandardMaterial color="#4a3a38" roughness={0.93} />
      </mesh>
      <mesh position={[8.8, 0.35, -1.6]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.4]} />
        <meshStandardMaterial color="#453532" roughness={0.93} />
      </mesh>
      {/* Final arena gate plinths */}
      <mesh position={[12.2, 0.55, -6.4]} castShadow>
        <boxGeometry args={[0.55, 1.0, 0.55]} />
        <meshStandardMaterial color="#3a2c38" roughness={0.88} />
      </mesh>
      <mesh position={[12.2, 0.55, -1.6]} castShadow>
        <boxGeometry args={[0.55, 1.0, 0.55]} />
        <meshStandardMaterial color="#3a2c38" roughness={0.88} />
      </mesh>

      {/* Shortcut language */}
      <mesh position={[-3, 1.35, -1.3]} castShadow>
        <boxGeometry args={[0.55, 2.4, 0.18]} />
        <meshStandardMaterial
          color={shortcutOpen ? MOURNEVEIL_PALETTE.shortcut.open : MOURNEVEIL_PALETTE.shortcut.closed}
          emissive={MOURNEVEIL_PALETTE.shortcut.emissive}
          emissiveIntensity={shortcutOpen ? 0.35 : 0.55}
          roughness={0.5}
        />
      </mesh>
      {shortcutOpen ? (
        <mesh position={[-3, 0.08, -1.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.9, 20]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.shortcut.open}
            emissive={MOURNEVEIL_PALETTE.shortcut.emissive}
            roughness={0.55}
          />
        </mesh>
      ) : (
        <mesh position={[-3, 2.7, -1.3]}>
          <boxGeometry args={[0.7, 0.2, 0.25]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.warning} roughness={0.45} />
        </mesh>
      )}

      {/* Final gate language */}
      <mesh position={[10, 1.55, -4]} castShadow>
        <boxGeometry args={[0.7, 2.8, 0.22]} />
        <meshStandardMaterial
          color={
            finalGateOpen ? MOURNEVEIL_PALETTE.finalGate.open : MOURNEVEIL_PALETTE.finalGate.sealed
          }
          emissive={MOURNEVEIL_PALETTE.finalGate.emissive}
          emissiveIntensity={finalGateOpen ? 0.3 : 0.65}
          roughness={0.48}
        />
      </mesh>
      <mesh position={[10, 3.15, -4]} castShadow>
        <boxGeometry args={[1.4, 0.28, 0.35]} />
        <meshStandardMaterial color="#3a2430" roughness={0.7} />
      </mesh>
      {finalGateOpen ? (
        <mesh position={[10, 0.08, -4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 1.15, 22]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.finalGate.open}
            emissive={MOURNEVEIL_PALETTE.finalGate.emissive}
            roughness={0.5}
          />
        </mesh>
      ) : null}
    </>
  )
}
