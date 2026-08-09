import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { DevelopmentPanel } from '../debug/DevelopmentPanel'
import { installDevelopmentBrowserGate } from '../debug/browserGate'
import { createDevelopmentDiagnostic } from '../debug/developmentDiagnostic'
import { Scene } from '../render/Scene'
import type { CameraDiagnostic } from '../render/followCamera'
import { createPointerWorldAimResolver } from '../render/pointerWorldAim'
import { GameplayHud } from '../ui/GameplayHud'
import { InventoryEquipmentPanel } from '../ui/InventoryEquipmentPanel'
import { RenderErrorBoundary } from './RenderErrorBoundary'
import { useGameRuntime } from './useGameRuntime'

export function App() {
  const [rendererReady, setRendererReady] = useState(false)
  const [physicsReady, setPhysicsReady] = useState(false)
  const [cameraDiagnostic, setCameraDiagnostic] =
    useState<CameraDiagnostic | null>(null)
  const {
    runtime,
    snapshot: runtimeSnapshot,
    attachGameplayInput,
  } = useGameRuntime()
  const reportPhysicsReady = useCallback(() => setPhysicsReady(true), [])
  const reportCameraDiagnostic = useCallback((diagnostic: CameraDiagnostic) => {
    setCameraDiagnostic(diagnostic)
  }, [])
  const diagnostic = useMemo(
    () =>
      createDevelopmentDiagnostic(
        rendererReady,
        physicsReady,
        runtimeSnapshot,
      ),
    [rendererReady, physicsReady, runtimeSnapshot],
  )

  useEffect(() => {
    if (!import.meta.env.DEV) return
    return installDevelopmentBrowserGate(runtime)
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
      <GameplayHud snapshot={runtimeSnapshot} />
      {import.meta.env.DEV ? (
        <DevelopmentPanel
          diagnostic={diagnostic}
          camera={cameraDiagnostic}
          onResetTrainingTarget={() => runtime.resetTrainingTarget()}
          onRestorePlayerForDevelopment={() => runtime.restorePlayerForDevelopment()}
          onResetMeleeFixture={() => runtime.resetMeleeFixture()}
        />
      ) : null}
      <InventoryEquipmentPanel snapshot={runtimeSnapshot} runtime={runtime} />
    </main>
  )
}
