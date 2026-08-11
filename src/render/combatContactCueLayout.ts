/** Layout for DEV/active contact volume cues (presentation only). */
export interface CombatContactCueLayout {
  readonly localY: number
  readonly forwardOffset: number
  readonly radius: number
}

/**
 * Ground-safe contact volume presentation layout.
 * Full spheres lose lower arcs to opaque floor depth under the isometric camera.
 */
export function combatContactCueLayout(
  forwardOffset: number,
  radius: number,
): CombatContactCueLayout {
  if (!Number.isFinite(forwardOffset) || forwardOffset <= 0) {
    throw new RangeError('contact cue forwardOffset must be a positive finite number')
  }
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('contact cue radius must be a positive finite number')
  }
  return Object.freeze({
    localY: 0.18,
    forwardOffset,
    radius,
  })
}
