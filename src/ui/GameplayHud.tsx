import { useEffect, useRef, useState } from 'react'
import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { resolvePlayerOutgoingHitConfirm } from '../render/playerCombatFeedback'
import {
  equippedCharmLabel,
  equippedWeaponLabel,
  isBossThreat,
  isVerticalSliceComplete,
  resolveAcquisitionToast,
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

function ZonePresentation({
  zone,
  presentationKey,
}: {
  readonly zone: ReturnType<typeof resolveZoneHudCopy>
  readonly presentationKey: string
}) {
  const [expanded, setExpanded] = useState(true)
  useEffect(() => {
    const timeout = window.setTimeout(() => setExpanded(false), 3200)
    return () => window.clearTimeout(timeout)
  }, [presentationKey])
  return (
    <>
      <header className={`gameplay-hud__location${expanded ? ' is-expanded' : ' is-compact'}`} aria-label="Current location" data-zone-presentation={expanded ? 'expanded' : 'compact'}>
        <p>{zone.eyebrow}</p><h1>{zone.title}</h1>
        {expanded ? <span>Ruined ossuary · veil passage</span> : null}
      </header>
      <aside className={`gameplay-hud__objective${expanded ? ' is-expanded' : ' is-compact'}`} aria-label="Current objective" data-objective-presentation={expanded ? 'expanded' : 'compact'}>
        <span>Current rite</span><strong>{expanded ? 'Objective' : zone.objective}</strong>
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
  const sliceComplete = isVerticalSliceComplete(snapshot)
  const zone = resolveZoneHudCopy(snapshot.world.currentZoneId, snapshot)
  const equipmentBar = resolveEquipmentBar(snapshot)
  const acquisition = resolveAcquisitionToast(snapshot)
  const [toastStep, setToastStep] = useState<number | null>(null)
  const seenAcquisition = useRef<number | null>(null)
  useEffect(() => {
    const step = snapshot.lastLootAcquisition?.simulationStep ?? null
    if (step === null || step === seenAcquisition.current) return
    seenAcquisition.current = step
    setToastStep(step)
    const timeout = window.setTimeout(() => setToastStep((current) => (current === step ? null : current)), 4200)
    return () => window.clearTimeout(timeout)
  }, [snapshot.lastLootAcquisition?.simulationStep])
  const showAcquisitionToast =
    toastStep !== null &&
    acquisition !== null &&
    snapshot.lastLootAcquisition?.simulationStep === toastStep
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
  const bossThreat = threat !== null && isBossThreat(threat.definitionId)
  const bossPhase = bossThreat && threat !== null && threatRatio <= 0.5 ? 2 : 1
  const zoneKey = sliceComplete
    ? 'slice-complete'
    : (snapshot.world.currentZoneId ?? 'between')

  return (
    <div
      className={`gameplay-hud${damagedRecently ? ' gameplay-hud--hit' : ''}`}
      aria-label="Gameplay HUD"
      data-product-hud="1"
      data-slice-complete={sliceComplete ? '1' : '0'}
    >
      {bossThreat ? null : <ZonePresentation key={zoneKey} presentationKey={zoneKey} zone={zone} />}

      {threat !== null ? (
        <section className={`gameplay-hud__threat${bossThreat ? ' gameplay-hud__threat--boss' : ''}`} aria-label={bossThreat ? 'Boss threat' : 'Nearest threat'}>
          <div className="gameplay-hud__threat-heading">
            <strong>{threatTitle(threat.definitionId)}</strong>
            <span>{threatSubtitle(threat.definitionId)}{bossThreat ? ` · PHASE ${bossPhase}` : ''}</span>
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
          <div><strong>WARDEN</strong></div>
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

        <div className="gameplay-hud__status-line"><span>Power {power}</span><span>Guard {snapshot.defense.guardImpact}/{snapshot.defense.guardImpactThreshold}</span></div>
      </section>

      <div className="gameplay-hud__center">
        {prompt !== null ? <div className="gameplay-hud__prompt"><kbd>{prompt.split(' — ')[0]}</kbd><strong>{prompt.split(' — ')[1]}</strong></div> : null}
        {showAcquisitionToast && acquisition !== null ? (
          <div className="gameplay-hud__acquisition" role="status" data-acquisition-toast="1">
            <strong>{acquisition.title}</strong>
            <span>{acquisition.detail}</span>
          </div>
        ) : null}
        {sliceComplete && !bossThreat ? (
          <div className="gameplay-hud__slice-complete" role="status" data-slice-complete-banner="1">
            Rite complete
          </div>
        ) : null}
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
