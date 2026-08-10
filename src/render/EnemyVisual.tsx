import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { meleeRoleByDefinitionId } from '../game/enemies/enemyRoles'
import { createEnemyAttackPresentationSnapshot } from './enemyAttackPresentation'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

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
    body.scale.set(
      isBrute ? 1.15 : 0.88,
      enemy.alive ? (isBrute ? 1.05 : 0.98) : 0.2,
      isBrute ? 1.12 : 0.9,
    )
    body.rotation.z = enemy.alive ? 0 : Math.PI / 2
    body.position.y = enemy.alive ? 0 : -0.42
    material.color.set(isBrute ? MOURNEVEIL_PALETTE.brute.body : MOURNEVEIL_PALETTE.skirmisher.body)
    material.color.offsetHSL(0, -0.05, -STATE_MIX[enemy.state] * 0.28)
    const damagedFlash =
      enemy.alive &&
      runtimeSnapshot.contact.lastHit !== null &&
      runtimeSnapshot.contact.lastHit.targetId === enemy.id &&
      runtimeSnapshot.simulation.stepCount - runtimeSnapshot.contact.lastHit.simulationStep < 10
    material.emissive.set(damagedFlash ? MOURNEVEIL_PALETTE.damage : '#000000')
    material.emissiveIntensity = damagedFlash ? 0.55 : 0
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
            <mesh castShadow position={[0.42, 0.05, -0.55]}>
              <boxGeometry args={[0.18, 0.85, 0.18]} />
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
              <boxGeometry args={[0.28, 0.62, 0.22]} />
              <meshStandardMaterial ref={materialRef} roughness={0.78} metalness={0.04} />
            </mesh>
            <mesh castShadow position={[0, 0.42, 0.02]}>
              <boxGeometry args={[0.22, 0.2, 0.2]} />
              <meshStandardMaterial color={MOURNEVEIL_PALETTE.skirmisher.accent} roughness={0.7} />
            </mesh>
            <mesh castShadow position={[-0.2, 0.18, 0]} rotation={[0.2, 0, 0.45]}>
              <boxGeometry args={[0.08, 0.4, 0.08]} />
              <meshStandardMaterial color="#4a6a58" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0.2, 0.18, 0]} rotation={[0.2, 0, -0.45]}>
              <boxGeometry args={[0.08, 0.4, 0.08]} />
              <meshStandardMaterial color="#4a6a58" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0.2, 0.05, -0.42]} rotation={[0.55, 0.1, 0]}>
              <boxGeometry args={[0.05, 0.08, 0.62]} />
              <meshStandardMaterial
                color={MOURNEVEIL_PALETTE.skirmisher.blade}
                roughness={0.32}
                metalness={0.45}
              />
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
            isBrute ? 1.15 : 0.78,
            28,
            1,
            Math.PI * 0.15,
            isBrute ? Math.PI * 0.7 : Math.PI * 0.55,
          ]}
        />
        <meshBasicMaterial
          color={isBrute ? MOURNEVEIL_PALETTE.brute.telegraph : MOURNEVEIL_PALETTE.skirmisher.telegraph}
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
          color={isBrute ? MOURNEVEIL_PALETTE.brute.contact : MOURNEVEIL_PALETTE.skirmisher.contact}
          transparent
          opacity={0.22}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
