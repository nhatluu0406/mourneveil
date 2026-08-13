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
import {
  CameraOcclusionFader,
  ConnectedLevelVisual,
} from './ConnectedLevelVisual'
import { MOURNEVEIL_PALETTE } from './mourneveilPalette'
import { RendererStatsPublisher } from './RendererStatsPublisher'
import { MotionTelemetryPublisher } from './MotionTelemetryPublisher'
import { VeilCombatVfx } from './VeilCombatVfx'

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
    <Physics gravity={[0, -9.81, 0]} timeStep={FIXED_STEP_SECONDS} paused>
      <PhysicsReadySignal onReady={onPhysicsReady} />
      <CameraOcclusionFader runtime={runtime} />
      <ConnectedLevelVisual runtime={runtime} />
      <CheckpointVisual runtime={runtime} />
      <EchoRecoveryVisual runtime={runtime} />
      <LootPickupVisual runtime={runtime} />
      <VeilCombatVfx runtime={runtime} />
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
      <fog attach="fog" args={['#10181c', 30, 70]} />
      <ambientLight intensity={0.5} color="#879ea1" />
      <hemisphereLight args={['#a8c0c2', '#2d211b', 0.66]} />
      <directionalLight
        castShadow
        intensity={1.28}
        position={[8, 16, 6]}
        color="#b8d5da"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.05}
        shadow-intensity={0.28}
        shadow-camera-far={48}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <FollowCameraRig runtime={runtime} onDiagnostic={onCameraDiagnostic} />
      {import.meta.env.DEV ? <RendererStatsPublisher /> : null}
      {import.meta.env.DEV ? <MotionTelemetryPublisher runtime={runtime} /> : null}
      <GameWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
