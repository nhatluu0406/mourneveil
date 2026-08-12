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
import { resolvePlayerOutgoingHitConfirm } from './playerCombatFeedback'
import { combatContactCueLayout, shouldShowCombatContactDebug } from './combatContactCueLayout'
import { CombatContactVolumeCue } from './CombatContactVolumeCue'
import { createProfilePrismGeometry, createTaperedPrismGeometry } from './productionGeometry'
import { OathbladeVisual } from './actors/OathbladeVisual'

const PLAYER_WEAPON_X = 0.29
const WARDEN_TORSO = createTaperedPrismGeometry({ bottomWidth: 0.38, topWidth: 0.52, height: 0.58, depth: 0.3 })
const WARDEN_TABARD = createTaperedPrismGeometry({ bottomWidth: 0.28, topWidth: 0.34, height: 0.52, depth: 0.12 })
const WARDEN_GREAVE = createTaperedPrismGeometry({ bottomWidth: 0.13, topWidth: 0.19, height: 0.44, depth: 0.18 })
const WARDEN_ARM = createTaperedPrismGeometry({ bottomWidth: 0.09, topWidth: 0.15, height: 0.42, depth: 0.14 })
const WARDEN_CLOAK = createProfilePrismGeometry(
  [[-0.25, 0.28], [-0.34, -0.34], [0, -0.46], [0.34, -0.34], [0.25, 0.28]],
  0.055,
)
export function PlayerVisual({ runtime }: { runtime: GameRuntime }) {
  const facingGroupRef = useRef<Group>(null)
  const bodyGroupRef = useRef<Group>(null)
  const weaponSweepRef = useRef<Group>(null)
  const weaponRef = useRef<Group>(null)
  const weaponMaterialRef = useRef<MeshStandardMaterial>(null)
  const contactShapeRef = useRef<Group>(null)
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
    weapon.position.set(PLAYER_WEAPON_X, 0.06, pose.weaponForwardOffset + 0.28)
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

    const flashIncoming = animation.mode !== 'defeated' && animation.hitReactionToken !== null
    const outgoingConfirm = resolvePlayerOutgoingHitConfirm({
      lastHit: snapshot.contact.lastHit,
      enemies: snapshot.enemies,
      simulationStep: snapshot.simulation.stepCount,
    })
    const hitConfirmFlash =
      !flashIncoming &&
      outgoingConfirm.kind !== 'none' &&
      outgoingConfirm.flashIntensity > 0
    for (const material of [torsoMaterial, cloakMaterial]) {
      if (flashIncoming) {
        material.emissive.set(MOURNEVEIL_PALETTE.damage)
        material.emissiveIntensity = 0.45
      } else if (hitConfirmFlash) {
        material.emissive.set(
          outgoingConfirm.kind === 'defeat' || outgoingConfirm.kind === 'interrupt'
            ? '#ffb070'
            : '#f0d080',
        )
        material.emissiveIntensity = 0.2 + 0.55 * outgoingConfirm.flashIntensity
      } else {
        material.emissive.set('#000000')
        material.emissiveIntensity = 0
      }
    }
    if (hitConfirmFlash) {
      weaponMaterial.emissive.set(
        outgoingConfirm.kind === 'defeat'
          ? '#ff6b4a'
          : outgoingConfirm.kind === 'interrupt'
            ? '#ff9a4a'
            : '#ffe6a0',
      )
      weaponMaterial.emissiveIntensity = 0.35 + 0.65 * outgoingConfirm.flashIntensity
    } else {
      weaponMaterial.emissive.set('#000000')
      weaponMaterial.emissiveIntensity = 0
    }

    const activeShape = snapshot.attack.activeContactShape
    contactShape.visible =
      shouldShowCombatContactDebug(globalThis.location?.search ?? '', import.meta.env.DEV) &&
      activeShape !== null
    if (activeShape !== null) {
      const cue = combatContactCueLayout(
        activeShape.forwardOffset,
        activeShape.radius,
      )
      contactShape.position.set(0, cue.localY, -cue.forwardOffset)
      contactShape.scale.setScalar(cue.radius)
    }
  })

  return (
    <group ref={facingGroupRef} userData={{ productionAssetId: 'actor.player.veilbound-warden' }}>
      <group ref={bodyGroupRef}>
        <mesh visible={false}>
          <capsuleGeometry
            args={[PLAYER_CAPSULE_RADIUS, PLAYER_CAPSULE_HALF_HEIGHT * 2, 4, 8]}
          />
        </mesh>
        {/* Veilbound Warden: authored tapered armor forms, not collider geometry. */}
        <mesh ref={leftLegRef} castShadow position={[-0.11, -0.42, 0.02]}>
          <primitive attach="geometry" object={WARDEN_GREAVE} />
          <meshStandardMaterial color="#323a38" roughness={0.7} metalness={0.38} />
        </mesh>
        <mesh ref={rightLegRef} castShadow position={[0.11, -0.42, 0.02]}>
          <primitive attach="geometry" object={WARDEN_GREAVE} />
          <meshStandardMaterial color="#323a38" roughness={0.7} metalness={0.38} />
        </mesh>
        <mesh ref={torsoRef} castShadow position={[0, 0.02, 0]}>
          <primitive attach="geometry" object={WARDEN_TORSO} />
          <meshStandardMaterial
            ref={torsoMaterialRef}
            color="#46534f"
            roughness={0.62}
            metalness={0.42}
          />
        </mesh>
        <mesh castShadow position={[0, -0.03, -0.17]} rotation={[0.06, 0, 0]}>
          <primitive attach="geometry" object={WARDEN_TABARD} />
          <meshStandardMaterial color="#315558" roughness={0.86} metalness={0.04} />
        </mesh>
        <mesh castShadow position={[-0.31, 0.29, 0]} scale={[1.25, 0.65, 1]}>
          <dodecahedronGeometry args={[0.19, 0]} />
          <meshStandardMaterial color="#46524d" roughness={0.52} metalness={0.5} />
        </mesh>
        <mesh castShadow position={[0.3, 0.29, 0]} rotation={[0, 0, -0.28]}>
          <coneGeometry args={[0.18, 0.28, 5]} />
          <meshStandardMaterial color="#6a5540" roughness={0.58} metalness={0.44} />
        </mesh>
        <mesh ref={leftArmRef} castShadow position={[-0.34, 0.02, 0]} rotation={[0.15, 0, 0.2]}>
          <primitive attach="geometry" object={WARDEN_ARM} />
          <meshStandardMaterial color="#39423f" roughness={0.7} metalness={0.28} />
        </mesh>
        <mesh ref={rightArmRef} castShadow position={[0.34, 0.02, 0]} rotation={[0.15, 0, -0.2]}>
          <primitive attach="geometry" object={WARDEN_ARM} />
          <meshStandardMaterial color="#39423f" roughness={0.7} metalness={0.28} />
        </mesh>
        <mesh castShadow position={[0, 0.51, 0.01]}>
          <cylinderGeometry args={[0.145, 0.19, 0.26, 7]} />
          <meshStandardMaterial color="#171d1d" roughness={0.9} metalness={0.08} />
        </mesh>
        <mesh castShadow position={[0, 0.51, -0.145]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.125, 7]} />
          <meshStandardMaterial
            ref={cloakMaterialRef}
            color="#a9a694"
            roughness={0.54}
            metalness={0.35}
          />
        </mesh>
        <mesh castShadow position={[0, 0.02, 0.19]} rotation={[Math.PI / 2 - 0.12, 0, Math.PI]}>
          <primitive attach="geometry" object={WARDEN_CLOAK} />
          <meshStandardMaterial color="#2b4146" roughness={0.95} side={2} />
        </mesh>
        <mesh castShadow position={[0, 0.16, -0.23]} rotation={[Math.PI / 4, 0, 0]}>
          <octahedronGeometry args={[0.085, 0]} />
          <meshStandardMaterial color="#bcecf0" emissive="#277d86" emissiveIntensity={0.75} roughness={0.3} />
        </mesh>
      </group>
      <group ref={weaponSweepRef}>
        <group ref={weaponRef} position={[PLAYER_WEAPON_X, 0.06, -0.34]}>
          <OathbladeVisual materialRef={weaponMaterialRef} />
        </group>
      </group>
      <CombatContactVolumeCue
        groupRef={contactShapeRef}
        color="#f4d06f"
        opacity={0.32}
      />
      <mesh ref={guardMarkerRef} position={[0, 0.22, -0.36]} visible={false}>
        <torusGeometry args={[0.3, 0.025, 6, 28, Math.PI * 1.25]} />
        <meshStandardMaterial ref={guardMaterialRef} color="#8fc4da" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
