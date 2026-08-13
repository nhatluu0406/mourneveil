import type { GameRuntimeIntegrationSnapshot } from '../app/useGameRuntime'

export const DEVELOPMENT_MILESTONE = 'M15 Presentation' as const
export const DEVELOPMENT_MILESTONE_STEP = 'M15.2' as const
export const WORKING_TITLE = 'Mourneveil' as const

export interface DevelopmentDiagnostic {
  readonly workingTitle: typeof WORKING_TITLE
  readonly milestone: typeof DEVELOPMENT_MILESTONE
  readonly rendererReady: boolean
  readonly physicsReady: boolean
  readonly runtimeReady: boolean
  readonly runtime: GameRuntimeIntegrationSnapshot
}

export function createDevelopmentDiagnostic(
  rendererReady: boolean,
  physicsReady: boolean,
  runtime: GameRuntimeIntegrationSnapshot,
): DevelopmentDiagnostic {
  return {
    workingTitle: WORKING_TITLE,
    milestone: DEVELOPMENT_MILESTONE,
    rendererReady,
    physicsReady,
    runtimeReady: rendererReady && physicsReady,
    runtime,
  }
}
