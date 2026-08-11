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
      <ConnectedLevelVisual runtime={runtime} />
      <CameraOcclusionFader runtime={runtime} />
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
      <fog attach="fog" args={['#0a0e12', 14, 38]} />
      <ambientLight intensity={0.22} color="#6d7882" />
      <hemisphereLight args={['#8a9aa8', '#1a1612', 0.35]} />
      <directionalLight
        castShadow
        intensity={1.55}
        position={[10, 18, 4]}
        color="#f0e2c8"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={48}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight intensity={0.28} position={[-8, 6, -6]} color="#4d6478" />
      <pointLight
        position={[-5.5, 2.6, 0]}
        intensity={1.05}
        distance={9}
        color={MOURNEVEIL_PALETTE.checkpoint.active}
      />
      <pointLight
        position={[-14, 2.2, 6]}
        intensity={0.45}
        distance={8}
        color="#c4b08a"
      />
      <pointLight
        position={[1.2, 2.4, -4]}
        intensity={0.4}
        distance={9}
        color="#b89a72"
      />
      <pointLight
        position={[10, 3.1, -4]}
        intensity={1.15}
        distance={11}
        color={MOURNEVEIL_PALETTE.finalGate.open}
      />
      <FollowCameraRig runtime={runtime} onDiagnostic={onCameraDiagnostic} />
      {import.meta.env.DEV ? <RendererStatsPublisher /> : null}
      <GameWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
