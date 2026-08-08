import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three'
import type { Vector3Value } from '../game/character/playerMotor'
import { worldAimPointToDirection, type PlayerAimDirection } from '../input/playerAimIntent'
import type { AimDirectionResolver } from '../input/browserAttackInput'

const GAMEPLAY_PLANE = new Plane(new Vector3(0, 1, 0), 0)

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
    if (bounds.width <= 0 || bounds.height <= 0) return null

    pointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)
    if (raycaster.ray.intersectPlane(GAMEPLAY_PLANE, intersection) === null) {
      return null
    }

    return worldAimPointToDirection(playerPosition(), intersection)
  }
}
