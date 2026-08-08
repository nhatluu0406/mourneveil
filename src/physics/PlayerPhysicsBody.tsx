import {
  CapsuleCollider,
  RigidBody,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import { PlayerVisual } from '../render/PlayerVisual'

export const CHARACTER_COLLISION_OFFSET = 0.02
export const CHARACTER_GROUND_SNAP_DISTANCE = 0.1
export const CHARACTER_MAX_WALKABLE_SLOPE_RADIANS = Math.PI / 4

interface PlayerPhysicsBodyProps {
  runtime: PlayerRuntime
}

export function PlayerPhysicsBody({ runtime }: PlayerPhysicsBodyProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const colliderRef = useRef<RapierCollider>(null)
  const { world } = useRapier()
  const initialPosition = runtime.snapshot().player.position

  useEffect(() => {
    const rigidBody = rigidBodyRef.current
    const collider = colliderRef.current
    if (rigidBody === null || collider === null) {
      return
    }

    const controller = world.createCharacterController(
      CHARACTER_COLLISION_OFFSET,
    )
    controller.setSlideEnabled(true)
    controller.enableSnapToGround(CHARACTER_GROUND_SNAP_DISTANCE)
    controller.setMaxSlopeClimbAngle(
      CHARACTER_MAX_WALKABLE_SLOPE_RADIANS,
    )
    controller.setMinSlopeSlideAngle(
      CHARACTER_MAX_WALKABLE_SLOPE_RADIANS,
    )

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

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider ref={colliderRef} args={[0.45, 0.35]} />
      <PlayerVisual />
    </RigidBody>
  )
}
