import { PerspectiveCamera } from 'three'
import { describe, expect, it } from 'vitest'
import { createPointerWorldAimResolver } from './pointerWorldAim'

describe('pointer world aim projection', () => {
  it('projects the pointer onto the gameplay plane and returns semantic direction', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 10, 10)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    const surface = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      }),
    } as HTMLElement
    const resolve = createPointerWorldAimResolver(
      surface,
      camera,
      () => ({ x: -2, y: 0.82, z: 0 }),
    )

    expect(resolve(50, 50)).toEqual({ x: 1, z: 0 })
  })
})
