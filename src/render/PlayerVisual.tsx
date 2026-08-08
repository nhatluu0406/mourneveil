import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import {
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
} from '../physics/playerCollisionConfig'
import {
  PLAYER_FACING_MARKER_POSITION,
  PLAYER_FACING_MARKER_SIZE,
} from './playerVisualConfig'
import { computePlayerAttackPresentationPose } from './playerAttackPresentation'

export function PlayerVisual({ runtime }: { runtime: PlayerRuntime }) {
  const facingGroupRef = useRef<Group>(null)
  const weaponSweepRef = useRef<Group>(null)
  const weaponRef = useRef<Mesh>(null)
  const weaponMaterialRef = useRef<MeshStandardMaterial>(null)
  const contactShapeRef = useRef<Mesh>(null)

  useFrame(() => {
    const snapshot = runtime.snapshot()
    const facingGroup = facingGroupRef.current
    const weaponSweep = weaponSweepRef.current
    const weapon = weaponRef.current
    const weaponMaterial = weaponMaterialRef.current
    const contactShape = contactShapeRef.current
    if (
      facingGroup === null ||
      weaponSweep === null ||
      weapon === null ||
      weaponMaterial === null ||
      contactShape === null
    ) {
      return
    }

    facingGroup.rotation.y = Math.atan2(
      snapshot.player.facing.x,
      -snapshot.player.facing.z,
    )
    const pose = computePlayerAttackPresentationPose(snapshot.combat)
    weapon.visible = pose.weaponVisible
    weaponSweep.rotation.y = pose.weaponYawRadians
    weaponMaterial.color.set(pose.color)

    const activeShape = snapshot.attack.activeContactShape
    contactShape.visible = activeShape !== null
    if (activeShape !== null) {
      contactShape.position.set(0, 0, -activeShape.forwardOffset)
      contactShape.scale.setScalar(activeShape.radius)
    }
  })

  return (
    <group ref={facingGroupRef}>
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
      <group ref={weaponSweepRef}>
        <mesh ref={weaponRef} castShadow position={[0, 0.48, -0.72]}>
          <boxGeometry args={[0.09, 0.09, 0.9]} />
          <meshStandardMaterial ref={weaponMaterialRef} roughness={0.42} />
        </mesh>
      </group>
      <mesh ref={contactShapeRef} position={[0, 0, -0.82]} visible={false}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshBasicMaterial
          color="#f4d06f"
          transparent
          opacity={0.22}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
