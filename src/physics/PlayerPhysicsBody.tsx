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
import type { Group } from 'three'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { PlayerVisual } from '../render/PlayerVisual'
import { playerVisualPosition, usesInterpolatedPresentation } from '../render/presentationSampling'
import { presentationOffsetFromSimulation } from '../game/core/presentationTransform'
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
  const presentationRef = useRef<Group>(null)
  const interpolateRef = useRef(usesInterpolatedPresentation())
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
        // Physics is paused in Scene; step once so character queries see current
        // kinematic + fixed collider poses (Rapier broadphase). Avoids soft wall penetration.
        world.step()
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
    const simulation = runtime.snapshot().player.position
    rigidBody.setTranslation(simulation, false)
    const presented = playerVisualPosition(runtime, interpolateRef.current)
    const offset = presentationOffsetFromSimulation(simulation, presented)
    const visual = presentationRef.current
    if (visual !== null) visual.position.set(offset.x, offset.y, offset.z)
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
      <group ref={presentationRef}>
        <PlayerVisual runtime={runtime} />
      </group>
    </RigidBody>
  )
}
