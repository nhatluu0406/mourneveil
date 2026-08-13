/** Simulation-driven gate bars may fade. Ordinary architecture must stay opaque. */
export const ALLOWED_OCCLUSION_FADE_IDS = ['gate.shortcut', 'gate.final'] as const

export type AllowedOcclusionFadeId = (typeof ALLOWED_OCCLUSION_FADE_IDS)[number]

export function isAllowedOcclusionFadeId(id: string): boolean {
  return (ALLOWED_OCCLUSION_FADE_IDS as readonly string[]).includes(id)
}

export function worldObjectAllowsFade(occlusionPolicy: 'fade' | 'solid' | undefined): boolean {
  return occlusionPolicy === 'fade'
}
