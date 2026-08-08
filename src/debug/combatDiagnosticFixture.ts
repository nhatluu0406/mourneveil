import { defineCombatAction } from '../game/combat/combatAction'

export const COMBAT_DIAGNOSTIC_ACTION_ID = 'debug.combat-proof' as const

export const COMBAT_DIAGNOSTIC_ACTION = defineCombatAction({
  id: COMBAT_DIAGNOSTIC_ACTION_ID,
  startupSteps: 30,
  activeSteps: 30,
  recoverySteps: 60,
  resourceCost: null,
  cancellationPolicy: 'recovery-only',
  interruptibilityPolicy: 'always',
  contactWindowId: 'debug.contact-window',
  cooldownSteps: 0,
})
