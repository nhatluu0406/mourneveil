import type { SkillId } from '../game/skills/skillDefinition'

export function SkillGlyph({ id }: { readonly id: SkillId | 'empty' }) {
  if (id === 'skill.veil-step') {
    return (
      <svg className="skill-glyph skill-glyph--veil-step" viewBox="0 0 48 48" aria-hidden="true">
        <path className="skill-glyph__mass" d="m6 29 13-20 3 13 20-10-13 18-3-10Z" />
        <path d="m10 37 12-15m4-2 12-8M17 40l9-12" />
        <path className="skill-glyph__accent" d="m18 9 4 13 4-2-7 18" />
      </svg>
    )
  }
  if (id === 'skill.oath-cleave') {
    return (
      <svg className="skill-glyph skill-glyph--oath-cleave" viewBox="0 0 48 48" aria-hidden="true">
        <path className="skill-glyph__mass" d="m29 5 8 5-15 25-8 7 2-10Z" />
        <path d="m10 35 23-23M12 29l8 8m-3-15 8 8" />
        <path className="skill-glyph__accent" d="M6 39c12-1 24-6 35-18-6 14-18 22-35 22Z" />
      </svg>
    )
  }
  if (id === 'skill.ward-pulse') {
    return (
      <svg className="skill-glyph skill-glyph--ward-pulse" viewBox="0 0 48 48" aria-hidden="true">
        <path className="skill-glyph__mass" d="m24 5 14 8-2 19-12 11-12-11-2-19Z" />
        <path d="m24 11 7 6-2 13-5 6-5-6-2-13Zm-14 9H5m38 0h-5M24 5V1" />
        <path className="skill-glyph__accent" d="m24 15 4 6-4 10-4-10Z" />
      </svg>
    )
  }
  return (
    <svg className="skill-glyph skill-glyph--empty" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="12" />
      <path d="M24 16v16M16 24h16" />
    </svg>
  )
}
