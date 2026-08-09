import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import { meleeRoleByRuntimeId } from '../game/enemies/enemyRoles'
import { createEnemyAttackPresentationSnapshot } from './enemyAttackPresentation'

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
  readonly runtime: PlayerRuntime
  readonly enemyId: string
}) {
  const facingRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const telegraphRef = useRef<Mesh>(null)
  const contactRef = useRef<Mesh>(null)
  const role = meleeRoleByRuntimeId(enemyId)

  useFrame(() => {
    const runtimeSnapshot = runtime.snapshot()
    const enemyIndex = runtimeSnapshot.enemies.findIndex((entry) => entry.id === enemyId)
    if (enemyIndex < 0 || role === null) return
    const enemy = runtimeSnapshot.enemies[enemyIndex]
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
    ) return

    facing.rotation.y = attackPresentation.yawRadians
    body.scale.setScalar(role.presentation.bodyScale)
    body.scale.y = (enemy.alive ? 1 : 0.28) * role.presentation.bodyScale
    material.color.set(role.presentation.primaryColor)
    material.color.offsetHSL(0, 0, -STATE_MIX[enemy.state] * 0.35)
    telegraph.visible = attackPresentation.telegraphVisible
    // Debug contact sphere is presentation-only and only during the active window.
    contact.visible = attackPresentation.contactVisible
  })

  if (role === null) return null

  return (
    <group ref={facingRef}>
      <group ref={bodyRef}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry
            args={[
              role.definition.body.radius,
              role.definition.body.halfHeight * 2,
              8,
              16,
            ]}
          />
          <meshStandardMaterial ref={materialRef} roughness={0.68} />
        </mesh>
        <mesh castShadow position={[0, 0.25, -0.42]}>
          <coneGeometry args={[0.18, 0.42, 6]} />
          <meshStandardMaterial color="#cad0dc" roughness={0.45} metalness={0.2} />
        </mesh>
      </group>
      <mesh
        ref={telegraphRef}
        position={[0, -0.79, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry
          args={[0.7 + role.definition.body.radius, 20, Math.PI / 4, Math.PI / 2]}
        />
        <meshBasicMaterial
          color={role.presentation.telegraphColor}
          transparent
          opacity={0.8}
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
          color={role.presentation.contactColor}
          transparent
          opacity={0.25}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
