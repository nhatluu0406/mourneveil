import { PerspectiveCamera } from 'three'
import { describe, expect, it } from 'vitest'
import { localNegativeZFacingYaw } from './enemyAttackPresentation'
import {
  createPointerWorldAimResolver,
  pointerClientToNdc,
  projectNdcToGameplayAim,
  projectNdcToWorldAimDirection,
} from './pointerWorldAim'

describe('pointer world aim projection', () => {
  it('converts canvas-local client coordinates to NDC with Y inversion', () => {
    expect(
      pointerClientToNdc(50, 25, { left: 0, top: 0, width: 100, height: 100 }),
    ).toEqual({ x: 0, y: 0.5 })
    expect(
      pointerClientToNdc(10, 20, { left: 10, top: 20, width: 0, height: 100 }),
    ).toBeNull()
    expect(
      pointerClientToNdc(10, 20, { left: 10, top: 20, width: 200, height: 100 }),
    ).toEqual({ x: -1, y: 1 })
  })

  it('projects the pointer onto the gameplay plane and returns semantic direction', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 10, 10)
    camera.lookAt(0, 0.82, 0)
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

    const aim = resolve(50, 50)
    expect(aim).not.toBeNull()
    expect(aim!.x).toBeCloseTo(1, 5)
    expect(aim!.z).toBeCloseTo(0, 5)
  })

  it('aims along each cardinal ground direction from a top-down camera', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 20, 0)
    camera.lookAt(0, 0.82, 0)
    camera.updateMatrixWorld(true)
    const player = { x: 0, y: 0.82, z: 0 }

    const cases = [
      [{ x: 0, y: 0.25 }, { x: 0, z: -1 }],
      [{ x: 0, y: -0.25 }, { x: 0, z: 1 }],
      [{ x: -0.25, y: 0 }, { x: -1, z: 0 }],
      [{ x: 0.25, y: 0 }, { x: 1, z: 0 }],
    ] as const

    for (const [ndc, expected] of cases) {
      const aim = projectNdcToWorldAimDirection(ndc, camera, player)
      expect(aim).not.toBeNull()
      expect(aim!.x).toBeCloseTo(expected.x, 1)
      expect(aim!.z).toBeCloseTo(expected.z, 1)
    }
  })

  it('keeps projected aim height on the player plane and supports diagonals', () => {
    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 20, 0)
    camera.lookAt(0, 0.82, 0)
    camera.updateMatrixWorld(true)
    const player = { x: 0, y: 0.82, z: 0 }
    const projection = projectNdcToGameplayAim({ x: 0.2, y: 0.2 }, camera, player)
    expect(projection).not.toBeNull()
    expect(projection!.worldPoint.y).toBeCloseTo(0.82, 5)
    expect(projection!.aimDirection.x).toBeGreaterThan(0)
    expect(projection!.aimDirection.z).toBeLessThan(0)
  })
})

describe('localNegativeZFacingYaw', () => {
  it('aligns presentation local -Z with each cardinal execution facing', () => {
    const cases = [
      [{ x: 0, z: -1 }, { x: 0, z: -1 }],
      [{ x: 0, z: 1 }, { x: 0, z: 1 }],
      [{ x: 1, z: 0 }, { x: 1, z: 0 }],
      [{ x: -1, z: 0 }, { x: -1, z: 0 }],
    ] as const
    for (const [facing, expected] of cases) {
      const yaw = localNegativeZFacingYaw(facing)
      const presented = {
        x: -Math.sin(yaw),
        z: -Math.cos(yaw),
      }
      expect(presented.x).toBeCloseTo(expected.x, 5)
      expect(presented.z).toBeCloseTo(expected.z, 5)
    }
  })
})
