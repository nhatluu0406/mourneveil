import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three'
import type { Vector3Value } from '../game/character/playerMotor'
import { worldAimPointToDirection, type PlayerAimDirection } from '../input/playerAimIntent'
import type { AimDirectionResolver } from '../input/browserAttackInput'

const GAMEPLAY_PLANE_NORMAL = new Vector3(0, 1, 0)
const raycasterScratch = new Raycaster()
const pointerScratch = new Vector2()
const intersectionScratch = new Vector3()
const planeScratch = new Plane()

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

export interface PointerAimProjection {
  readonly ndc: NormalizedDeviceCoordinates
  readonly worldPoint: Vector3Value
  readonly aimDirection: PlayerAimDirection
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

/**
 * Project pointer NDC onto the horizontal gameplay plane at the player's
 * authoritative height so aim matches the visible character footing.
 */
export function projectNdcToWorldAimDirection(
  ndc: NormalizedDeviceCoordinates,
  camera: Camera,
  playerPosition: Vector3Value,
  raycaster: Raycaster = raycasterScratch,
  pointer: Vector2 = pointerScratch,
  intersection: Vector3 = intersectionScratch,
): PlayerAimDirection | null {
  const projection = projectNdcToGameplayAim(
    ndc,
    camera,
    playerPosition,
    raycaster,
    pointer,
    intersection,
  )
  return projection?.aimDirection ?? null
}

export function projectNdcToGameplayAim(
  ndc: NormalizedDeviceCoordinates,
  camera: Camera,
  playerPosition: Vector3Value,
  raycaster: Raycaster = raycasterScratch,
  pointer: Vector2 = pointerScratch,
  intersection: Vector3 = intersectionScratch,
): PointerAimProjection | null {
  pointer.set(ndc.x, ndc.y)
  if ('updateProjectionMatrix' in camera && typeof camera.updateProjectionMatrix === 'function') {
    camera.updateProjectionMatrix()
  }
  camera.updateMatrixWorld(true)
  raycaster.setFromCamera(pointer, camera)
  // Plane: y = playerPosition.y  →  normal·p + constant = 0 with constant = -y
  planeScratch.set(GAMEPLAY_PLANE_NORMAL, -playerPosition.y)
  if (raycaster.ray.intersectPlane(planeScratch, intersection) === null) {
    return null
  }
  const worldPoint = {
    x: intersection.x,
    y: intersection.y,
    z: intersection.z,
  }
  const aimDirection = worldAimPointToDirection(playerPosition, worldPoint)
  if (aimDirection === null) return null
  return { ndc, worldPoint, aimDirection }
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
