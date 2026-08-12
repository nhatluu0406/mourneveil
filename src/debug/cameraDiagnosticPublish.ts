import type { CameraDiagnostic } from '../render/followCamera'

let latest: CameraDiagnostic | null = null

export function publishCameraDiagnostic(snapshot: CameraDiagnostic): void {
  latest = snapshot
}

export function readCameraDiagnostic(): CameraDiagnostic | null {
  return latest
}
