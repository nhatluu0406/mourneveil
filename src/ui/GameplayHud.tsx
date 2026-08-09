import type { GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import {
  equippedCharmLabel,
  equippedWeaponLabel,
  resolveGameplayInteractionPrompt,
} from './gameplayHudModel'

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

  return (
    <div className={`gameplay-hud${damagedRecently ? ' gameplay-hud--hit' : ''}`} aria-label="Gameplay HUD">
      <div className="gameplay-hud__vitals">
        <div className="gameplay-hud__bar" role="meter" aria-valuenow={health.current} aria-valuemin={0} aria-valuemax={health.maximum} aria-label="Health">
          <div className="gameplay-hud__bar-fill" style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }} />
          <span className="gameplay-hud__bar-label">
            {health.current}/{health.maximum}
          </span>
        </div>
        <div className="gameplay-hud__flasks" aria-label="Flask charges">
          {Array.from({ length: snapshot.flask.maximumCharges }, (_, index) => (
            <span
              key={index}
              className={`gameplay-hud__flask${index < snapshot.flask.currentCharges ? ' is-filled' : ''}`}
            />
          ))}
        </div>
        <div className="gameplay-hud__echoes" aria-label="Echoes">
          <span className="gameplay-hud__echoes-label">Echoes</span>
          <strong>{snapshot.echoes.carried}</strong>
        </div>
      </div>
      <div className="gameplay-hud__gear">
        <span>{weapon}</span>
        {charm !== null ? <span className="gameplay-hud__charm">{charm}</span> : null}
      </div>
      {prompt !== null ? <div className="gameplay-hud__prompt">{prompt}</div> : null}
      {!health.alive ? <div className="gameplay-hud__death">Fallen</div> : null}
    </div>
  )
}
