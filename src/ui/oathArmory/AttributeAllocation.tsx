import type { GameRuntime, GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import type { ProgressionAttributeId } from '../../game/character/playerProgression'
import { ProgressionGlyph } from '../ProgressionGlyph'

const ATTRIBUTE_COPY: Readonly<Record<ProgressionAttributeId, { readonly title: string; readonly motif: string }>> = {
  vitality: { title: 'Vitality', motif: 'Vessel of the living oath' },
  resolve: { title: 'Resolve', motif: 'Ward against the breaking dark' },
  might: { title: 'Might', motif: 'Weight behind the oathblade' },
}

interface AttributeAllocationProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly runtime: GameRuntime
}

export function AttributeAllocation({ snapshot, runtime }: AttributeAllocationProps) {
  const { progression, playerHealth, defense, resolvedAttackDamage, resolvedProgressionContributions } = snapshot
  const effectCopy: Readonly<Record<ProgressionAttributeId, string>> = {
    vitality: `+${resolvedProgressionContributions.maxHealth} Max HP from allocation`,
    resolve: `+${resolvedProgressionContributions.guardImpactThreshold} Guard Threshold from allocation`,
    might: `+${resolvedProgressionContributions.lightDamage} Light · +${resolvedProgressionContributions.heavyDamage} Heavy from allocation`,
  }
  return (
    <section className="progression-attributes" aria-label="Oath attributes" data-oath-attributes="1">
      <h3>Oath Attributes</h3>
      {(['vitality', 'resolve', 'might'] as const).map((attribute) => (
        <article key={attribute} className={`progression-attribute progression-attribute--${attribute}`} data-attribute={attribute}>
          <span className="progression-attribute__glyph"><ProgressionGlyph id={attribute} /></span>
          <div className="progression-attribute__copy">
            <span>{ATTRIBUTE_COPY[attribute].motif}</span>
            <strong>{ATTRIBUTE_COPY[attribute].title}</strong>
            <small>{effectCopy[attribute]}</small>
          </div>
          <strong className="progression-attribute__rank">{progression.allocation[attribute]}</strong>
          <button
            type="button"
            aria-label={`Allocate point to ${attribute}`}
            disabled={progression.unspentPoints <= 0}
            onClick={() => runtime.allocateProgression(attribute)}
          >
            +
          </button>
        </article>
      ))}
      <div className="progression-resolved">
        <span>Resolved now</span>
        <strong>{playerHealth.health.maximum} HP · {defense.guardImpactThreshold} Guard</strong>
        <small>{resolvedAttackDamage.light} Light · {resolvedAttackDamage.heavy} Heavy</small>
      </div>
    </section>
  )
}
