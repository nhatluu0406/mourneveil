import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import {
  Vector2,
  type Light,
  type Mesh,
  type Object3D,
  type WebGLShadowMap,
} from 'three'
import { publishRendererStats } from '../debug/rendererStats'

function countBy(
  root: Object3D,
  predicate: (object: Object3D) => boolean,
): number {
  let total = 0
  root.traverse((object) => {
    if (predicate(object)) total += 1
  })
  return total
}

/**
 * Publishes a low-frequency renderer snapshot for DEV gates.
 * Does not allocate per-frame beyond a throttled publish.
 */
export function RendererStatsPublisher() {
  const { gl, scene } = useThree()
  const frameRef = useRef(0)
  const drawingBufferRef = useRef(new Vector2())

  useFrame(() => {
    frameRef.current += 1
    if (frameRef.current % 30 !== 0) return

    const info = gl.info
    const canvas = gl.domElement
    const shadowMap = gl.shadowMap as WebGLShadowMap
    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
      }
    ).memory

    let shadowMapSize: number | null = null
    scene.traverse((object) => {
      const light = object as Light & {
        shadow?: { mapSize?: { x: number; y: number } }
      }
      if (light.isLight === true && light.shadow?.mapSize) {
        shadowMapSize = Math.max(
          shadowMapSize ?? 0,
          light.shadow.mapSize.x,
          light.shadow.mapSize.y,
        )
      }
    })

    const drawingBuffer = gl.getDrawingBufferSize(drawingBufferRef.current)
    publishRendererStats({
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      programs: info.programs?.length ?? 0,
      calls: info.render.calls,
      points: info.render.points,
      lines: info.render.lines,
      pixelRatio: gl.getPixelRatio(),
      drawingBufferWidth: drawingBuffer.x,
      drawingBufferHeight: drawingBuffer.y,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
      shadowMapEnabled: shadowMap?.enabled === true,
      shadowMapSize,
      sceneObjectCount: countBy(scene, () => true),
      meshCount: countBy(scene, (object) => (object as Mesh).isMesh === true),
      lightCount: countBy(scene, (object) => (object as Light).isLight === true),
      jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
      jsHeapTotalBytes: memory?.totalJSHeapSize ?? null,
      devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
    })
  })

  return null
}
