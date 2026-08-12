import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { MOURNEVEIL_CONNECTED_LEVEL, type MourneveilZoneId } from '../game/world/connectedLevel'
import { resolvePlayerOutgoingHitConfirm } from '../render/playerCombatFeedback'
import {
  equippedCharmLabel,
  equippedWeaponLabel,
  resolveGameplayInteractionPrompt,
} from './gameplayHudModel'
import { UI_COMMANDS } from './uiTheme'

interface GameplayHudProps {
  readonly snapshot: GameRuntimeSnapshot
}

const ZONE_COPY: Readonly<Record<MourneveilZoneId, { eyebrow: string; title: string; objective: string }>> = Object.freeze({
  'zone.arrival': {
    eyebrow: 'The Mourneveil · Rite I',
    title: 'Ashen Threshold',
    objective: 'Cross the dead approach and find the first breach.',
  },
  'zone.first-combat': {
    eyebrow: 'Outer Watch · Rite I',
    title: 'The Unburied Watch',
    objective: 'Break the sentries and follow the veil-lit corridor.',
  },
  'zone.checkpoint': {
    eyebrow: 'Refuge · Rite I',
    title: 'Reliquary of the Veil',
    objective: 'Rest at the reliquary. The path bends beyond the ossuary ribs.',
  },
  'zone.mixed-combat': {
    eyebrow: 'Sunken Court · Rite I',
    title: 'Court of Quiet Names',
    objective: 'Clear the court and open the route toward the final approach.',
  },
  'zone.final-approach': {
    eyebrow: 'Final Approach · Rite I',
    title: 'Ash Walk',
    objective: 'Reach the sealed gate and survive the last watch.',
  },
  'zone.final-arena': {
    eyebrow: 'Final Arena · Rite I',
    title: 'The Veilbound Sepulchre',
    objective: 'End the rite. Leave no watcher standing.',
  },
})

function resolveZoneCopy(zoneId: MourneveilZoneId | null) {
  if (zoneId !== null) return ZONE_COPY[zoneId]
  return {
    eyebrow: 'Mourneveil · Rite I',
    title: 'Between Reliquaries',
    objective: 'Find the next veil-lit path.',
  }
}

function threatTitle(definitionId: string): string {
  return definitionId.includes('brute') ? 'OSSUARY BULWARK' : 'VEIL-RIVEN STALKER'
}

function threatSubtitle(definitionId: string): string {
  return definitionId.includes('brute') ? 'THE IRON DEAD · UNYIELDING' : 'THE UNBURIED · HUNTING'
}

