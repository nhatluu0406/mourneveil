import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
} from '../physics/playerCollisionConfig'
import {
  PLAYER_FACING_MARKER_POSITION,
  PLAYER_FACING_MARKER_SIZE,
} from './playerVisualConfig'
import {
  computePlayerAttackPresentationPose,
  resolveAttackPresentationFacing,
} from './playerAttackPresentation'

export function PlayerVisual({ runtime }: { runtime: GameRuntime }) {
  const facingGroupRef = useRef<Group>(null)
  const weaponSweepRef = useRef<Group>(null)
  const weaponRef = useRef<Mesh>(null)
  const weaponMaterialRef = useRef<MeshStandardMaterial>(null)
  const contactShapeRef = useRef<Mesh>(null)
  const guardMarkerRef = useRef<Mesh>(null)

  useFrame(() => {
    const snapshot = runtime.snapshot()
    const facingGroup = facingGroupRef.current
    const weaponSweep = weaponSweepRef.current
    const weapon = weaponRef.current
    const weaponMaterial = weaponMaterialRef.current
    const contactShape = contactShapeRef.current
    const guardMarker = guardMarkerRef.current
    if (
      facingGroup === null ||
      weaponSweep === null ||
      weapon === null ||
      weaponMaterial === null ||
      contactShape === null ||
      guardMarker === null
    ) {
      return
    }
    guardMarker.visible = snapshot.defense.guarding

    const facing = resolveAttackPresentationFacing(snapshot.attack, snapshot.player)
    facingGroup.rotation.y = Math.atan2(facing.x, -facing.z)
    const pose = computePlayerAttackPresentationPose(snapshot.combat)
    weapon.visible = pose.weaponVisible
    weapon.position.set(0, 0.48, pose.weaponForwardOffset)
    weaponSweep.rotation.y = pose.weaponYawRadians
    weaponMaterial.color.set(pose.color)

    const activeShape = snapshot.attack.activeContactShape
    contactShape.visible = activeShape !== null
    if (activeShape !== null) {
      // Local -Z matches execution-facing forward used by the authoritative sphere.
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
        <meshStandardMaterial color="#d9b07a" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#c99662" roughness={0.6} />
      </mesh>
      {/* Facing chevron keeps player silhouette readable from above. */}
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
        <meshStandardMaterial color="#3f7d86" roughness={0.5} metalness={0.12} />
      </mesh>
      <group ref={weaponSweepRef}>
        <mesh ref={weaponRef} castShadow position={[0, 0.48, -0.72]}>
          <boxGeometry args={[0.08, 0.08, 0.95]} />
          <meshStandardMaterial ref={weaponMaterialRef} roughness={0.38} metalness={0.35} />
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
      <mesh ref={guardMarkerRef} position={[0, 0.42, -0.48]} visible={false}>
        <boxGeometry args={[0.7, 0.72, 0.08]} />
        <meshBasicMaterial color="#8fc4da" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
