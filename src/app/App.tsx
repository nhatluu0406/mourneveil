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
  const [devDetailsVisible, setDevDetailsVisible] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.code === 'KeyI') {
        event.preventDefault()
        setInventoryOpen((value) => !value)
        return
      }
      if (import.meta.env.DEV && event.code === 'F3') {
        event.preventDefault()
        setDevDetailsVisible((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
      <InventoryEquipmentPanel
        snapshot={runtimeSnapshot}
        runtime={runtime}
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
      />
      {import.meta.env.DEV ? (
        <DevelopmentPanel
          diagnostic={diagnostic}
          camera={cameraDiagnostic}
          visible={devDetailsVisible}
          onResetTrainingTarget={() => runtime.resetTrainingTarget()}
          onRestorePlayerForDevelopment={() => runtime.restorePlayerForDevelopment()}
          onResetMeleeFixture={() => runtime.resetMeleeFixture()}
        />
      ) : null}
      {import.meta.env.DEV && !devDetailsVisible ? (
        <p className="dev-hint">F3 — Development Details</p>
      ) : null}
    </main>
  )
}
