import { useState } from 'react'
import type { DevelopmentDiagnostic } from './developmentDiagnostic'
import type { CameraDiagnostic } from '../render/followCamera'
import { DEVELOPMENT_MILESTONE_STEP } from './developmentDiagnostic'

interface DevelopmentPanelProps {
  diagnostic: DevelopmentDiagnostic
  camera: CameraDiagnostic | null
  visible: boolean
  onResetTrainingTarget: () => void
  onResetMeleeFixture: () => void
  onRestorePlayerForDevelopment: () => void
}

function readinessLabel(ready: boolean): string {
  return ready ? 'ready' : 'initializing'
}

export function DevelopmentPanel({
  diagnostic,
  camera,
  visible,
  onResetTrainingTarget,
  onResetMeleeFixture,
  onRestorePlayerForDevelopment,
}: DevelopmentPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const player = diagnostic.runtime.player
  const health = diagnostic.runtime.playerHealth.health
  const world = diagnostic.runtime.world

  if (!visible) return null

  return (
    <aside className="development-panel" aria-label="Development diagnostic">
      <header className="development-panel__header">
        <div>
          <p className="development-panel__eyebrow">Development · F3</p>
          <h1>{diagnostic.workingTitle}</h1>
        </div>
        <button
          type="button"
          className="development-panel__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Collapse' : 'Details'}
        </button>
      </header>

      <dl className="development-panel__summary">
        <div>
          <dt>Milestone</dt>
          <dd>
            {diagnostic.milestone} · {DEVELOPMENT_MILESTONE_STEP}
          </dd>
        </div>
        <div>
          <dt>Systems</dt>
          <dd>
            R {readinessLabel(diagnostic.rendererReady)} · P{' '}
            {readinessLabel(diagnostic.physicsReady)} · {camera?.mode ?? 'cam'}
          </dd>
        </div>
        <div>
          <dt>Player</dt>
          <dd>
            HP {health.current}/{health.maximum} · ({player.position.x.toFixed(1)},{' '}
            {player.position.z.toFixed(1)})
          </dd>
        </div>
        <div>
          <dt>World</dt>
          <dd>
            {world.currentZoneId?.replace('zone.', '') ?? 'between'} · shortcut{' '}
            {world.openedShortcutIds.length > 0 ? 'open' : 'closed'} · gate{' '}
            {world.finalGateReached ? 'open' : 'sealed'}
          </dd>
        </div>
      </dl>

      {expanded ? (
        <div className="development-panel__details">
          <dl>
            <div>
              <dt>Combat</dt>
              <dd>{diagnostic.runtime.combat.actionId ?? 'idle'}</dd>
            </div>
            <div>
              <dt>Incoming</dt>
              <dd>
                {diagnostic.runtime.incomingContact.lastHit
                  ? `${diagnostic.runtime.incomingContact.lastHit.attackerId} dmg ${diagnostic.runtime.incomingContact.lastHit.appliedDamage}`
                  : 'none'}
              </dd>
            </div>
          </dl>
          <div className="development-panel__actions">
            <button type="button" onClick={onRestorePlayerForDevelopment}>
              Restore player
            </button>
            <button type="button" onClick={onResetTrainingTarget}>
              Reset target
            </button>
            <button type="button" onClick={onResetMeleeFixture}>
              Reset melee
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