export function GameplayHud({ snapshot }: GameplayHudProps) {
  const health = snapshot.playerHealth.health
  const ratio = health.maximum <= 0 ? 0 : health.current / health.maximum
  const prompt = resolveGameplayInteractionPrompt(snapshot)
  const weapon = equippedWeaponLabel(snapshot)
  const charm = equippedCharmLabel(snapshot)
  const zone = resolveZoneCopy(snapshot.world.currentZoneId)
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

  const nearestThreat = snapshot.enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => ({
      enemy,
      distance: Math.hypot(
        enemy.position.x - snapshot.player.position.x,
        enemy.position.z - snapshot.player.position.z,
      ),
    }))
    .sort((left, right) => left.distance - right.distance)[0] ?? null
  const threat = nearestThreat !== null && nearestThreat.distance <= 7.5 ? nearestThreat.enemy : null
  const threatRatio = threat === null || threat.health.maximum <= 0 ? 0 : threat.health.current / threat.health.maximum
  const resolveRatio = snapshot.defense.guardBroken
    ? 0
    : Math.max(0, 1 - snapshot.defense.guardImpact / Math.max(1, snapshot.defense.guardImpactThreshold))
  const power = Math.max(snapshot.resolvedAttackDamage.light, snapshot.resolvedAttackDamage.heavy)

  return (
    <div
      className={`gameplay-hud${damagedRecently ? ' gameplay-hud--hit' : ''}`}
      aria-label="Gameplay HUD"
    >
      <header className="gameplay-hud__location" aria-label="Current location">
        <p>{zone.eyebrow}</p>
        <h1>{zone.title}</h1>
        <span>Interconnected ossuary · local vertical slice</span>
      </header>

      {threat !== null ? (
        <section className="gameplay-hud__threat" aria-label="Nearest threat">
          <div className="gameplay-hud__threat-heading">
            <strong>{threatTitle(threat.definitionId)}</strong>
            <span>{threatSubtitle(threat.definitionId)}</span>
          </div>
          <div className="gameplay-hud__threat-track" role="meter" aria-valuenow={threat.health.current} aria-valuemin={0} aria-valuemax={threat.health.maximum}>
            <div className="gameplay-hud__threat-fill" style={{ width: `${Math.max(0, Math.min(1, threatRatio)) * 100}%` }} />
          </div>
        </section>
      ) : null}

      <aside className="gameplay-hud__objective" aria-label="Current objective">
        <span>Rite I / III</span>
        <strong>{zone.title}</strong>
        <p>{zone.objective}</p>
      </aside>

      <section className="gameplay-hud__status" aria-label="Player status">
        <div className="gameplay-hud__identity">
          <div>
            <strong>Oathward</strong>
            <span>The held line · Veilbound Warden</span>
          </div>
          <div className="gameplay-hud__identity-gear">
            <span>{weapon}</span>
            <small>{charm ?? 'No charm'}</small>
          </div>
        </div>

        <div
          className="gameplay-hud__hp"
          role="meter"
          aria-valuenow={health.current}
          aria-valuemin={0}
          aria-valuemax={health.maximum}
          aria-label="Health"
        >
          <div className="gameplay-hud__vital-label"><span>Vitality</span><strong className="gameplay-hud__hp-text">{health.current}<span className="gameplay-hud__hp-max">/{health.maximum}</span></strong></div>
          <div className="gameplay-hud__hp-track">
            <div className="gameplay-hud__hp-fill" style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }} />
          </div>
        </div>

        <div className="gameplay-hud__resolve">
          <div className="gameplay-hud__vital-label"><span>Resolve</span><strong>{snapshot.defense.guardBroken ? 'BROKEN' : 'READY'}</strong></div>
          <div className="gameplay-hud__resolve-track"><div className="gameplay-hud__resolve-fill" style={{ width: `${resolveRatio * 100}%` }} /></div>
        </div>

        <div className="gameplay-hud__stats">
          <div><span>Power</span><strong>{power}</strong></div>
          <div><span>Guard</span><strong>{snapshot.defense.guardImpact}/{snapshot.defense.guardImpactThreshold}</strong></div>
          <div><span>Echoes</span><strong>{snapshot.echoes.carried}</strong></div>
        </div>
      </section>

      <aside className="gameplay-hud__resource" aria-label="Echoes">
        <span className="gameplay-hud__resource-glyph">◇</span>
        <div><strong>{snapshot.echoes.carried}</strong><small>Echoes · Veil residue</small></div>
      </aside>

      <div className="gameplay-hud__center">
        {prompt !== null ? <div className="gameplay-hud__prompt">{prompt}</div> : null}
        {guardFeedback !== null ? (
          <div className={`gameplay-hud__guard-feedback${snapshot.defense.guardBroken ? ' is-broken' : ''}`} role="status">
            {guardFeedback}
          </div>
        ) : null}
        {hitConfirmLabel !== null && guardFeedback === null ? <div className="gameplay-hud__guard-feedback" role="status">{hitConfirmLabel}</div> : null}
        {!health.alive ? <div className="gameplay-hud__death">Fallen</div> : null}

        <ul className="gameplay-hud__commands" aria-label="Controls">
          {UI_COMMANDS.map((command, index) => (
            <li key={command.id} className={`gameplay-hud__command gameplay-hud__command--${command.id}`}>
              <span className="gameplay-hud__command-index">{index + 1}</span>
              <kbd>{command.binding}</kbd>
              <strong>{command.label}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="gameplay-hud__flasks" aria-label="Flask charges">
        {Array.from({ length: snapshot.flask.maximumCharges }, (_, index) => (
          <span key={index} className={`gameplay-hud__flask${index < snapshot.flask.currentCharges ? ' is-filled' : ''}`} title="Flask" />
        ))}
      </div>
    </div>
  )
}
