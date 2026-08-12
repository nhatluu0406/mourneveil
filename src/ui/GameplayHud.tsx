import { useEffect, useState } from 'react'
import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { resolvePlayerOutgoingHitConfirm } from '../render/playerCombatFeedback'
import {
  equippedCharmLabel,
  equippedWeaponLabel,
  resolveGameplayInteractionPrompt,
  resolveEquipmentBar,
  resolveNearestThreat,
  resolveZoneHudCopy,
  threatSubtitle,
  threatTitle,
} from './gameplayHudModel'
import { UI_COMPACT_HINTS } from './uiTheme'
import { ItemGlyph } from './ItemGlyph'

interface GameplayHudProps {
  readonly snapshot: GameRuntimeSnapshot
}

function ZonePresentation({ zone }: { readonly zone: ReturnType<typeof resolveZoneHudCopy> }) {
  const [expanded, setExpanded] = useState(true)
  useEffect(() => {
    const timeout = window.setTimeout(() => setExpanded(false), 3200)
    return () => window.clearTimeout(timeout)
  }, [])
  return (
    <>
      <header className={`gameplay-hud__location${expanded ? ' is-expanded' : ' is-compact'}`} aria-label="Current location" data-zone-presentation={expanded ? 'expanded' : 'compact'}>
        <p>{zone.eyebrow}</p><h1>{zone.title}</h1>
        {expanded ? <span>Ruined ossuary · veil passage</span> : null}
      </header>
      <aside className={`gameplay-hud__objective${expanded ? ' is-expanded' : ' is-compact'}`} aria-label="Current objective" data-objective-presentation={expanded ? 'expanded' : 'compact'}>
        <span>Rite I / III</span><strong>{zone.title}</strong>
        {expanded ? <p>{zone.objective}</p> : null}
      </aside>
    </>
  )
}

