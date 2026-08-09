import { Physics, useRapier } from '@react-three/rapier'
import { useEffect } from 'react'
import type { GameRuntime } from '../game/runtime/GameRuntime'
import { FIXED_STEP_SECONDS } from '../game/core/fixedStepClock'
import { PlayerPhysicsBody } from '../physics/PlayerPhysicsBody'
import { CombatContactPhysics } from '../physics/CombatContactPhysics'
import { EnemyPhysicsBody } from '../physics/EnemyPhysicsBody'
import { FollowCameraRig } from './FollowCameraRig'
import type { CameraDiagnostic } from './followCamera'
import { CheckpointVisual } from './CheckpointVisual'
import { EchoRecoveryVisual } from './EchoRecoveryVisual'
import { LootPickupVisual } from './LootPickupVisual'
import { ConnectedLevelVisual } from './ConnectedLevelVisual'

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

function GameWorld({ onPhysicsReady, runtime }: SceneProps) {
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={FIXED_STEP_SECONDS}>
      <PhysicsReadySignal onReady={onPhysicsReady} />
      <ConnectedLevelVisual runtime={runtime} />
      <CheckpointVisual runtime={runtime} />
      <EchoRecoveryVisual runtime={runtime} />
      <LootPickupVisual runtime={runtime} />
      <CombatContactPhysics runtime={runtime}>
        <PlayerPhysicsBody runtime={runtime} />
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
