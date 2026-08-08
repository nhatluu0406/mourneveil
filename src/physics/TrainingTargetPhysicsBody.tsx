import {
  BallCollider,
  RigidBody,
  useRapier,
  type RapierCollider,
} from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import type { PlayerRuntime } from '../game/character/playerRuntime'
import { TrainingTargetVisual } from '../render/TrainingTargetVisual'
import { createRapierCombatContactQuery } from './combatContactQuery'

export function TrainingTargetPhysicsBody({
  runtime,
}: {
  runtime: PlayerRuntime
}) {
  const colliderRef = useRef<RapierCollider>(null)
  const { world, rapier } = useRapier()
  const target = runtime.snapshot().trainingTarget

  useEffect(() => {
    const collider = colliderRef.current
    if (collider === null) {
      return
    }

    return runtime.attachCombatContactQuery(
      createRapierCombatContactQuery(world, rapier, [
        { hurtboxId: target.hurtbox.id, collider },
      ]),
    )
  }, [rapier, runtime, target.hurtbox.id, world])

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[target.position.x, target.position.y, target.position.z]}
    >
      <BallCollider
        ref={colliderRef}
        args={[target.hurtbox.radius]}
        position={[
          target.hurtbox.center.x - target.position.x,
          target.hurtbox.center.y - target.position.y,
          target.hurtbox.center.z - target.position.z,
        ]}
        sensor
      />
      <TrainingTargetVisual runtime={runtime} />
    </RigidBody>
  )
}
