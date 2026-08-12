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
      <ConnectedLevelVisual runtime={runtime} />
      <CameraOcclusionFader runtime={runtime} />
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
      <fog attach="fog" args={['#080d10', 12, 34]} />
      <ambientLight intensity={0.29} color="#72898d" />
      <hemisphereLight args={['#8eabb3', '#18130f', 0.38]} />
      <directionalLight
        castShadow
        intensity={1.56}
        position={[8, 16, 6]}
        color="#a9d2dc"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={48}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight intensity={0.22} position={[-7, 5, -6]} color="#c59a72" />
      <pointLight
        position={[-9.7, 3.1, 2.7]}
        intensity={0.92}
        distance={8.2}
        color="#90b9a5"
      />
      <pointLight
        position={[10, 3.1, -4]}
        intensity={0.88}
        distance={11}
        color={MOURNEVEIL_PALETTE.finalGate.open}
      />
      <FollowCameraRig runtime={runtime} onDiagnostic={onCameraDiagnostic} />
      {import.meta.env.DEV ? <RendererStatsPublisher /> : null}
      <GameWorld onPhysicsReady={onPhysicsReady} runtime={runtime} />
    </>
  )
}
