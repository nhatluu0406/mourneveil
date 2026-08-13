export type LocomotionGaitMode = 'idle' | 'start-step' | 'walk' | 'stop'

export interface PlayerLocomotionPresentation {
  readonly gaitPhase: number
  readonly gaitAmplitude: number
  readonly planarSpeed: number
  readonly mode: LocomotionGaitMode
  readonly grounded: boolean
  readonly yawRadians: number
}

export interface PlayerLocomotionTickInput {
  readonly positionX: number
  readonly positionZ: number
  readonly facingX: number
  readonly facingZ: number
  readonly deltaSeconds: number
  readonly grounded: boolean
  readonly committedAttack: boolean
  readonly currentYawRadians: number
}

const STRIDE_LENGTH_METERS = 1.22
const IDLE_SPEED = 0.12
const WALK_SPEED = 0.55
const START_DURATION = 0.22
const STOP_DURATION = 0.18
const YAW_DAMP = 9
const AMPLITUDE_DAMP = 8

let previousX = 0
let previousZ = 0
let hasPrevious = false
let gaitPhase = 0
let gaitAmplitude = 0
let mode: LocomotionGaitMode = 'idle'
let modeAge = 0
let yawRadians = 0
let hasYaw = false
let lastPresentation: PlayerLocomotionPresentation = {
  gaitPhase: 0,
  gaitAmplitude: 0,
  planarSpeed: 0,
  mode: 'idle',
  grounded: true,
  yawRadians: 0,
}

export function resetPlayerLocomotionPresentation(): void {
  previousX = 0
  previousZ = 0
  hasPrevious = false
  gaitPhase = 0
  gaitAmplitude = 0
  mode = 'idle'
  modeAge = 0
  yawRadians = 0
  hasYaw = false
  lastPresentation = {
    gaitPhase: 0,
    gaitAmplitude: 0,
    planarSpeed: 0,
    mode: 'idle',
    grounded: true,
    yawRadians: 0,
  }
}

export function tickPlayerLocomotionPresentation(
  input: PlayerLocomotionTickInput,
): PlayerLocomotionPresentation {
  const rawDistance = hasPrevious
    ? Math.hypot(input.positionX - previousX, input.positionZ - previousZ)
    : 0
  const teleported = rawDistance > 3
  if (teleported) {
    gaitPhase = 0
    gaitAmplitude = 0
    mode = 'idle'
    modeAge = 0
  }
  const distance = teleported ? 0 : rawDistance
  previousX = input.positionX
  previousZ = input.positionZ
  hasPrevious = true

  const dt = Math.max(0, Math.min(0.08, input.deltaSeconds))
  const planarSpeed = dt > 1e-5 ? distance / dt : 0
  const moving = input.grounded && planarSpeed > IDLE_SPEED

  if (!input.grounded || planarSpeed <= IDLE_SPEED * 0.35) {
    if (mode === 'walk' || mode === 'start-step') {
      mode = 'stop'
      modeAge = 0
    } else if (mode === 'stop') {
      modeAge += dt
      if (modeAge >= STOP_DURATION) mode = 'idle'
    }
  } else if (moving) {
    if (mode === 'idle' || mode === 'stop') {
      mode = 'start-step'
      modeAge = 0
    } else if (mode === 'start-step') {
      modeAge += dt
      if (modeAge >= START_DURATION && planarSpeed >= WALK_SPEED) mode = 'walk'
    }
  }

  const targetAmplitude =
    mode === 'idle' ? 0 : mode === 'start-step' ? 0.45 : mode === 'stop' ? 0.22 : 1
  const ampBlend = 1 - Math.exp(-AMPLITUDE_DAMP * dt)
  gaitAmplitude += (targetAmplitude - gaitAmplitude) * ampBlend

  if (moving && gaitAmplitude > 0.04) {
    gaitPhase += (distance / STRIDE_LENGTH_METERS) * Math.PI * 2
    if (gaitPhase > Math.PI * 2) gaitPhase -= Math.PI * 2
  }

  const targetYaw = Math.atan2(-input.facingX, -input.facingZ)
  if (!hasYaw || input.committedAttack) {
    yawRadians = input.committedAttack ? targetYaw : (hasYaw ? yawRadians : input.currentYawRadians)
    if (input.committedAttack) yawRadians = targetYaw
    hasYaw = true
  } else {
    yawRadians = dampAngle(yawRadians, targetYaw, YAW_DAMP, dt)
  }

  lastPresentation = {
    gaitPhase,
    gaitAmplitude,
    planarSpeed,
    mode,
    grounded: input.grounded,
    yawRadians,
  }
  return lastPresentation
}

export function readPlayerLocomotionPresentation(): PlayerLocomotionPresentation {
  return lastPresentation
}

/** Stance half of the gait damps swing so the planted foot does not skate. */
export function plantedFootSwing(gaitPhaseRadians: number, amplitude: number): {
  readonly left: number
  readonly right: number
  readonly pelvisY: number
} {
  const swing = Math.sin(gaitPhaseRadians)
  const leftSwingScale = swing >= 0 ? 1 : 0.18
  const rightSwingScale = swing < 0 ? 1 : 0.18
  return {
    left: swing * amplitude * leftSwingScale,
    right: -swing * amplitude * rightSwingScale,
    pelvisY: Math.abs(swing) * amplitude * 0.012,
  }
}



function dampAngle(current: number, target: number, damping: number, dt: number): number {
  const delta = wrapAngle(target - current)
  const blend = 1 - Math.exp(-damping * dt)
  return current + delta * blend
}

function wrapAngle(radians: number): number {
  let value = radians
  while (value > Math.PI) value -= Math.PI * 2
  while (value < -Math.PI) value += Math.PI * 2
  return value
}
