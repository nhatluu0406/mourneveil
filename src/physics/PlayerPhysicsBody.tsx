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
import { PlayerVisual } from '../render/PlayerVisual'
import {
  CHARACTER_COLLISION_OFFSET,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
  configurePlayerCharacterController,
} from './playerCollisionConfig'
import { useCombatHurtboxRegistration } from './combatHurtboxRegistry'

interface PlayerPhysicsBodyProps {
  runtime: GameRuntime
}

export function PlayerPhysicsBody({ runtime }: PlayerPhysicsBodyProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const colliderRef = useRef<RapierCollider>(null)
  const hurtboxColliderRef = useRef<RapierCollider>(null)
  const { world } = useRapier()
  const initialPosition = runtime.snapshot().player.position
  const playerHurtbox = runtime.snapshot().playerHealth.hurtbox
  useCombatHurtboxRegistration(playerHurtbox.id, hurtboxColliderRef)

  useEffect(() => {
    const rigidBody = rigidBodyRef.current
    const collider = colliderRef.current
    if (rigidBody === null || collider === null) {
      return
    }

    const controller = world.createCharacterController(
      CHARACTER_COLLISION_OFFSET,
    )
    configurePlayerCharacterController(controller)

    const detachResolver = runtime.attachCollisionResolver(
      (position, desiredTranslation) => {
        rigidBody.setTranslation(position, false)
        controller.computeColliderMovement(collider, desiredTranslation)
        const translation = controller.computedMovement()
        const nextPosition = {
          x: position.x + translation.x,
          y: position.y + translation.y,
          z: position.z + translation.z,
        }
        rigidBody.setTranslation(nextPosition, false)

        return {
          translation: {
            x: translation.x,
            y: translation.y,
            z: translation.z,
          },
          grounded: controller.computedGrounded(),
        }
      },
    )

    return () => {
      detachResolver()
      world.removeCharacterController(controller)
    }
  }, [runtime, world])

  useFrame(() => {
    const rigidBody = rigidBodyRef.current
    if (rigidBody === null) return
    const position = runtime.snapshot().player.position
    rigidBody.setTranslation(position, false)
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider
        ref={colliderRef}
        args={[PLAYER_CAPSULE_HALF_HEIGHT, PLAYER_CAPSULE_RADIUS]}
      />
      <BallCollider
        ref={hurtboxColliderRef}
        args={[playerHurtbox.radius]}
        sensor
      />
      <PlayerVisual runtime={runtime} />
    </RigidBody>
  )
}
