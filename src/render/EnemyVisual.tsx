import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { meleeRoleByDefinitionId } from '../game/enemies/enemyRoles'
import {
  createEnemyAttackPresentationSnapshot,
  localNegativeZFacingYaw,
} from './enemyAttackPresentation'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { projectEnemyAnimation } from './animation/enemyAnimationProjection'
import { resolveEnemyProceduralPose } from './animation/enemyProceduralPose'
import { SkirmisherProductionVisual } from './SkirmisherProductionVisual'
import {
  requestedEnemyProofAsset,
  resolveEnemyPresentationBackend,
} from './enemyPresentationBackend'
import { combatContactCueLayout, shouldShowCombatContactDebug } from './combatContactCueLayout'
import { CombatContactVolumeCue } from './CombatContactVolumeCue'
import {
  createProfilePrismGeometry,
  createTaperedPrismGeometry,
} from './productionGeometry'

const SKIRMISHER_TORSO = createTaperedPrismGeometry({ bottomWidth: 0.24, topWidth: 0.36, height: 0.7, depth: 0.25 })
const SKIRMISHER_LIMB = createTaperedPrismGeometry({ bottomWidth: 0.06, topWidth: 0.1, height: 0.45, depth: 0.09 })
const SKIRMISHER_BLADE = createProfilePrismGeometry(
  [[-0.035, 0.02], [-0.055, -0.34], [0, -0.68], [0.055, -0.34], [0.035, 0.02]],
  0.028,
)
const BRUTE_TORSO = createTaperedPrismGeometry({ bottomWidth: 0.78, topWidth: 0.62, height: 0.9, depth: 0.52 })

const STATE_MIX = {
  idle: 0,
  pursue: 0.12,
  spacing: 0.2,
  attack: 0.4,
  recovery: 0.28,
  hitReaction: 0.55,
  defeated: 0.7,
} as const

export function EnemyVisual({
  runtime,
  enemyId,
}: {
  readonly runtime: GameRuntime
  readonly enemyId: string
}) {
  const enemy =
    runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ?? null
  const role = enemy === null ? null : meleeRoleByDefinitionId(enemy.definitionId)
  if (role === null) return null
  const proofAssetId = import.meta.env.DEV
    ? requestedEnemyProofAsset(globalThis.location?.search ?? '')
    : null
  if (resolveEnemyPresentationBackend(role.role, proofAssetId) === 'skirmisher-proof-glb') {
    return <SkirmisherProductionVisual runtime={runtime} enemyId={enemyId} />
  }
  return <ProceduralEnemyVisual runtime={runtime} enemyId={enemyId} />
}

