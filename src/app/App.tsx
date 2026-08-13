import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { DevelopmentPanel } from '../debug/DevelopmentPanel'
import { PerfHud } from '../debug/PerfHud'
import { shouldShowPerfHud, isM15Baseline } from '../debug/devQuery'
import { installDevelopmentBrowserGate } from '../debug/browserGate'
import { createDevelopmentDiagnostic } from '../debug/developmentDiagnostic'
import { Scene } from '../render/Scene'
import type { CameraDiagnostic } from '../render/followCamera'
import { createPointerWorldAimResolver } from '../render/pointerWorldAim'
import {
  resolveFollowCameraProfileId,
  setFollowCameraProfile,
  FOLLOW_CAMERA_PROFILES,
} from '../render/followCamera'
import { GameplayHud } from '../ui/GameplayHud'
import { InventoryEquipmentPanel } from '../ui/InventoryEquipmentPanel'
import { RenderErrorBoundary } from './RenderErrorBoundary'
import { useGameRuntime } from './useGameRuntime'

/** Cap retina DPR so a simple graybox scene does not allocate 2× drawing buffers by default. */
const RENDERER_DPR: [number, number] = [1, 1.35]

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
    if (!devDetailsVisible) return
    setCameraDiagnostic(diagnostic)
  }, [devDetailsVisible])
  const cameraProfile = useMemo(() => {
    const search = typeof window === 'undefined' ? '' : window.location.search
    const id = resolveFollowCameraProfileId(search, isM15Baseline(search))
    setFollowCameraProfile(id)
    return FOLLOW_CAMERA_PROFILES[id]
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
            position: [
              cameraProfile.offset.x,
              cameraProfile.offset.y,
              cameraProfile.offset.z,
            ],
            fov: cameraProfile.fov,
            near: 0.1,
            far: 120,
          }}
          dpr={RENDERER_DPR}
          fallback={
            <div className="render-fallback" role="alert">
              <h2>3D renderer unavailable</h2>
              <p>This browser does not provide the WebGL support Mourneveil needs.</p>
            </div>
          }
          onCreated={({ camera, gl }) => {
            gl.outputColorSpace = SRGBColorSpace
            gl.toneMapping = ACESFilmicToneMapping
            gl.toneMappingExposure = 1.22
            gl.shadowMap.type = PCFSoftShadowMap
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
      {import.meta.env.DEV ? (
        <PerfHud
          visible={shouldShowPerfHud(
            typeof window === 'undefined' ? '' : window.location.search,
            true,
            devDetailsVisible,
          )}
        />
      ) : null}
    </main>
  )
}
