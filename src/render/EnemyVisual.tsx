import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
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

const STATE_MIX = {
  idle: 0,
  pursue: 0.12,
  spacing: 0.2,
  attack: 0.4,
  recovery: 0.28,
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
  if (role.role === 'skirmisher') {
    return <SkirmisherProductionVisual runtime={runtime} enemyId={enemyId} />
  }
  return <BruteProceduralVisual runtime={runtime} enemyId={enemyId} />
}

function BruteProceduralVisual({
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
  const contactRef = useRef<Mesh>(null)
  const weaponRef = useRef<Mesh>(null)

  useFrame((_state, deltaSeconds) => {
    const runtimeSnapshot = runtime.snapshot()
    const enemyIndex = runtimeSnapshot.enemies.findIndex((entry) => entry.id === enemyId)
    if (enemyIndex < 0) return
    const enemy = runtimeSnapshot.enemies[enemyIndex]
    const role = meleeRoleByDefinitionId(enemy.definitionId)
    if (role === null || role.role !== 'brute') return
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
    const contact = contactRef.current
    const weapon = weaponRef.current
    if (
      facing === null ||
      body === null ||
      material === null ||
      telegraph === null ||
      contact === null ||
      weapon === null
    ) {
      return
    }

    facing.rotation.y = localNegativeZFacingYaw(animation.facing)
    const damping = Math.max(1, 1 / Math.max(animation.transition.blendSeconds, 0.001))
    body.scale.x = MathUtils.damp(body.scale.x, 1.15, damping, deltaSeconds)
    body.scale.y = MathUtils.damp(
      body.scale.y,
      1.05 * proceduralPose.bodyScaleY,
      damping,
      deltaSeconds,
    )
    body.scale.z = MathUtils.damp(body.scale.z, 1.12, damping, deltaSeconds)
    body.rotation.x = MathUtils.damp(body.rotation.x, proceduralPose.bodyPitch, damping, deltaSeconds)
    body.rotation.z = MathUtils.damp(body.rotation.z, proceduralPose.bodyRoll, damping, deltaSeconds)
    body.position.y = MathUtils.damp(body.position.y, proceduralPose.bodyOffsetY, damping, deltaSeconds)
    weapon.rotation.x = MathUtils.damp(
      weapon.rotation.x,
      proceduralPose.weaponPitch,
      damping,
      deltaSeconds,
    )
    weapon.rotation.y = MathUtils.damp(
      weapon.rotation.y,
      proceduralPose.weaponYaw,
      damping,
      deltaSeconds,
    )
    material.color.set(MOURNEVEIL_PALETTE.brute.body)
    material.color.offsetHSL(0, -0.05, -STATE_MIX[enemy.state] * 0.28)
    const damagedFlash = animation.mode !== 'defeated' && animation.hitReactionToken !== null
    material.emissive.set(damagedFlash ? MOURNEVEIL_PALETTE.damage : '#000000')
    material.emissiveIntensity = damagedFlash ? 0.55 : 0
    telegraph.visible = attackPresentation.telegraphVisible
    contact.visible = import.meta.env.DEV && attackPresentation.contactVisible
  })

  const enemy =
    runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ?? null
  const role = enemy === null ? null : meleeRoleByDefinitionId(enemy.definitionId)
  if (role === null || role.role !== 'brute') return null

  return (
    <group ref={facingRef}>
      <group ref={bodyRef}>
        <mesh castShadow receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[0.7, 0.85, 0.48]} />
          <meshStandardMaterial ref={materialRef} roughness={0.92} metalness={0.05} />
        </mesh>
        <mesh castShadow position={[0, 0.48, 0.04]}>
          <boxGeometry args={[0.95, 0.32, 0.42]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.pauldron} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.48, 0.28, 0]}>
          <boxGeometry args={[0.28, 0.4, 0.32]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.accent} roughness={0.93} />
        </mesh>
        <mesh castShadow position={[0.48, 0.28, 0]}>
          <boxGeometry args={[0.28, 0.4, 0.32]} />
          <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.accent} roughness={0.93} />
        </mesh>
        <mesh castShadow position={[0, 0.72, 0]}>
          <boxGeometry args={[0.34, 0.28, 0.34]} />
          <meshStandardMaterial color="#5a3830" roughness={0.88} />
        </mesh>
        <mesh ref={weaponRef} castShadow position={[0.42, 0.05, -0.55]}>
          <boxGeometry args={[0.18, 0.85, 0.18]} />
          <meshStandardMaterial
            color={MOURNEVEIL_PALETTE.brute.weapon}
            roughness={0.55}
            metalness={0.35}
          />
        </mesh>
      </group>
      <mesh
        ref={telegraphRef}
        position={[0, -0.78, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.55, 1.15, 28, 1, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshBasicMaterial
          color={MOURNEVEIL_PALETTE.brute.telegraph}
          transparent
          opacity={0.72}
          side={2}
        />
      </mesh>
      <mesh
        ref={contactRef}
        position={[0, 0, -role.contact.forwardOffset]}
        scale={role.contact.radius}
        visible={false}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial
          color={MOURNEVEIL_PALETTE.brute.contact}
          transparent
          opacity={0.22}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
