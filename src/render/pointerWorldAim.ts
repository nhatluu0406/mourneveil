import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three'
import type { Vector3Value } from '../game/character/playerMotor'
import { worldAimPointToDirection, type PlayerAimDirection } from '../input/playerAimIntent'
import type { AimDirectionResolver } from '../input/browserAttackInput'

const GAMEPLAY_PLANE = new Plane(new Vector3(0, 1, 0), 0)

export interface ClientRectLike {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export interface NormalizedDeviceCoordinates {
  readonly x: number
  readonly y: number
}

/** Canvas-local client coordinates → NDC. Uses the canvas bounds, not the window. */
export function pointerClientToNdc(
  clientX: number,
  clientY: number,
  bounds: ClientRectLike,
): NormalizedDeviceCoordinates | null {
  if (bounds.width <= 0 || bounds.height <= 0) return null
  return {
    x: ((clientX - bounds.left) / bounds.width) * 2 - 1,
    y: -((clientY - bounds.top) / bounds.height) * 2 + 1,
  }
}

export function projectNdcToWorldAimDirection(
  ndc: NormalizedDeviceCoordinates,
  camera: Camera,
  playerPosition: Vector3Value,
  raycaster: Raycaster = new Raycaster(),
  pointer: Vector2 = new Vector2(),
  intersection: Vector3 = new Vector3(),
): PlayerAimDirection | null {
  pointer.set(ndc.x, ndc.y)
  camera.updateMatrixWorld(true)
  raycaster.setFromCamera(pointer, camera)
  if (raycaster.ray.intersectPlane(GAMEPLAY_PLANE, intersection) === null) {
    return null
  }
  return worldAimPointToDirection(playerPosition, intersection)
}

export function createPointerWorldAimResolver(
  surface: HTMLElement,
  camera: Camera,
  playerPosition: () => Vector3Value,
): AimDirectionResolver {
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const intersection = new Vector3()

  return (clientX, clientY): PlayerAimDirection | null => {
    const bounds = surface.getBoundingClientRect()
    const ndc = pointerClientToNdc(clientX, clientY, bounds)
    if (ndc === null) return null
    return projectNdcToWorldAimDirection(
      ndc,
      camera,
      playerPosition(),
      raycaster,
      pointer,
      intersection,
    )
  }
}
