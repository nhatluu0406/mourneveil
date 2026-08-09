import { Physics, RigidBody, useRapier } from '@react-three/rapier'
import { useEffect } from 'react'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import { GRAYBOX_CENTER_BLOCKER_SIZE } from '../physics/grayboxCollision'
import { PlayerPhysicsBody } from '../physics/PlayerPhysicsBody'
import { TrainingTargetPhysicsBody } from '../physics/TrainingTargetPhysicsBody'
import { CombatContactPhysics } from '../physics/CombatContactPhysics'
import { EnemyPhysicsBody } from '../physics/EnemyPhysicsBody'
import { FollowCameraRig } from './FollowCameraRig'
import type { CameraDiagnostic } from './followCamera'
import { CheckpointVisual } from './CheckpointVisual'
import { EchoRecoveryVisual } from './EchoRecoveryVisual'
import { LootPickupVisual } from './LootPickupVisual'

interface SceneProps {
  onPhysicsReady: () => void
  onCameraDiagnostic?: (diagnostic: CameraDiagnostic) => void
  runtime: GameRuntime
}

function PhysicsReadySignal({ onReady }: { onReady: () => void }) {
  useRapier()

  useEffect(() => {
    onReady()
  }, [onReady])

  return null
}

function BoundaryWall({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#6a7870" roughness={0.88} />
      </mesh>
    </RigidBody>
  )
}

function OrientationMarker() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.04, 0.08]} />
        <meshStandardMaterial color="#c9b07a" roughness={0.7} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.08, 0.04, 0.9]} />
        <meshStandardMaterial color="#7f9e8c" roughness={0.7} />
      </mesh>
    </group>
  )
}

function GameWorld({ onPhysicsReady, runtime }: SceneProps) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={FIXED_STEP_SECONDS}>
      <PhysicsReadySignal onReady={onPhysicsReady} />
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[12, 0.5, 12]} />
          <meshStandardMaterial color="#26302c" roughness={0.94} />
        </mesh>
      </RigidBody>
      <gridHelper
        args={[12, 12, '#6d8074', '#36423c']}
        position={[0, 0.01, 0]}
      />
      <OrientationMarker />
      <CheckpointVisual runtime={runtime} />
      <EchoRecoveryVisual runtime={runtime} />
      <LootPickupVisual runtime={runtime} />
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
          <boxGeometry
            args={[
              GRAYBOX_CENTER_BLOCKER_SIZE.x,
              GRAYBOX_CENTER_BLOCKER_SIZE.y,
              GRAYBOX_CENTER_BLOCKER_SIZE.z,
            ]}
          />
          <meshStandardMaterial color="#a88455" roughness={0.76} />
        </mesh>
      </RigidBody>
      <BoundaryWall position={[-5.75, 0.75, 0]} size={[0.5, 1.5, 12]} />
      <BoundaryWall position={[5.75, 0.75, 0]} size={[0.5, 1.5, 12]} />
      <BoundaryWall position={[0, 0.75, -5.75]} size={[11, 1.5, 0.5]} />
      <BoundaryWall position={[0, 0.75, 5.75]} size={[11, 1.5, 0.5]} />
      <CombatContactPhysics runtime={runtime}>
        <PlayerPhysicsBody runtime={runtime} />
        <TrainingTargetPhysicsBody runtime={runtime} />
        {runtime.enemyIds().map((enemyId) => (
          <EnemyPhysicsBody key={enemyId} runtime={runtime} enemyId={enemyId} />
        ))}
      </CombatContactPhysics>
    </Physics>
  )
}

export function Scene({
  onPhysicsReady,
  onCameraDiagnostic,
  runtime,
}: SceneProps) {
  return (
    <>
      <color attach="background" args={['#10141a']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={2.35}
        position={[9, 14, 6]}
        shadow-mapSize={[1024, 1024]}
      />
      <FollowCameraRig runtime={runtime} onDiagnostic={onCameraDiagnostic} />
      <GameWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
