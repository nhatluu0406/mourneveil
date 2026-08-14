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
import {
  tickPlayerLocomotionPresentation,
} from './animation/playerLocomotionPresentation'
import { playerVisualPosition, usesInterpolatedPresentation } from './presentationSampling'
import { resolvePlayerOutgoingHitConfirm } from './playerCombatFeedback'
import { combatContactCueLayout, shouldShowCombatContactDebug } from './combatContactCueLayout'
import { CombatContactVolumeCue } from './CombatContactVolumeCue'
import { createProfilePrismGeometry, createTaperedPrismGeometry } from './productionGeometry'
import { PlayerWeaponVisual } from './actors/PlayerWeaponVisual'
import { PlayerSkillVfx } from './PlayerSkillVfx'
import { ActorGroundingCue } from './actors/ActorGroundingCue'

const PLAYER_WEAPON_X = 0.29
const WARDEN_TORSO = createTaperedPrismGeometry({ bottomWidth: 0.38, topWidth: 0.52, height: 0.58, depth: 0.3 })
const WARDEN_TABARD = createTaperedPrismGeometry({ bottomWidth: 0.28, topWidth: 0.34, height: 0.52, depth: 0.12 })
const WARDEN_THIGH = createTaperedPrismGeometry({ bottomWidth: 0.14, topWidth: 0.19, height: 0.25, depth: 0.18 })
const WARDEN_SHIN = createTaperedPrismGeometry({ bottomWidth: 0.1, topWidth: 0.145, height: 0.28, depth: 0.15 })
const WARDEN_FOOT = createTaperedPrismGeometry({ bottomWidth: 0.14, topWidth: 0.12, height: 0.12, depth: 0.28 })
const WARDEN_UPPER_ARM = createTaperedPrismGeometry({ bottomWidth: 0.09, topWidth: 0.145, height: 0.25, depth: 0.13 })
const WARDEN_FOREARM = createTaperedPrismGeometry({ bottomWidth: 0.075, topWidth: 0.105, height: 0.23, depth: 0.12 })
const WARDEN_BREASTPLATE = createProfilePrismGeometry(
  [[-0.22, -0.2], [-0.28, 0.12], [-0.15, 0.3], [0, 0.36], [0.15, 0.3], [0.28, 0.12], [0.22, -0.2], [0, -0.3]],
  0.055,
)
const WARDEN_HOOD_CROWN = createTaperedPrismGeometry({ bottomWidth: 0.31, topWidth: 0.18, height: 0.3, depth: 0.28 })
const WARDEN_CLOAK = createProfilePrismGeometry(
  [[-0.25, 0.28], [-0.34, -0.34], [0, -0.46], [0.34, -0.34], [0.25, 0.28]],
  0.055,
)
export function PlayerVisual({ runtime }: { runtime: GameRuntime }) {
  const facingGroupRef = useRef<Group>(null)
  const bodyGroupRef = useRef<Group>(null)
  const weaponSweepRef = useRef<Group>(null)
  const weaponRef = useRef<Group>(null)
  const oathbladeRef = useRef<Group>(null)
  const gravebrandRef = useRef<Group>(null)
  const veilThornRef = useRef<Group>(null)
  const oathbladeMaterialRef = useRef<MeshStandardMaterial>(null)
  const gravebrandMaterialRef = useRef<MeshStandardMaterial>(null)
  const veilThornMaterialRef = useRef<MeshStandardMaterial>(null)
  const contactShapeRef = useRef<Group>(null)
  const guardMarkerRef = useRef<Mesh>(null)
  const guardMaterialRef = useRef<MeshStandardMaterial>(null)
  const torsoMaterialRef = useRef<MeshStandardMaterial>(null)
  const cloakMaterialRef = useRef<MeshStandardMaterial>(null)
  const pelvisRef = useRef<Group>(null)
  const torsoRef = useRef<Group>(null)
  const leftLegRef = useRef<Group>(null)
  const rightLegRef = useRef<Group>(null)
  const leftShinRef = useRef<Group>(null)
  const rightShinRef = useRef<Group>(null)
  const leftFootRef = useRef<Group>(null)
  const rightFootRef = useRef<Group>(null)
  const leftArmRef = useRef<Group>(null)
  const rightArmRef = useRef<Group>(null)
  const leftForearmRef = useRef<Group>(null)
  const rightForearmRef = useRef<Group>(null)

  useFrame((_state, deltaSeconds) => {
    const snapshot = runtime.snapshot()
    const animation = projectPlayerAnimation(snapshot)
    const facingGroup = facingGroupRef.current
    const bodyGroup = bodyGroupRef.current
    const weaponSweep = weaponSweepRef.current
    const weapon = weaponRef.current
    const weaponGroups = [oathbladeRef.current, gravebrandRef.current, veilThornRef.current]
    const weaponMaterials = [oathbladeMaterialRef.current, gravebrandMaterialRef.current, veilThornMaterialRef.current]
    const contactShape = contactShapeRef.current
    const guardMarker = guardMarkerRef.current
    const guardMaterial = guardMaterialRef.current
    const torsoMaterial = torsoMaterialRef.current
    const cloakMaterial = cloakMaterialRef.current
    const torso = torsoRef.current
    const pelvis = pelvisRef.current
    const leftLeg = leftLegRef.current
    const rightLeg = rightLegRef.current
    const leftShin = leftShinRef.current
    const rightShin = rightShinRef.current
    const leftFoot = leftFootRef.current
    const rightFoot = rightFootRef.current
    const leftArm = leftArmRef.current
    const rightArm = rightArmRef.current
    const leftForearm = leftForearmRef.current
    const rightForearm = rightForearmRef.current
    if (
      facingGroup === null ||
      bodyGroup === null ||
      weaponSweep === null ||
      weapon === null ||
      weaponGroups.some((entry) => entry === null) ||
      weaponMaterials.some((entry) => entry === null) ||
      contactShape === null ||
      guardMarker === null ||
      guardMaterial === null ||
      torsoMaterial === null ||
      cloakMaterial === null ||
      pelvis === null ||
      torso === null ||
      leftLeg === null ||
      rightLeg === null ||
      leftShin === null ||
      rightShin === null ||
      leftFoot === null ||
      rightFoot === null ||
      leftArm === null ||
      rightArm === null ||
      leftForearm === null ||
      rightForearm === null
    ) {
      return
    }
    const equippedWeapon = snapshot.equipment.weaponItemId
    const weaponIndex = equippedWeapon === 'item.weapon.gravebrand' ? 1 : equippedWeapon === 'item.weapon.veil-thorn' ? 2 : 0
    weaponGroups.forEach((entry, index) => { entry!.visible = index === weaponIndex })
    const weaponMaterial = weaponMaterials[weaponIndex]!
    guardMarker.visible = animation.mode === 'guard' || snapshot.defense.guardBroken
    guardMaterial.color.set(snapshot.defense.guardBroken ? '#ff765e' : '#8fc4da')
    guardMaterial.emissive.set(snapshot.defense.guardBroken ? '#9f241e' : '#17343d')
    guardMaterial.emissiveIntensity = snapshot.defense.guardBroken ? 0.75 : 0.18

    const facing = resolveAttackPresentationFacing(snapshot.attack, {
      facing: animation.facing,
    })
    const committedTurn =
      animation.mode === 'light-attack' ||
      animation.mode === 'heavy-attack' ||
      animation.mode === 'dodge'
    const presented = playerVisualPosition(runtime, usesInterpolatedPresentation())
    const locomotion = tickPlayerLocomotionPresentation({
      positionX: presented.x,
      positionZ: presented.z,
      facingX: facing.x,
      facingZ: facing.z,
      deltaSeconds: deltaSeconds,
      grounded: snapshot.player.grounded,
      committedAttack: committedTurn,
      currentYawRadians: facingGroup.rotation.y,
    })
    facingGroup.rotation.y = committedTurn
      ? localNegativeZFacingYaw(facing)
      : locomotion.yawRadians
    const proceduralPose = resolvePlayerProceduralPose(
      animation,
      snapshot.simulation.stepCount,
      locomotion,
    )
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
    pelvis.rotation.y = MathUtils.damp(pelvis.rotation.y, proceduralPose.pelvisYaw, damping, deltaSeconds)
    leftLeg.rotation.x = MathUtils.damp(leftLeg.rotation.x, proceduralPose.leftLimbSwing, damping, deltaSeconds)
    rightLeg.rotation.x = MathUtils.damp(rightLeg.rotation.x, proceduralPose.rightLimbSwing, damping, deltaSeconds)
    leftShin.rotation.x = MathUtils.damp(leftShin.rotation.x, proceduralPose.leftKneePitch, damping, deltaSeconds)
    rightShin.rotation.x = MathUtils.damp(rightShin.rotation.x, proceduralPose.rightKneePitch, damping, deltaSeconds)
    leftFoot.rotation.x = MathUtils.damp(leftFoot.rotation.x, proceduralPose.leftAnklePitch, damping, deltaSeconds)
    rightFoot.rotation.x = MathUtils.damp(rightFoot.rotation.x, proceduralPose.rightAnklePitch, damping, deltaSeconds)
    leftArm.rotation.x = MathUtils.damp(leftArm.rotation.x, 0.15 + proceduralPose.leftArmPitch, damping, deltaSeconds)
    rightArm.rotation.x = MathUtils.damp(rightArm.rotation.x, 0.15 + proceduralPose.rightArmPitch, damping, deltaSeconds)
    leftForearm.rotation.x = MathUtils.damp(leftForearm.rotation.x, -0.16 + Math.max(0, proceduralPose.leftKneePitch) * 0.22, damping, deltaSeconds)
    rightForearm.rotation.x = MathUtils.damp(rightForearm.rotation.x, -0.16 + Math.max(0, proceduralPose.rightKneePitch) * 0.22, damping, deltaSeconds)
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
      <ActorGroundingCue scale={0.86} />
      <group ref={bodyGroupRef}>
        <mesh visible={false}>
          <capsuleGeometry
            args={[PLAYER_CAPSULE_RADIUS, PLAYER_CAPSULE_HALF_HEIGHT * 2, 4, 8]}
          />
        </mesh>
        {/* Articulated in-place presentation rig. The simulation still owns root translation. */}
        <group ref={pelvisRef}>
          <group ref={leftLegRef} position={[-0.12, -0.18, 0.02]}>
            <mesh castShadow position={[0, -0.11, 0]} geometry={WARDEN_THIGH}>
              <meshStandardMaterial color="#343d3a" roughness={0.7} metalness={0.34} />
            </mesh>
            <group ref={leftShinRef} position={[0, -0.23, 0]}>
              <mesh castShadow position={[0, -0.135, 0]} geometry={WARDEN_SHIN}>
                <meshStandardMaterial color="#46504b" roughness={0.58} metalness={0.46} />
              </mesh>
              <group ref={leftFootRef} position={[0, -0.285, -0.025]}>
                <mesh castShadow position={[0, -0.035, -0.07]} rotation={[Math.PI / 2, 0, 0]} geometry={WARDEN_FOOT}>
                  <meshStandardMaterial color="#232b29" roughness={0.82} metalness={0.28} />
                </mesh>
              </group>
            </group>
          </group>
          <group ref={rightLegRef} position={[0.12, -0.18, 0.02]}>
            <mesh castShadow position={[0, -0.11, 0]} geometry={WARDEN_THIGH}>
              <meshStandardMaterial color="#343d3a" roughness={0.7} metalness={0.34} />
            </mesh>
            <group ref={rightShinRef} position={[0, -0.23, 0]}>
              <mesh castShadow position={[0, -0.135, 0]} geometry={WARDEN_SHIN}>
                <meshStandardMaterial color="#46504b" roughness={0.58} metalness={0.46} />
              </mesh>
              <group ref={rightFootRef} position={[0, -0.285, -0.025]}>
                <mesh castShadow position={[0, -0.035, -0.07]} rotation={[Math.PI / 2, 0, 0]} geometry={WARDEN_FOOT}>
                  <meshStandardMaterial color="#232b29" roughness={0.82} metalness={0.28} />
                </mesh>
              </group>
            </group>
          </group>
          <group ref={torsoRef} position={[0, 0.08, 0]}>
            <mesh castShadow geometry={WARDEN_TORSO}>
              <meshStandardMaterial ref={torsoMaterialRef} color="#394743" roughness={0.56} metalness={0.46} />
            </mesh>
            <mesh castShadow position={[0, 0.06, -0.177]} rotation={[Math.PI / 2, 0, 0]} geometry={WARDEN_BREASTPLATE}>
              <meshStandardMaterial color="#69766f" roughness={0.42} metalness={0.58} />
            </mesh>
            <mesh castShadow position={[0, -0.08, -0.17]} rotation={[0.06, 0, 0]} geometry={WARDEN_TABARD}>
              <meshStandardMaterial color="#315558" roughness={0.86} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[-0.31, 0.26, 0]} scale={[1.18, 0.62, 1]}>
              <dodecahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color="#56615a" roughness={0.5} metalness={0.52} />
            </mesh>
            <group ref={leftArmRef} position={[-0.34, 0.15, 0]} rotation={[0.15, 0, 0.16]}>
              <mesh castShadow position={[0, -0.12, 0]} geometry={WARDEN_UPPER_ARM}>
                <meshStandardMaterial color="#39423f" roughness={0.7} metalness={0.28} />
              </mesh>
              <group ref={leftForearmRef} position={[0, -0.245, 0]}>
                <mesh castShadow position={[0, -0.11, 0]} geometry={WARDEN_FOREARM}>
                  <meshStandardMaterial color="#5c665f" roughness={0.5} metalness={0.52} />
                </mesh>
              </group>
            </group>
            <group ref={rightArmRef} position={[0.34, 0.15, 0]} rotation={[0.15, 0, -0.16]}>
              <mesh castShadow position={[0, -0.12, 0]} geometry={WARDEN_UPPER_ARM}>
                <meshStandardMaterial color="#39423f" roughness={0.7} metalness={0.28} />
              </mesh>
              <group ref={rightForearmRef} position={[0, -0.245, 0]}>
                <mesh castShadow position={[0, -0.11, 0]} geometry={WARDEN_FOREARM}>
                  <meshStandardMaterial color="#5c665f" roughness={0.5} metalness={0.52} />
                </mesh>
              </group>
            </group>
            <mesh castShadow position={[0, 0.48, 0.01]}>
              <cylinderGeometry args={[0.14, 0.18, 0.24, 7]} />
              <meshStandardMaterial color="#12191a" roughness={0.86} metalness={0.12} />
            </mesh>
            <mesh castShadow position={[0, 0.63, 0.015]} geometry={WARDEN_HOOD_CROWN}>
              <meshStandardMaterial ref={cloakMaterialRef} color="#1b2b2e" roughness={0.9} metalness={0.05} />
            </mesh>
            <mesh position={[0, 0.49, -0.245]}>
              <boxGeometry args={[0.09, 0.024, 0.02]} />
              <meshStandardMaterial color="#8ee1e2" emissive="#27787d" emissiveIntensity={0.82} roughness={0.2} />
            </mesh>
            <mesh castShadow position={[0, 0, 0.19]} rotation={[Math.PI / 2 - 0.12, 0, Math.PI]} geometry={WARDEN_CLOAK}>
              <meshStandardMaterial color="#2b4146" roughness={0.95} side={2} />
            </mesh>
          </group>
        </group>
      </group>
      <group ref={weaponSweepRef}>
        <group ref={weaponRef} position={[PLAYER_WEAPON_X, 0.06, -0.34]}>
          <PlayerWeaponVisual
            oathbladeRef={oathbladeRef}
            gravebrandRef={gravebrandRef}
            veilThornRef={veilThornRef}
            oathbladeMaterialRef={oathbladeMaterialRef}
            gravebrandMaterialRef={gravebrandMaterialRef}
            veilThornMaterialRef={veilThornMaterialRef}
          />
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
      <PlayerSkillVfx runtime={runtime} />
    </group>
  )
}
