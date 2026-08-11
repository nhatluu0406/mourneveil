import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import {
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
} from '../physics/playerCollisionConfig'
import {
  computePlayerAttackPresentationPose,
  resolveAttackPresentationFacing,
} from './playerAttackPresentation'
import { localNegativeZFacingYaw } from './enemyAttackPresentation'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { projectPlayerAnimation } from './animation/playerAnimationProjection'
import { resolvePlayerProceduralPose } from './animation/playerProceduralPose'

const PLAYER_PLACEHOLDER_BLADE_LENGTH = 0.56
const PLAYER_PLACEHOLDER_WEAPON_X = 0.28

export function PlayerVisual({ runtime }: { runtime: GameRuntime }) {
  const facingGroupRef = useRef<Group>(null)
  const bodyGroupRef = useRef<Group>(null)
  const weaponSweepRef = useRef<Group>(null)
  const weaponRef = useRef<Mesh>(null)
  const weaponMaterialRef = useRef<MeshStandardMaterial>(null)
  const contactShapeRef = useRef<Mesh>(null)
  const guardMarkerRef = useRef<Mesh>(null)
  const guardMaterialRef = useRef<MeshStandardMaterial>(null)
  const torsoMaterialRef = useRef<MeshStandardMaterial>(null)
  const cloakMaterialRef = useRef<MeshStandardMaterial>(null)
  const torsoRef = useRef<Mesh>(null)
  const leftLegRef = useRef<Mesh>(null)
  const rightLegRef = useRef<Mesh>(null)
  const leftArmRef = useRef<Mesh>(null)
  const rightArmRef = useRef<Mesh>(null)

  useFrame((_state, deltaSeconds) => {
    const snapshot = runtime.snapshot()
    const animation = projectPlayerAnimation(snapshot)
    const proceduralPose = resolvePlayerProceduralPose(
      animation,
      snapshot.simulation.stepCount,
    )
    const facingGroup = facingGroupRef.current
    const bodyGroup = bodyGroupRef.current
    const weaponSweep = weaponSweepRef.current
    const weapon = weaponRef.current
    const weaponMaterial = weaponMaterialRef.current
    const contactShape = contactShapeRef.current
    const guardMarker = guardMarkerRef.current
    const guardMaterial = guardMaterialRef.current
    const torsoMaterial = torsoMaterialRef.current
    const cloakMaterial = cloakMaterialRef.current
    const torso = torsoRef.current
    const leftLeg = leftLegRef.current
    const rightLeg = rightLegRef.current
    const leftArm = leftArmRef.current
    const rightArm = rightArmRef.current
    if (
      facingGroup === null ||
      bodyGroup === null ||
      weaponSweep === null ||
      weapon === null ||
      weaponMaterial === null ||
      contactShape === null ||
      guardMarker === null ||
      guardMaterial === null ||
      torsoMaterial === null ||
      cloakMaterial === null ||
      torso === null ||
      leftLeg === null ||
      rightLeg === null ||
      leftArm === null ||
      rightArm === null
    ) {
      return
    }
    guardMarker.visible = animation.mode === 'guard' || snapshot.defense.guardBroken
    guardMaterial.color.set(snapshot.defense.guardBroken ? '#ff765e' : '#8fc4da')
    guardMaterial.emissive.set(snapshot.defense.guardBroken ? '#9f241e' : '#17343d')
    guardMaterial.emissiveIntensity = snapshot.defense.guardBroken ? 0.75 : 0.18

    const facing = resolveAttackPresentationFacing(snapshot.attack, {
      facing: animation.facing,
    })
    facingGroup.rotation.y = localNegativeZFacingYaw(facing)
    const pose = computePlayerAttackPresentationPose(snapshot.combat)
    weapon.visible = pose.weaponVisible
    weaponSweep.rotation.y = pose.weaponYawRadians
    weaponMaterial.color.set(pose.color)

    const damping = Math.max(1, 1 / Math.max(animation.transition.blendSeconds, 0.001))
    weapon.position.set(PLAYER_PLACEHOLDER_WEAPON_X, 0.05, pose.weaponForwardOffset)
    bodyGroup.scale.x = MathUtils.damp(bodyGroup.scale.x, proceduralPose.bodyScaleX, damping, deltaSeconds)
    bodyGroup.scale.y = MathUtils.damp(bodyGroup.scale.y, proceduralPose.bodyScaleY, damping, deltaSeconds)
    bodyGroup.scale.z = MathUtils.damp(bodyGroup.scale.z, proceduralPose.bodyScaleZ, damping, deltaSeconds)
    bodyGroup.rotation.z = MathUtils.damp(bodyGroup.rotation.z, proceduralPose.bodyRoll, damping, deltaSeconds)
    bodyGroup.position.y = MathUtils.damp(bodyGroup.position.y, proceduralPose.bodyOffsetY, damping, deltaSeconds)
    bodyGroup.position.x = MathUtils.damp(bodyGroup.position.x, proceduralPose.bodyOffsetX, damping, deltaSeconds)
    torso.rotation.x = MathUtils.damp(torso.rotation.x, proceduralPose.torsoPitch, damping, deltaSeconds)
    leftLeg.rotation.x = MathUtils.damp(leftLeg.rotation.x, proceduralPose.limbSwing, damping, deltaSeconds)
    rightLeg.rotation.x = MathUtils.damp(rightLeg.rotation.x, -proceduralPose.limbSwing, damping, deltaSeconds)
    leftArm.rotation.x = MathUtils.damp(leftArm.rotation.x, 0.15 + proceduralPose.leftArmPitch, damping, deltaSeconds)
    rightArm.rotation.x = MathUtils.damp(rightArm.rotation.x, 0.15 + proceduralPose.rightArmPitch, damping, deltaSeconds)
    weaponSweep.rotation.x = MathUtils.damp(weaponSweep.rotation.x, proceduralPose.weaponPitch, damping, deltaSeconds)

    const flash = animation.mode !== 'defeated' && animation.hitReactionToken !== null
    for (const material of [torsoMaterial, cloakMaterial]) {
      material.emissive.set(flash ? MOURNEVEIL_PALETTE.damage : '#000000')
      material.emissiveIntensity = flash ? 0.45 : 0
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
        <mesh visible={false}>
          <capsuleGeometry
            args={[PLAYER_CAPSULE_RADIUS, PLAYER_CAPSULE_HALF_HEIGHT * 2, 4, 8]}
          />
        </mesh>
        {/* Lower stance / greaves */}
        <mesh ref={leftLegRef} castShadow position={[-0.11, -0.42, 0.02]}>
          <boxGeometry args={[0.16, 0.42, 0.18]} />
          <meshStandardMaterial color="#4a433a" roughness={0.92} />
        </mesh>
        <mesh ref={rightLegRef} castShadow position={[0.11, -0.42, 0.02]}>
          <boxGeometry args={[0.16, 0.42, 0.18]} />
          <meshStandardMaterial color="#4a433a" roughness={0.92} />
        </mesh>
        {/* Torso / tabard */}
        <mesh ref={torsoRef} castShadow position={[0, 0.02, 0]}>
          <boxGeometry args={[0.42, 0.55, 0.28]} />
          <meshStandardMaterial
            ref={torsoMaterialRef}
            color="#6d5a45"
            roughness={0.88}
            metalness={0.04}
          />
        </mesh>
        <mesh castShadow position={[0, 0.08, 0.02]}>
          <boxGeometry args={[0.34, 0.42, 0.18]} />
          <meshStandardMaterial color="#3f8f9a" roughness={0.72} metalness={0.08} />
        </mesh>
        {/* Shoulders */}
        <mesh castShadow position={[-0.28, 0.28, 0]}>
          <boxGeometry args={[0.2, 0.16, 0.24]} />
          <meshStandardMaterial color="#5a4c3d" roughness={0.86} />
        </mesh>
        <mesh castShadow position={[0.28, 0.28, 0]}>
          <boxGeometry args={[0.2, 0.16, 0.24]} />
          <meshStandardMaterial color="#5a4c3d" roughness={0.86} />
        </mesh>
        {/* Arms */}
        <mesh ref={leftArmRef} castShadow position={[-0.34, 0.02, 0]} rotation={[0.15, 0, 0.2]}>
          <boxGeometry args={[0.1, 0.38, 0.1]} />
          <meshStandardMaterial color="#5c5044" roughness={0.9} />
        </mesh>
        <mesh ref={rightArmRef} castShadow position={[0.34, 0.02, 0]} rotation={[0.15, 0, -0.2]}>
          <boxGeometry args={[0.1, 0.38, 0.1]} />
          <meshStandardMaterial color="#5c5044" roughness={0.9} />
        </mesh>
        {/* Hooded / faceted head */}
        <mesh castShadow position={[0, 0.48, 0.02]}>
          <boxGeometry args={[0.26, 0.24, 0.24]} />
          <meshStandardMaterial color="#c2a07a" roughness={0.78} />
        </mesh>
        <mesh castShadow position={[0, 0.58, -0.02]}>
          <boxGeometry args={[0.3, 0.14, 0.28]} />
          <meshStandardMaterial
            ref={cloakMaterialRef}
            color="#3d4f52"
            roughness={0.9}
          />
        </mesh>
        {/* Cloak mass */}
        <mesh castShadow position={[0, -0.05, -0.18]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.48, 0.7, 0.08]} />
          <meshStandardMaterial color="#2f3a3c" roughness={0.94} />
        </mesh>
        {/* Facing wedge */}
        <mesh castShadow position={[0, 0.15, -0.34]}>
          <boxGeometry args={[0.14, 0.08, 0.22]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.player.accent} roughness={0.55} metalness={0.15} />
        </mesh>
      </group>
      <group ref={weaponSweepRef}>
        <mesh ref={weaponRef} castShadow position={[PLAYER_PLACEHOLDER_WEAPON_X, 0.05, -0.62]}>
          <boxGeometry args={[0.05, 0.05, PLAYER_PLACEHOLDER_BLADE_LENGTH]} />
          <meshStandardMaterial
            ref={weaponMaterialRef}
            color="#b8a888"
            roughness={0.35}
            metalness={0.55}
          />
        </mesh>
        <mesh position={[0.28, 0.05, -0.28]} castShadow>
          <boxGeometry args={[0.14, 0.04, 0.08]} />
          <meshStandardMaterial color="#6a5a48" roughness={0.7} metalness={0.25} />
        </mesh>
      </group>
      <mesh ref={contactShapeRef} position={[0, 0, -0.82]} visible={false}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#f4d06f" transparent opacity={0.18} wireframe depthWrite={false} />
      </mesh>
      <mesh ref={guardMarkerRef} position={[0, 0.22, -0.36]} visible={false}>
        <boxGeometry args={[0.5, 0.55, 0.06]} />
        <meshStandardMaterial ref={guardMaterialRef} color="#8fc4da" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
