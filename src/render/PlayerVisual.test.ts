import { describe, expect, it } from 'vitest'
import {
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
} from '../physics/playerCollisionConfig'
import {
  PLAYER_FACING_MARKER_POSITION,
  PLAYER_FACING_MARKER_SIZE,
} from './playerVisualConfig'

describe('PlayerVisual geometry', () => {
  it('keeps every facing-marker corner inside the physical capsule', () => {
    for (const xSign of [-1, 1]) {
      for (const ySign of [-1, 1]) {
        for (const zSign of [-1, 1]) {
          const point = {
            x:
              PLAYER_FACING_MARKER_POSITION.x +
              (xSign * PLAYER_FACING_MARKER_SIZE.x) / 2,
            y:
              PLAYER_FACING_MARKER_POSITION.y +
              (ySign * PLAYER_FACING_MARKER_SIZE.y) / 2,
            z:
              PLAYER_FACING_MARKER_POSITION.z +
              (zSign * PLAYER_FACING_MARKER_SIZE.z) / 2,
          }
          const closestAxisY = Math.max(
            -PLAYER_CAPSULE_HALF_HEIGHT,
            Math.min(PLAYER_CAPSULE_HALF_HEIGHT, point.y),
          )
          const distanceFromCapsuleAxis = Math.hypot(
            point.x,
            point.y - closestAxisY,
            point.z,
          )

          expect(distanceFromCapsuleAxis).toBeLessThanOrEqual(
            PLAYER_CAPSULE_RADIUS,
          )
        }
      }
    }
  })
})
