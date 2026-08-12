import type { SkillId } from '../game/skills/skillDefinition'

export function SkillGlyph({ id }: { readonly id: SkillId | 'empty' }) {
  if (id === 'skill.veil-step') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 30c8-14 12-18 32-16-10 3-14 8-16 14-7-2-12-1-16 2Z" />
        <path d="m14 22 10-8 10 8" />
        <path d="M24 14v18" />
      </svg>
    )
  }
  if (id === 'skill.oath-cleave') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m30 6 8 5-18 28-8 4 3-9Z" />
        <path d="M10 34h18M14 28l8-14" />
      </svg>
    )
  }
  if (id === 'skill.ward-pulse') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m24 6 14 6v12c0 9-5 14-14 18-9-4-14-9-14-18V12Z" />
        <circle cx="24" cy="22" r="7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="12" />
      <path d="M24 16v16M16 24h16" />
    </svg>
  )
}
