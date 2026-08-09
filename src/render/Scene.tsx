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
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'

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
      <color attach="background" args={[MOURNEVEIL_PALETTE.background]} />
      <fog attach="fog" args={[MOURNEVEIL_PALETTE.background, 18, 42]} />
      <ambientLight intensity={0.38} color={MOURNEVEIL_PALETTE.ambient} />
      <directionalLight
        castShadow
        intensity={1.85}
        position={[8, 16, 5]}
        color="#e8dcc8"
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight intensity={0.35} position={[-6, 8, -4]} color="#6d7f92" />
      <pointLight
        position={[-5.5, 2.4, 0]}
        intensity={0.55}
        distance={8}
        color={MOURNEVEIL_PALETTE.checkpoint.active}
      />
      <pointLight
        position={[10, 2.8, -4]}
        intensity={0.7}
        distance={10}
        color={MOURNEVEIL_PALETTE.finalGate.open}
      />
      <FollowCameraRig runtime={runtime} onDiagnostic={onCameraDiagnostic} />
      <GameWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
