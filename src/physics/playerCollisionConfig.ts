export const PLAYER_CAPSULE_HALF_HEIGHT = 0.45
export const PLAYER_CAPSULE_RADIUS = 0.35

export const CHARACTER_COLLISION_OFFSET = 0.02
export const CHARACTER_GROUND_SNAP_DISTANCE = 0.1
export const CHARACTER_MAX_WALKABLE_SLOPE_RADIANS = Math.PI / 4

interface PlayerCharacterController {
  setSlideEnabled(enabled: boolean): void
  enableSnapToGround(distance: number): void
  setMaxSlopeClimbAngle(angle: number): void
  setMinSlopeSlideAngle(angle: number): void
}

export function configureCharacterController(
  controller: PlayerCharacterController,
): void {
  controller.setSlideEnabled(true)
  controller.enableSnapToGround(CHARACTER_GROUND_SNAP_DISTANCE)
  controller.setMaxSlopeClimbAngle(CHARACTER_MAX_WALKABLE_SLOPE_RADIANS)
  controller.setMinSlopeSlideAngle(CHARACTER_MAX_WALKABLE_SLOPE_RADIANS)
}

export const configurePlayerCharacterController = configureCharacterController