function ProceduralEnemyVisual({
  runtime,
  enemyId,
}: {
  readonly runtime: GameRuntime
  readonly enemyId: string
}) {
  const facingRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const telegraphRef = useRef<Mesh>(null)
  const telegraphMaterialRef = useRef<MeshBasicMaterial>(null)
  const recoveryRef = useRef<Mesh>(null)
  const recoveryMaterialRef = useRef<MeshBasicMaterial>(null)
  const contactRef = useRef<Group>(null)
  const weaponRef = useRef<Mesh>(null)

  useFrame((_state, deltaSeconds) => {
    const runtimeSnapshot = runtime.snapshot()
    const enemyIndex = runtimeSnapshot.enemies.findIndex((entry) => entry.id === enemyId)
    if (enemyIndex < 0) return
    const enemy = runtimeSnapshot.enemies[enemyIndex]
    const role = meleeRoleByDefinitionId(enemy.definitionId)
    if (role === null) return
    const enemyAttack = runtimeSnapshot.enemyAttacks[enemyIndex]
    const attackPresentation = createEnemyAttackPresentationSnapshot(enemy, enemyAttack)
    const animation = projectEnemyAnimation(
      enemy,
      runtimeSnapshot.simulation.stepCount,
      runtimeSnapshot.contact,
    )
    const proceduralPose = resolveEnemyProceduralPose(
      animation,
      role.presentation.animation,
      runtimeSnapshot.simulation.stepCount,
    )
    const facing = facingRef.current
    const body = bodyRef.current
    const material = materialRef.current
    const telegraph = telegraphRef.current
    const telegraphMaterial = telegraphMaterialRef.current
    const recovery = recoveryRef.current
    const recoveryMaterial = recoveryMaterialRef.current
    const contact = contactRef.current
    const weapon = weaponRef.current
    if (
      facing === null ||
      body === null ||
      material === null ||
      telegraph === null ||
      telegraphMaterial === null ||
      recovery === null ||
      recoveryMaterial === null ||
      contact === null ||
      weapon === null
    ) {
      return
    }

    facing.rotation.y = localNegativeZFacingYaw(animation.facing)
    const damping = Math.max(1, 1 / Math.max(animation.transition.blendSeconds, 0.001))
    const isBrute = role.role === 'brute'
    body.scale.x = MathUtils.damp(body.scale.x, isBrute ? 1.15 : 0.88, damping, deltaSeconds)
    body.scale.y = MathUtils.damp(
      body.scale.y,
      (isBrute ? 1.05 : 0.98) * proceduralPose.bodyScaleY,
      damping,
      deltaSeconds,
    )
    body.scale.z = MathUtils.damp(body.scale.z, isBrute ? 1.12 : 0.9, damping, deltaSeconds)
    body.rotation.x = MathUtils.damp(body.rotation.x, proceduralPose.bodyPitch, damping, deltaSeconds)
    body.rotation.z = MathUtils.damp(body.rotation.z, proceduralPose.bodyRoll, damping, deltaSeconds)
    body.position.y = MathUtils.damp(body.position.y, proceduralPose.bodyOffsetY, damping, deltaSeconds)
    weapon.rotation.x = MathUtils.damp(
      weapon.rotation.x,
      (isBrute ? 0 : 0.55) + proceduralPose.weaponPitch,
      damping,
      deltaSeconds,
    )
    weapon.rotation.y = MathUtils.damp(
      weapon.rotation.y,
      (isBrute ? 0 : 0.1) + proceduralPose.weaponYaw,
      damping,
      deltaSeconds,
    )
    material.color.set(isBrute ? MOURNEVEIL_PALETTE.brute.body : MOURNEVEIL_PALETTE.skirmisher.body)
    material.color.offsetHSL(0, -0.05, -STATE_MIX[enemy.state] * 0.28)
    const damagedFlash = animation.mode !== 'defeated' && animation.hitReactionToken !== null
    if (damagedFlash) {
      material.emissive.set(MOURNEVEIL_PALETTE.damage)
      material.emissiveIntensity = 0.55
    } else if (attackPresentation.phase === 'startup') {
      material.emissive.set(
        isBrute ? MOURNEVEIL_PALETTE.brute.telegraph : MOURNEVEIL_PALETTE.skirmisher.telegraph,
      )
      material.emissiveIntensity = 0.2 + 0.55 * attackPresentation.phaseAccent
    } else if (attackPresentation.phase === 'active') {
      material.emissive.set(
        isBrute ? MOURNEVEIL_PALETTE.brute.contact : MOURNEVEIL_PALETTE.skirmisher.contact,
      )
      material.emissiveIntensity = 0.35
    } else if (attackPresentation.phase === 'recovery') {
      material.emissive.set('#8aa0b0')
      material.emissiveIntensity = 0.12 + 0.28 * attackPresentation.phaseAccent
    } else {
      material.emissive.set('#000000')
      material.emissiveIntensity = 0
    }
    telegraph.visible = attackPresentation.telegraphVisible
    telegraphMaterial.opacity = 0.35 + 0.55 * attackPresentation.phaseAccent
    recovery.visible = attackPresentation.recoveryVisible
    recoveryMaterial.opacity = 0.22 + 0.4 * attackPresentation.phaseAccent
    contact.visible =
      shouldShowCombatContactDebug(globalThis.location?.search ?? '', import.meta.env.DEV) &&
      attackPresentation.contactVisible
    if (attackPresentation.contactVisible) {
      const cue = combatContactCueLayout(role.contact.forwardOffset, role.contact.radius)
      contact.position.set(0, cue.localY, -cue.forwardOffset)
      contact.scale.setScalar(cue.radius)
    }
  })

  const enemy =
    runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ?? null
  const role = enemy === null ? null : meleeRoleByDefinitionId(enemy.definitionId)
  if (role === null) return null
  const isBrute = role.role === 'brute'

  return (
    <group
      ref={facingRef}
      userData={{
        productionAssetId: isBrute ? 'enemy.brute.ossuary-bulwark' : 'enemy.skirmisher.veil-riven',
      }}
    >
      <group ref={bodyRef}>
        {isBrute ? (
          <>
            <mesh castShadow receiveShadow position={[0, -0.05, 0]}>
              <primitive attach="geometry" object={BRUTE_TORSO} />
              <meshStandardMaterial ref={materialRef} roughness={0.82} metalness={0.12} />
            </mesh>
            <mesh castShadow position={[0, 0.04, -0.29]} rotation={[0.08, 0, 0]}>
              <boxGeometry args={[0.48, 0.5, 0.08]} />
              <meshStandardMaterial color="#3a2c29" roughness={0.48} metalness={0.54} />
            </mesh>
            <mesh position={[0, 0.07, -0.34]} rotation={[Math.PI / 4, 0, 0]}>
              <octahedronGeometry args={[0.09, 0]} />
              <meshStandardMaterial color="#d28b55" emissive="#7c301e" emissiveIntensity={0.44} roughness={0.3} metalness={0.34} />
            </mesh>
            <mesh castShadow position={[0, 0.43, 0.04]} scale={[1.5, 0.7, 1]}>
              <dodecahedronGeometry args={[0.38, 0]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.pauldron} roughness={0.68} metalness={0.28} />
            </mesh>
            <mesh castShadow position={[-0.5, 0.27, 0]} rotation={[0, 0, -0.16]}>
              <cylinderGeometry args={[0.17, 0.22, 0.48, 7]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.accent} roughness={0.82} metalness={0.16} />
            </mesh>
            <mesh castShadow position={[0.5, 0.27, 0]} rotation={[0, 0, 0.16]}>
              <cylinderGeometry args={[0.17, 0.22, 0.48, 7]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.accent} roughness={0.82} metalness={0.16} />
            </mesh>
            <mesh castShadow position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.17, 0.24, 0.32, 6]} />
              <meshStandardMaterial color="#211b1b" roughness={0.72} metalness={0.26} />
            </mesh>
            <mesh castShadow position={[-0.14, 0.88, 0.01]} rotation={[0.05, 0, -0.48]}>
              <coneGeometry args={[0.075, 0.25, 5]} />
              <meshStandardMaterial color="#6e5540" roughness={0.48} metalness={0.46} />
            </mesh>
            <mesh castShadow position={[0.14, 0.88, 0.01]} rotation={[0.05, 0, 0.48]}>
              <coneGeometry args={[0.075, 0.25, 5]} />
              <meshStandardMaterial color="#6e5540" roughness={0.48} metalness={0.46} />
            </mesh>
            <mesh ref={weaponRef} castShadow position={[0.42, 0.05, -0.55]}>
              <cylinderGeometry args={[0.15, 0.11, 0.9, 7]} />
              <meshStandardMaterial
                color={MOURNEVEIL_PALETTE.brute.weapon}
                roughness={0.55}
                metalness={0.35}
              />
            </mesh>
          </>
        ) : (
          <>
            <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0.08, 0, 0]}>
              <primitive attach="geometry" object={SKIRMISHER_TORSO} />
              <meshStandardMaterial ref={materialRef} roughness={0.72} metalness={0.18} />
            </mesh>
            <mesh castShadow position={[0, 0.08, 0.18]} rotation={[0.36, 0, Math.PI]} scale={[0.6, 1, 1]}>
              <coneGeometry args={[0.32, 0.62, 5, 1, true]} />
              <meshStandardMaterial color="#172723" roughness={0.94} side={2} />
            </mesh>
            <mesh castShadow position={[-0.22, 0.27, -0.02]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.11, 0.25, 5]} />
              <meshStandardMaterial color="#4a6155" roughness={0.56} metalness={0.42} />
            </mesh>
            <mesh castShadow position={[0, 0.47, 0.01]} rotation={[0.08, 0, 0]}>
              <coneGeometry args={[0.18, 0.34, 6]} />
              <meshStandardMaterial color="#17251f" roughness={0.72} metalness={0.2} />
            </mesh>
            <mesh castShadow position={[0, 0.47, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.11, 5]} />
              <meshStandardMaterial color="#a8b59c" emissive="#355f50" emissiveIntensity={0.4} roughness={0.48} metalness={0.22} />
            </mesh>
            <mesh position={[0, 0.475, -0.255]}>
              <boxGeometry args={[0.08, 0.018, 0.014]} />
              <meshStandardMaterial color="#79e0b0" emissive="#267c58" emissiveIntensity={0.9} roughness={0.18} />
            </mesh>
            <mesh castShadow position={[-0.21, 0.16, 0]} rotation={[0.2, 0, 0.52]}>
              <primitive attach="geometry" object={SKIRMISHER_LIMB} />
              <meshStandardMaterial color="#30473c" roughness={0.84} />
            </mesh>
            <mesh castShadow position={[0.21, 0.16, 0]} rotation={[0.2, 0, -0.52]}>
              <primitive attach="geometry" object={SKIRMISHER_LIMB} />
              <meshStandardMaterial color="#30473c" roughness={0.84} />
            </mesh>
            <mesh castShadow position={[-0.16, -0.39, 0.02]} rotation={[0, 0, 0.08]}>
              <primitive attach="geometry" object={SKIRMISHER_LIMB} />
              <meshStandardMaterial color="#1f312a" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0.16, -0.39, 0.02]} rotation={[0, 0, -0.08]}>
              <primitive attach="geometry" object={SKIRMISHER_LIMB} />
              <meshStandardMaterial color="#1f312a" roughness={0.9} />
            </mesh>
            <mesh ref={weaponRef} castShadow position={[0.2, 0.05, -0.42]} rotation={[0.55, 0.1, 0]}>
              <primitive attach="geometry" object={SKIRMISHER_BLADE} />
              <meshStandardMaterial
                color={MOURNEVEIL_PALETTE.skirmisher.blade}
                roughness={0.28}
                metalness={0.58}
              />
            </mesh>
            <mesh castShadow position={[0.2, 0.045, -0.32]} rotation={[0.55, 0.1, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.04, 0.18, 6]} />
              <meshStandardMaterial color="#73563a" roughness={0.38} metalness={0.62} />
            </mesh>
          </>
        )}
      </group>
      <mesh
        ref={telegraphRef}
        position={[0, -0.78, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry
          args={[
            isBrute ? 0.55 : 0.35,
            isBrute ? 1.2 : 0.82,
            28,
            1,
            Math.PI * 0.12,
            isBrute ? Math.PI * 0.76 : Math.PI * 0.58,
          ]}
        />
        <meshBasicMaterial
          ref={telegraphMaterialRef}
          color={isBrute ? MOURNEVEIL_PALETTE.brute.telegraph : MOURNEVEIL_PALETTE.skirmisher.telegraph}
          transparent
          opacity={0.72}
          side={2}
        />
      </mesh>
      <mesh
        ref={recoveryRef}
        position={[0, -0.76, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry
          args={[
            isBrute ? 0.4 : 0.28,
            isBrute ? 0.95 : 0.68,
            24,
            1,
            0,
            Math.PI * 2,
          ]}
        />
        <meshBasicMaterial
          ref={recoveryMaterialRef}
          color="#8aa0b0"
          transparent
          opacity={0.4}
          side={2}
        />
      </mesh>
      <CombatContactVolumeCue
        groupRef={contactRef}
        color={isBrute ? MOURNEVEIL_PALETTE.brute.contact : MOURNEVEIL_PALETTE.skirmisher.contact}
        opacity={0.3}
      />
    </group>
  )
}
