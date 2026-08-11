import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
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

export function GameplayHud({ snapshot }: GameplayHudProps) {
  const health = snapshot.playerHealth.health
  const ratio = health.maximum <= 0 ? 0 : health.current / health.maximum
  const prompt = resolveGameplayInteractionPrompt(snapshot)
  const weapon = equippedWeaponLabel(snapshot)
  const charm = equippedCharmLabel(snapshot)
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

  return (
    <div
      className={`gameplay-hud${damagedRecently ? ' gameplay-hud--hit' : ''}`}
      aria-label="Gameplay HUD"
    >
      <div className="gameplay-hud__status">
        <div
          className="gameplay-hud__hp"
          role="meter"
          aria-valuenow={health.current}
          aria-valuemin={0}
          aria-valuemax={health.maximum}
          aria-label="Health"
        >
          <div className="gameplay-hud__hp-track">
            <div
              className="gameplay-hud__hp-fill"
              style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
            />
          </div>
          <span className="gameplay-hud__hp-text">
            {health.current}
            <span className="gameplay-hud__hp-max">/{health.maximum}</span>
          </span>
        </div>

        <div className="gameplay-hud__flasks" aria-label="Flask charges">
          {Array.from({ length: snapshot.flask.maximumCharges }, (_, index) => (
            <span
              key={index}
              className={`gameplay-hud__flask${index < snapshot.flask.currentCharges ? ' is-filled' : ''}`}
              title="Flask"
            />
          ))}
        </div>

        <div className="gameplay-hud__meta">
          <div className="gameplay-hud__echoes" aria-label="Echoes">
            <span className="gameplay-hud__label">Echoes</span>
            <strong>{snapshot.echoes.carried}</strong>
          </div>
          <div className="gameplay-hud__gear">
            <span className="gameplay-hud__label">Armament</span>
            <strong>{weapon}</strong>
            {charm !== null ? <em>{charm}</em> : null}
          </div>
        </div>
      </div>

      <div className="gameplay-hud__center">
        {prompt !== null ? <div className="gameplay-hud__prompt">{prompt}</div> : null}
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
        <ul className="gameplay-hud__commands" aria-label="Controls">
          {UI_COMMANDS.map((command) => (
            <li key={command.id}>
              <kbd>{command.binding}</kbd>
              <span>{command.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
