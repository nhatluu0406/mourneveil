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
import { localNegativeZFacingYaw } from './enemyAttackPresentation'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

export function PlayerVisual({ runtime }: { runtime: GameRuntime }) {
  const facingGroupRef = useRef<Group>(null)
  const bodyGroupRef = useRef<Group>(null)
  const weaponSweepRef = useRef<Group>(null)
  const weaponRef = useRef<Mesh>(null)
  const weaponMaterialRef = useRef<MeshStandardMaterial>(null)
  const contactShapeRef = useRef<Mesh>(null)
  const guardMarkerRef = useRef<Mesh>(null)
  const torsoMaterialRef = useRef<MeshStandardMaterial>(null)
  const headMaterialRef = useRef<MeshStandardMaterial>(null)

  useFrame(() => {
    const snapshot = runtime.snapshot()
    const facingGroup = facingGroupRef.current
    const bodyGroup = bodyGroupRef.current
    const weaponSweep = weaponSweepRef.current
    const weapon = weaponRef.current
    const weaponMaterial = weaponMaterialRef.current
    const contactShape = contactShapeRef.current
    const guardMarker = guardMarkerRef.current
    const torsoMaterial = torsoMaterialRef.current
    const headMaterial = headMaterialRef.current
    if (
      facingGroup === null ||
      bodyGroup === null ||
      weaponSweep === null ||
      weapon === null ||
      weaponMaterial === null ||
      contactShape === null ||
      guardMarker === null ||
      torsoMaterial === null ||
      headMaterial === null
    ) {
      return
    }
    guardMarker.visible = snapshot.defense.guarding

    const facing = resolveAttackPresentationFacing(snapshot.attack, snapshot.player)
    facingGroup.rotation.y = localNegativeZFacingYaw(facing)
    const pose = computePlayerAttackPresentationPose(snapshot.combat)
    weapon.visible = pose.weaponVisible
    weapon.position.set(0.22, 0.12, pose.weaponForwardOffset)
    weaponSweep.rotation.y = pose.weaponYawRadians
    weaponMaterial.color.set(pose.color)

    const alive = snapshot.playerHealth.health.alive
    const dodging = snapshot.defense.dodgeMovementActive
    bodyGroup.scale.set(dodging ? 0.92 : 1, alive ? (dodging ? 0.92 : 1) : 0.22, dodging ? 1.08 : 1)
    bodyGroup.rotation.z = alive ? 0 : Math.PI / 2
    bodyGroup.position.y = alive ? 0 : -0.35
    bodyGroup.position.x = dodging ? 0.12 : 0

    const lastHit = snapshot.incomingContact.lastHit
    const flash =
      alive &&
      lastHit !== null &&
      lastHit.outcome === 'damaged' &&
      snapshot.simulation.stepCount - lastHit.simulationStep < 12
    for (const material of [torsoMaterial, headMaterial]) {
      material.emissive.set(flash ? MOURNEVEIL_PALETTE.damage : '#000000')
      material.emissiveIntensity = flash ? 0.55 : 0
    }

    const activeShape = snapshot.attack.activeContactShape
    contactShape.visible = import.meta.env.DEV && activeShape !== null
    if (activeShape !== null) {
      contactShape.position.set(0, 0, -activeShape.forwardOffset)
      contactShape.scale.setScalar(activeShape.radius)
    }
  })

  return (
    <group ref={facingGroupRef}>
      <group ref={bodyGroupRef}>
        {/* Invisible reference capsule size stays gameplay-owned; silhouette is decorative. */}
        <mesh visible={false}>
          <capsuleGeometry
            args={[PLAYER_CAPSULE_RADIUS, PLAYER_CAPSULE_HALF_HEIGHT * 2, 4, 8]}
          />
        </mesh>
        <mesh castShadow position={[0, -0.05, 0]}>
          <capsuleGeometry args={[0.22, 0.55, 6, 12]} />
          <meshStandardMaterial
            ref={torsoMaterialRef}
            color={MOURNEVEIL_PALETTE.player.cloth}
            roughness={0.62}
            metalness={0.05}
          />
        </mesh>
        <mesh castShadow position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial
            ref={headMaterialRef}
            color={MOURNEVEIL_PALETTE.player.skin}
            roughness={0.55}
          />
        </mesh>
        <mesh castShadow position={[-0.28, 0.28, 0]}>
          <capsuleGeometry args={[0.07, 0.32, 4, 8]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.player.cloth} roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0.28, 0.28, 0]}>
          <capsuleGeometry args={[0.07, 0.32, 4, 8]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.player.cloth} roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0, 0.18, 0.02]}>
          <boxGeometry args={[0.42, 0.28, 0.28]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.player.accent}
            roughness={0.5}
            metalness={0.12}
          />
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
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.player.accent}
            roughness={0.5}
            metalness={0.12}
          />
        </mesh>
      </group>
      <group ref={weaponSweepRef}>
        <mesh ref={weaponRef} castShadow position={[0.22, 0.12, -0.72]}>
          <boxGeometry args={[0.07, 0.07, 0.95]} />
          <meshStandardMaterial
            ref={weaponMaterialRef}
            color={MOURNEVEIL_PALETTE.player.metal}
            roughness={0.38}
            metalness={0.35}
          />
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
      <mesh ref={guardMarkerRef} position={[0, 0.3, -0.42]} visible={false}>
        <boxGeometry args={[0.55, 0.62, 0.08]} />
        <meshBasicMaterial color="#8fc4da" transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
