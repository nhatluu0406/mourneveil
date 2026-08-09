import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import {
  MELEE_ENEMY_CONTACT_SHAPE,
  MELEE_ENEMY_DEFINITION,
} from '../game/enemies/meleeEnemy'

const STATE_COLORS = {
  idle: '#596582',
  pursue: '#85664d',
  attack: '#d98b4b',
  recovery: '#735767',
  defeated: '#302f36',
} as const

export function EnemyVisual({ runtime }: { readonly runtime: PlayerRuntime }) {
  const facingRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const telegraphRef = useRef<Mesh>(null)
  const contactRef = useRef<Mesh>(null)

  useFrame(() => {
    const enemy = runtime.snapshot().enemy
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

    facing.rotation.y = Math.atan2(enemy.facing.x, -enemy.facing.z)
    body.scale.y = enemy.alive ? 1 : 0.28
    material.color.set(STATE_COLORS[enemy.state])
    telegraph.visible = enemy.action.phase === 'startup'
    contact.visible = runtime.snapshot().enemyAttack.contactEnabled
  })

  return (
    <group ref={facingRef}>
      <group ref={bodyRef}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry
            args={[
              MELEE_ENEMY_DEFINITION.body.radius,
              MELEE_ENEMY_DEFINITION.body.halfHeight * 2,
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
      <mesh ref={telegraphRef} position={[0, 0.03, -0.78]} visible={false}>
        <ringGeometry args={[0.34, 0.48, 20]} />
        <meshBasicMaterial color="#ff9d4d" transparent opacity={0.8} side={2} />
      </mesh>
      <mesh
        ref={contactRef}
        position={[0, 0, -MELEE_ENEMY_CONTACT_SHAPE.forwardOffset]}
        scale={MELEE_ENEMY_CONTACT_SHAPE.radius}
        visible={false}
      >
        <sphereGeometry args={[1, 16, 10]} />
        <meshBasicMaterial
          color="#ff574d"
          transparent
          opacity={0.25}
          wireframe
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
