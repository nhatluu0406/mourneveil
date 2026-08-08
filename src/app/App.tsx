import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { FoundationPanel } from '../debug/FoundationPanel'
import { createFoundationDiagnostic } from '../game/core/foundationDiagnostic'
import { Scene } from '../render/Scene'
import { RenderErrorBoundary } from './RenderErrorBoundary'
import { useFoundationRuntime } from './useFoundationRuntime'

export function App() {
  const [rendererReady, setRendererReady] = useState(false)
  const [physicsReady, setPhysicsReady] = useState(false)
  const runtime = useFoundationRuntime()
  const reportPhysicsReady = useCallback(() => setPhysicsReady(true), [])
  const diagnostic = useMemo(
    () => createFoundationDiagnostic(rendererReady, physicsReady, runtime),
    [rendererReady, physicsReady, runtime],
  )

  return (
    <main className="app-shell">
      <RenderErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [8, 8, 8], fov: 45, near: 0.1, far: 100 }}
          dpr={[1, 2]}
          fallback={
            <div className="render-fallback" role="alert">
              <h2>3D renderer unavailable</h2>
              <p>This browser does not provide the WebGL support Mourneveil needs.</p>
            </div>
          }
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0)
            setRendererReady(true)
          }}
        >
          <Suspense fallback={null}>
            <Scene onPhysicsReady={reportPhysicsReady} />
          </Suspense>
        </Canvas>
      </RenderErrorBoundary>
      <FoundationPanel diagnostic={diagnostic} />
    </main>
  )
}
