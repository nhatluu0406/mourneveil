import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { FoundationPanel } from '../debug/FoundationPanel'
import { createFoundationDiagnostic } from '../game/core/foundationDiagnostic'
import { Scene } from '../render/Scene'
import type { CameraDiagnostic } from '../render/followCamera'
import { createPointerWorldAimResolver } from '../render/pointerWorldAim'
import { RenderErrorBoundary } from './RenderErrorBoundary'
import { useFoundationRuntime } from './useFoundationRuntime'

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
      />
    </main>
  )
}
