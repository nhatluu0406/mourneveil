import {
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
} from '../physics/playerCollisionConfig'
import {
  PLAYER_FACING_MARKER_POSITION,
  PLAYER_FACING_MARKER_SIZE,
} from './playerVisualConfig'

export function PlayerVisual() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <capsuleGeometry
          args={[
            PLAYER_CAPSULE_RADIUS,
            PLAYER_CAPSULE_HALF_HEIGHT * 2,
            8,
            16,
          ]}
        />
        <meshStandardMaterial color="#d2a36a" roughness={0.62} metalness={0.04} />
      </mesh>
      <mesh
        castShadow
        position={[
          PLAYER_FACING_MARKER_POSITION.x,
          PLAYER_FACING_MARKER_POSITION.y,
          PLAYER_FACING_MARKER_POSITION.z,
        ]}
      >
        <boxGeometry
          args={[
            PLAYER_FACING_MARKER_SIZE.x,
            PLAYER_FACING_MARKER_SIZE.y,
            PLAYER_FACING_MARKER_SIZE.z,
          ]}
        />
        <meshStandardMaterial color="#f3ead7" roughness={0.5} />
      </mesh>
    </group>
  )
}
