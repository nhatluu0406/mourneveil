export const MILESTONE = 'M0' as const
export const WORKING_TITLE = 'Mourneveil' as const

export interface FoundationDiagnostic {
  readonly workingTitle: typeof WORKING_TITLE
  readonly milestone: typeof MILESTONE
  readonly rendererReady: boolean
  readonly physicsReady: boolean
  readonly foundationReady: boolean
}

export function createFoundationDiagnostic(
  rendererReady: boolean,
  physicsReady: boolean,
): FoundationDiagnostic {
  return {
    workingTitle: WORKING_TITLE,
    milestone: MILESTONE,
    rendererReady,
    physicsReady,
    foundationReady: rendererReady && physicsReady,
  }
}
