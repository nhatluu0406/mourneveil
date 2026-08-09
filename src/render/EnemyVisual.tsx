import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
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
  readonly runtime: GameRuntime
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

  const isBrute = role.role === 'brute'

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
          <meshStandardMaterial ref={materialRef} roughness={isBrute ? 0.82 : 0.58} />
        </mesh>
        {isBrute ? (
          <mesh castShadow position={[0, 0.55, 0]}>
            <boxGeometry args={[0.95, 0.35, 0.7]} />
            <meshStandardMaterial color="#6d3d30" roughness={0.85} />
          </mesh>
        ) : (
          <mesh castShadow position={[0, 0.15, -0.38]}>
            <coneGeometry args={[0.16, 0.5, 6]} />
            <meshStandardMaterial color="#b7c7b8" roughness={0.4} metalness={0.25} />
          </mesh>
        )}
        <mesh castShadow position={[0, 0.25, -0.42]} visible={isBrute}>
          <boxGeometry args={[0.22, 0.55, 0.22]} />
          <meshStandardMaterial color="#a35a45" roughness={0.7} />
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
