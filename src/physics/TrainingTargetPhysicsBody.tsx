import {
  BallCollider,
  RigidBody,
  type RapierCollider,
} from '@react-three/rapier'
import { useRef } from 'react'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { TrainingTargetVisual } from '../render/TrainingTargetVisual'
import { useCombatHurtboxRegistration } from './combatHurtboxRegistry'

export function TrainingTargetPhysicsBody({
  runtime,
}: {
  runtime: GameRuntime
}) {
  const colliderRef = useRef<RapierCollider>(null)
  const target = runtime.snapshot().trainingTarget
  useCombatHurtboxRegistration(target.hurtbox.id, colliderRef)

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