export function GameplayHud({ snapshot }: GameplayHudProps) {
  const health = snapshot.playerHealth.health
  const ratio = health.maximum <= 0 ? 0 : health.current / health.maximum
  const prompt = resolveGameplayInteractionPrompt(snapshot)
  const weapon = equippedWeaponLabel(snapshot)
  const charm = equippedCharmLabel(snapshot)
  const zone = resolveZoneHudCopy(snapshot.world.currentZoneId)
  const equipmentBar = resolveEquipmentBar(snapshot)
  const damagedRecently =
    snapshot.incomingContact.lastHit !== null &&
    snapshot.incomingContact.lastHit.outcome === 'damaged' &&
    snapshot.simulation.stepCount - snapshot.incomingContact.lastHit.simulationStep < 45
  const recentIncoming = snapshot.incomingContact.lastHit
  const guardFeedback = snapshot.defense.guardBroken
    ? 'Guard Broken'
    : recentIncoming !== null &&
        (recentIncoming.outcome === 'guarded' || recentIncoming.outcome === 'guard-broken') &&
        snapshot.simulation.stepCount - recentIncoming.simulationStep < 45
      ? `Blocked · Impact ${snapshot.defense.guardImpact}/${snapshot.defense.guardImpactThreshold}`
      : null
  const outgoingConfirm = resolvePlayerOutgoingHitConfirm({
    lastHit: snapshot.contact.lastHit,
    enemies: snapshot.enemies,
    simulationStep: snapshot.simulation.stepCount,
  })
  const hitConfirmLabel =
    outgoingConfirm.kind === 'defeat'
      ? 'Enemy Defeated'
      : outgoingConfirm.kind === 'interrupt'
        ? 'Interrupted'
        : outgoingConfirm.kind === 'heavy'
          ? 'Heavy Hit'
          : outgoingConfirm.kind === 'light'
            ? 'Hit'
            : null

  const threat = resolveNearestThreat(snapshot)
  const threatRatio =
    threat === null || threat.health.maximum <= 0 ? 0 : threat.health.current / threat.health.maximum
  const resolveRatio = snapshot.defense.guardBroken
    ? 0
    : Math.max(0, 1 - snapshot.defense.guardImpact / Math.max(1, snapshot.defense.guardImpactThreshold))
  const power = Math.max(snapshot.resolvedAttackDamage.light, snapshot.resolvedAttackDamage.heavy)

  return (
    <div
      className={`gameplay-hud${damagedRecently ? ' gameplay-hud--hit' : ''}`}
      aria-label="Gameplay HUD"
      data-product-hud="1"
    >
      <ZonePresentation key={snapshot.world.currentZoneId ?? 'between'} zone={zone} />

      {threat !== null ? (
        <section className="gameplay-hud__threat" aria-label="Nearest threat">
          <div className="gameplay-hud__threat-heading">
            <strong>{threatTitle(threat.definitionId)}</strong>
            <span>{threatSubtitle(threat.definitionId)}</span>
          </div>
          <div
            className="gameplay-hud__threat-track"
            role="meter"
            aria-valuenow={threat.health.current}
            aria-valuemin={0}
            aria-valuemax={threat.health.maximum}
          >
            <div
              className="gameplay-hud__threat-fill"
              style={{ width: `${Math.max(0, Math.min(1, threatRatio)) * 100}%` }}
            />
          </div>
        </section>
      ) : null}

      <section className="gameplay-hud__status" aria-label="Player status">
        <div className="gameplay-hud__identity">
          <div>
            <strong>Oathward</strong>
            <span>The held line · Veilbound Warden</span>
          </div>
          <div className="gameplay-hud__identity-gear"><span>{weapon}</span><small>{charm ?? 'No charm'}</small></div>
        </div>

        <div
          className="gameplay-hud__hp"
          role="meter"
          aria-valuenow={health.current}
          aria-valuemin={0}
          aria-valuemax={health.maximum}
          aria-label="Health"
        >
          <div className="gameplay-hud__vital-label">
            <span>Vitality</span>
            <strong className="gameplay-hud__hp-text">
              {health.current}
              <span className="gameplay-hud__hp-max">/{health.maximum}</span>
            </strong>
          </div>
          <div className="gameplay-hud__hp-track">
            <div
              className="gameplay-hud__hp-fill"
              style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
            />
          </div>
        </div>

        <div className="gameplay-hud__resolve">
          <div className="gameplay-hud__vital-label">
            <span>Resolve</span>
            <strong>{snapshot.defense.guardBroken ? 'BROKEN' : 'READY'}</strong>
          </div>
          <div className="gameplay-hud__resolve-track">
            <div className="gameplay-hud__resolve-fill" style={{ width: `${resolveRatio * 100}%` }} />
          </div>
        </div>

        <div className="gameplay-hud__stats">
          <div>
            <span>Power</span>
            <strong>{power}</strong>
          </div>
          <div>
            <span>Guard</span>
            <strong>
              {snapshot.defense.guardImpact}/{snapshot.defense.guardImpactThreshold}
            </strong>
          </div>
          <div>
            <span>Echoes</span>
            <strong>{snapshot.echoes.carried}</strong>
          </div>
        </div>
      </section>

      <div className="gameplay-hud__center">
        {prompt !== null ? <div className="gameplay-hud__prompt"><kbd>{prompt.split(' — ')[0]}</kbd><strong>{prompt.split(' — ')[1]}</strong></div> : null}
        {guardFeedback !== null ? (
          <div
            className={`gameplay-hud__guard-feedback${snapshot.defense.guardBroken ? ' is-broken' : ''}`}
            role="status"
          >
            {guardFeedback}
          </div>
        ) : null}
        {hitConfirmLabel !== null && guardFeedback === null ? (
          <div className="gameplay-hud__guard-feedback" role="status">
            {hitConfirmLabel}
          </div>
        ) : null}
        {!health.alive ? <div className="gameplay-hud__death">Fallen</div> : null}

        <ul className="gameplay-hud__equipment-bar" aria-label="Equipped items and resources">
          {equipmentBar.map((slot) => (
            <li key={slot.id} className={`gameplay-hud__equipment-slot${slot.equipped ? ' is-equipped' : ' is-empty'}`} data-slot-id={slot.id}>
              <span className={`gameplay-hud__item-glyph gameplay-hud__item-glyph--${slot.icon}`}><ItemGlyph icon={slot.icon} /></span>
              <span className="gameplay-hud__item-copy"><strong>{slot.label}</strong><small>{slot.detail}</small></span>
              {slot.binding === null ? null : <kbd>{slot.binding}</kbd>}
            </li>
          ))}
        </ul>
        <ul className="gameplay-hud__control-hints" aria-label="Control hints">
          {UI_COMPACT_HINTS.map((hint) => <li key={hint.id}><kbd>{hint.binding}</kbd><span>{hint.label}</span></li>)}
        </ul>
      </div>
    </div>
  )
}
