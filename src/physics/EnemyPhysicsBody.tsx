import { useFrame } from '@react-three/fiber'
import {
  BallCollider,
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import { MELEE_ENEMY_DEFINITION } from '../game/enemies/meleeEnemy'
import { EnemyVisual } from '../render/EnemyVisual'
import {
  CHARACTER_COLLISION_OFFSET,
  configureCharacterController,
} from './playerCollisionConfig'
import { useCombatHurtboxRegistration } from './combatHurtboxRegistry'

export function EnemyPhysicsBody({ runtime }: { readonly runtime: PlayerRuntime }) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const bodyColliderRef = useRef<RapierCollider>(null)
  const hurtboxColliderRef = useRef<RapierCollider>(null)
  const { world } = useRapier()
  const enemy = runtime.snapshot().enemy
  useCombatHurtboxRegistration(enemy.hurtbox.id, hurtboxColliderRef)

  useEffect(() => {
    const body = bodyRef.current
    const collider = bodyColliderRef.current
    if (body === null || collider === null) return
    const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
    configureCharacterController(controller)
    const detach = runtime.attachEnemyCollisionResolver((position, desiredTranslation) => {
      body.setTranslation(position, false)
      controller.computeColliderMovement(collider, desiredTranslation)
      const translation = controller.computedMovement()
      body.setTranslation(
        {
          x: position.x + translation.x,
          y: position.y + translation.y,
          z: position.z + translation.z,
        },
        false,
      )
      return {
        translation: { x: translation.x, y: translation.y, z: translation.z },
        grounded: controller.computedGrounded(),
      }
    })
    return () => {
      detach()
      world.removeCharacterController(controller)
    }
  }, [runtime, world])

  useFrame(() => {
    const body = bodyRef.current
    if (body === null) return
    body.setTranslation(runtime.snapshot().enemy.position, false)
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[enemy.position.x, enemy.position.y, enemy.position.z]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider
        ref={bodyColliderRef}
        args={[
          MELEE_ENEMY_DEFINITION.body.halfHeight,
          MELEE_ENEMY_DEFINITION.body.radius,
        ]}
      />
      <BallCollider ref={hurtboxColliderRef} args={[enemy.hurtbox.radius]} sensor />
      <EnemyVisual runtime={runtime} />
    </RigidBody>
  )
}
