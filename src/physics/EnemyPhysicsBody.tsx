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
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { meleeRoleByRuntimeId } from '../game/enemies/enemyRoles'
import { EnemyVisual } from '../render/EnemyVisual'
import {
  CHARACTER_COLLISION_OFFSET,
  configureCharacterController,
} from './playerCollisionConfig'
import { useCombatHurtboxRegistration } from './combatHurtboxRegistry'

export function EnemyPhysicsBody({
  runtime,
  enemyId,
}: {
  readonly runtime: GameRuntime
  readonly enemyId: string
}) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const bodyColliderRef = useRef<RapierCollider>(null)
  const hurtboxColliderRef = useRef<RapierCollider>(null)
  const { world } = useRapier()
  const role = meleeRoleByRuntimeId(enemyId)
  const enemy =
    runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ??
    runtime.snapshot().enemy
  useCombatHurtboxRegistration(enemy.hurtbox.id, hurtboxColliderRef)

  useEffect(() => {
    const body = bodyRef.current
    const collider = bodyColliderRef.current
    if (body === null || collider === null || role === null) return
    const controller = world.createCharacterController(CHARACTER_COLLISION_OFFSET)
    configureCharacterController(controller)
    const detach = runtime.attachEnemyCollisionResolver(
      enemyId,
      (position, desiredTranslation) => {
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
      },
    )
    return () => {
      detach()
      world.removeCharacterController(controller)
    }
  }, [runtime, world, enemyId, role])

  useFrame(() => {
    const body = bodyRef.current
    if (body === null) return
    const live =
      runtime.snapshot().enemies.find((entry) => entry.id === enemyId) ?? null
    if (live === null) return
    body.setTranslation(live.position, false)
  })

  if (role === null) return null

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
        args={[role.definition.body.halfHeight, role.definition.body.radius]}
      />
      <BallCollider ref={hurtboxColliderRef} args={[enemy.hurtbox.radius]} sensor />
      <EnemyVisual runtime={runtime} enemyId={enemyId} />
    </RigidBody>
  )
}
