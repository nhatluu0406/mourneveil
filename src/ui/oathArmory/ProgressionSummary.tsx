import type { GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import { ProgressionGlyph } from '../ProgressionGlyph'

interface ProgressionSummaryProps {
  readonly snapshot: GameRuntimeSnapshot
}

export function ProgressionSummary({ snapshot }: ProgressionSummaryProps) {
  const { progression } = snapshot
  const xpTotal = progression.experienceIntoLevel + (progression.experienceToNextLevel ?? 0)
  const xpRatio = progression.atMaxLevel ? 1 : xpTotal <= 0 ? 0 : progression.experienceIntoLevel / xpTotal
  return (
    <section className="progression-summary" data-progression-panel="1">
      <div className="progression-summary__level">
        <ProgressionGlyph id="level" />
        <span>Level</span>
        <strong>{progression.level}</strong>
      </div>
      <div className="progression-summary__xp">
        <div>
          <span>Veil experience</span>
          <strong>{progression.atMaxLevel ? 'Mastered' : `${progression.experienceIntoLevel} / ${xpTotal}`}</strong>
        </div>
        <div className="progression-summary__track">
          <span style={{ width: `${Math.max(0, Math.min(1, xpRatio)) * 100}%` }} />
        </div>
      </div>
      <div className={`progression-summary__points${progression.unspentPoints > 0 ? ' has-points' : ''}`}>
        <ProgressionGlyph id="point" />
        <span>Unspent</span>
        <strong>{progression.unspentPoints}</strong>
      </div>
    </section>
  )
}
