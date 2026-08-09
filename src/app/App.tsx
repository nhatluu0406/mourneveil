import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { FoundationPanel } from '../debug/FoundationPanel'
import { createFoundationDiagnostic } from '../game/core/foundationDiagnostic'
import {
  PLAYER_CHECKPOINT_INTERACTION_REQUEST,
  PLAYER_RESPAWN_REQUEST,
} from '../input/playerRecoveryIntent'
import { PLAYER_FLASK_USE_REQUEST } from '../input/playerFlaskIntent'
import { Scene } from '../render/Scene'
import type { CameraDiagnostic } from '../render/followCamera'
import { createPointerWorldAimResolver } from '../render/pointerWorldAim'
import { InventoryEquipmentPanel } from '../ui/InventoryEquipmentPanel'
import { RenderErrorBoundary } from './RenderErrorBoundary'
import { useFoundationRuntime } from './useFoundationRuntime'

declare global {
  interface Window {
    __MOURNEVEIL_GATE__?: {
      snapshot: () => unknown
      applyDamage: (damage: number) => void
      useFlask: () => void
      interactCheckpoint: () => void
      respawn: () => void
      defeatEnemy: (enemyId: string) => void
      setPlayerPosition: (position: { x: number; y: number; z: number }) => void
      equipItem: (itemId: string) => unknown
      unequipSlot: (slot: 'weapon' | 'charm') => unknown
    }
  }
}

export function App() {
  const [rendererReady, setRendererReady] = useState(false)
  const [physicsReady, setPhysicsReady] = useState(false)
  const [cameraDiagnostic, setCameraDiagnostic] =
    useState<CameraDiagnostic | null>(null)
  const {
    runtime,
    diagnostic: runtimeDiagnostic,
    attachGameplayInput,
  } = useFoundationRuntime()
  const reportPhysicsReady = useCallback(() => setPhysicsReady(true), [])
  const reportCameraDiagnostic = useCallback((diagnostic: CameraDiagnostic) => {
    setCameraDiagnostic(diagnostic)
  }, [])
  const diagnostic = useMemo(
    () =>
      createFoundationDiagnostic(
        rendererReady,
        physicsReady,
        runtimeDiagnostic,
      ),
    [rendererReady, physicsReady, runtimeDiagnostic],
  )

  useEffect(() => {
    window.__MOURNEVEIL_GATE__ = {
      snapshot: () => runtime.snapshot(),
      applyDamage: (damage: number) => {
        runtime.applyPlayerDamage(damage)
      },
      useFlask: () => {
        runtime.requestPlayerFlaskUse(PLAYER_FLASK_USE_REQUEST)
      },
      interactCheckpoint: () => {
        runtime.requestCheckpointInteraction(PLAYER_CHECKPOINT_INTERACTION_REQUEST)
      },
      respawn: () => {
        runtime.requestRespawn(PLAYER_RESPAWN_REQUEST)
      },
      defeatEnemy: (enemyId: string) => {
        runtime.debugDefeatEnemy(enemyId)
      },
      setPlayerPosition: (position: { x: number; y: number; z: number }) => {
        runtime.debugSetPlayerPosition(position)
      },
      equipItem: (itemId: string) => runtime.equipItem(itemId),
      unequipSlot: (slot: 'weapon' | 'charm') => runtime.unequipSlot(slot),
    }
    return () => {
      delete window.__MOURNEVEIL_GATE__
    }
  }, [runtime])

  return (
    <main className="app-shell">
      <RenderErrorBoundary>
        <Canvas
          shadows
          camera={{
            position: [8.5, 10.5, 8.5],
            fov: 40,
            near: 0.1,
            far: 120,
          }}
          dpr={[1, 2]}
          fallback={
            <div className="render-fallback" role="alert">
              <h2>3D renderer unavailable</h2>
              <p>This browser does not provide the WebGL support Mourneveil needs.</p>
            </div>
          }
          onCreated={({ camera, gl }) => {
            setRendererReady(true)
            attachGameplayInput(
              gl.domElement,
              createPointerWorldAimResolver(
                gl.domElement,
                camera,
                () => runtime.snapshot().player.position,
              ),
            )
          }}
        >
          <Suspense fallback={null}>
            <Scene
              onPhysicsReady={reportPhysicsReady}
              onCameraDiagnostic={reportCameraDiagnostic}
              runtime={runtime}
            />
          </Suspense>
        </Canvas>
      </RenderErrorBoundary>
      <FoundationPanel
        diagnostic={diagnostic}
        camera={cameraDiagnostic}
        onResetTrainingTarget={() => runtime.resetTrainingTarget()}
        onRestorePlayerForDevelopment={() => runtime.restorePlayerForDevelopment()}
        onResetMeleeFixture={() => runtime.resetMeleeFixture()}
      />
      <InventoryEquipmentPanel diagnostic={diagnostic} runtime={runtime} />
    </main>
  )
}
