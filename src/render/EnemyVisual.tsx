import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { meleeRoleByDefinitionId } from '../game/enemies/enemyRoles'
import { createEnemyAttackPresentationSnapshot } from './enemyAttackPresentation'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

const STATE_MIX = {
  idle: 0,
  pursue: 0.18,
  spacing: 0.28,
  attack: 0.55,
  recovery: 0.35,
  defeated: 0.75,
} as const

export function EnemyVisual({
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

  useFrame(() => {
    const runtimeSnapshot = runtime.snapshot()
    const enemyIndex = runtimeSnapshot.enemies.findIndex((entry) => entry.id === enemyId)
    if (enemyIndex < 0) return
    const enemy = runtimeSnapshot.enemies[enemyIndex]
    const role = meleeRoleByDefinitionId(enemy.definitionId)
    if (role === null) return
    const enemyAttack = runtimeSnapshot.enemyAttacks[enemyIndex]
    const attackPresentation = createEnemyAttackPresentationSnapshot(enemy, enemyAttack)
    const facing = facingRef.current
    const body = bodyRef.current
    const material = materialRef.current
    const telegraph = telegraphRef.current
    const contact = contactRef.current
    if (
      facing === null ||
      body === null ||
      material === null ||
      telegraph === null ||
      contact === null
    )
      return

    facing.rotation.y = attackPresentation.yawRadians
    const isBrute = role.role === 'brute'
    const width = isBrute ? 1.22 : 0.82
    const height = enemy.alive ? (isBrute ? 1.08 : 0.95) : 0.22
    body.scale.set(width, height, isBrute ? 1.15 : 0.88)
    body.rotation.z = enemy.alive ? 0 : Math.PI / 2
    body.position.y = enemy.alive ? 0 : -0.4
    const palette = isBrute ? MOURNEVEIL_PALETTE.brute : MOURNEVEIL_PALETTE.skirmisher
    material.color.set(palette.body)
    material.color.offsetHSL(0, 0, -STATE_MIX[enemy.state] * 0.35)
    const damagedFlash =
      enemy.alive &&
      runtimeSnapshot.contact.lastHit !== null &&
      runtimeSnapshot.contact.lastHit.targetId === enemy.id &&
      runtimeSnapshot.simulation.stepCount - runtimeSnapshot.contact.lastHit.simulationStep < 10
    material.emissive.set(damagedFlash ? MOURNEVEIL_PALETTE.damage : '#000000')
    material.emissiveIntensity = damagedFlash ? 0.65 : 0
    telegraph.visible = attackPresentation.telegraphVisible
    contact.visible = import.meta.env.DEV && attackPresentation.contactVisible
  })

  const enemy =
    runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ?? null
  const role = enemy === null ? null : meleeRoleByDefinitionId(enemy.definitionId)
  if (role === null) return null

  const isBrute = role.role === 'brute'

  return (
    <group ref={facingRef}>
      <group ref={bodyRef}>
        {isBrute ? (
          <>
            <mesh castShadow receiveShadow>
              <capsuleGeometry args={[0.42, 0.7, 6, 12]} />
              <meshStandardMaterial ref={materialRef} roughness={0.85} />
            </mesh>
            <mesh castShadow position={[0, 0.55, 0.05]}>
              <boxGeometry args={[0.95, 0.38, 0.55]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.pauldron} roughness={0.88} />
            </mesh>
            <mesh castShadow position={[-0.42, 0.35, 0]}>
              <boxGeometry args={[0.28, 0.45, 0.35]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.accent} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0.42, 0.35, 0]}>
              <boxGeometry args={[0.28, 0.45, 0.35]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.accent} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0.35, 0.15, -0.55]}>
              <boxGeometry args={[0.22, 0.7, 0.22]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.brute.weapon} roughness={0.7} />
            </mesh>
          </>
        ) : (
          <>
            <mesh castShadow receiveShadow>
              <capsuleGeometry args={[0.22, 0.55, 6, 12]} />
              <meshStandardMaterial ref={materialRef} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0, 0.48, 0]}>
              <sphereGeometry args={[0.16, 10, 8]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.skirmisher.accent} roughness={0.5} />
            </mesh>
            <mesh castShadow position={[-0.22, 0.2, 0]} rotation={[0, 0, 0.35]}>
              <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.skirmisher.body} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0.22, 0.2, 0]} rotation={[0, 0, -0.35]}>
              <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.skirmisher.body} roughness={0.55} />
            </mesh>
            <mesh castShadow position={[0.18, 0.08, -0.42]} rotation={[0.4, 0, 0]}>
              <coneGeometry args={[0.1, 0.55, 6]} />
              <meshStandardMaterial
                color={MOURNEVEIL_PALETTE.skirmisher.blade}
                roughness={0.35}
                metalness={0.3}
              />
            </mesh>
          </>
        )}
      </group>
      <mesh
        ref={telegraphRef}
        position={[0, -0.79, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry
          args={[
            (isBrute ? 0.95 : 0.62) + role.definition.body.radius * 0.2,
            20,
            Math.PI / 4,
            isBrute ? Math.PI * 0.7 : Math.PI / 2,
          ]}
        />
        <meshBasicMaterial
          color={isBrute ? MOURNEVEIL_PALETTE.brute.telegraph : MOURNEVEIL_PALETTE.skirmisher.telegraph}
          transparent
          opacity={0.82}
          side={2}
        />
      </mesh>
      <mesh
        ref={contactRef}
        position={[0, 0, -role.contact.forwardOffset]}
        scale={role.contact.radius}
        visible={false}
      >
        <sphereGeometry args={[1, 16, 10]} />
        <meshBasicMaterial
          color={isBrute ? MOURNEVEIL_PALETTE.brute.contact : MOURNEVEIL_PALETTE.skirmisher.contact}
          transparent
          opacity={0.25}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
