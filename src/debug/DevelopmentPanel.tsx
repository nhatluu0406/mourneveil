import { useState } from 'react'
import type { DevelopmentDiagnostic } from './developmentDiagnostic'
import type { CameraDiagnostic } from '../render/followCamera'
import { DEVELOPMENT_MILESTONE_STEP } from './developmentDiagnostic'

interface DevelopmentPanelProps {
  diagnostic: DevelopmentDiagnostic
  camera: CameraDiagnostic | null
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
  onResetTrainingTarget,
  onResetMeleeFixture,
  onRestorePlayerForDevelopment,
}: DevelopmentPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const player = diagnostic.runtime.player
  const health = diagnostic.runtime.playerHealth.health
  const world = diagnostic.runtime.world

  return (
    <aside className="development-panel" aria-label="Development diagnostic">
      <header className="development-panel__header">
        <div>
          <p className="development-panel__eyebrow">Working title</p>
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
            {readinessLabel(diagnostic.physicsReady)} ·{' '}
            {camera?.mode ?? 'cam'}
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
        <div>
          <dt>Combat</dt>
          <dd>
            {diagnostic.runtime.combat.actionId ?? 'idle'} · flask{' '}
            {diagnostic.runtime.flask.currentCharges}/
            {diagnostic.runtime.flask.maximumCharges} · echoes{' '}
            {diagnostic.runtime.echoes.carried}
          </dd>
        </div>
      </dl>

      {expanded ? (
        <div className="development-panel__details">
          <dl>
            <div>
              <dt>Simulation</dt>
              <dd>
                tick {diagnostic.runtime.simulation.stepCount} ·{' '}
                {diagnostic.runtime.simulation.simulationTimeSeconds.toFixed(2)}s
              </dd>
            </div>
            <div>
              <dt>Input</dt>
              <dd>
                ({diagnostic.runtime.movementIntent.horizontal.toFixed(2)},{' '}
                {diagnostic.runtime.movementIntent.forward.toFixed(2)}) ·{' '}
                {diagnostic.runtime.activeInputSource}
              </dd>
            </div>
            <div>
              <dt>Activation</dt>
              <dd>
                {diagnostic.runtime.encounterActivation.activatedEncounterIds.length === 0
                  ? 'none'
                  : diagnostic.runtime.encounterActivation.activatedEncounterIds
                      .map((id) => id.replace('encounter.m5.', ''))
                      .join(' · ')}
              </dd>
            </div>
            <div>
              <dt>Encounters</dt>
              <dd>
                {diagnostic.runtime.encounters
                  .map(
                    (encounter) =>
                      `${encounter.id.replace('encounter.m5.', '')}:${encounter.phase}`,
                  )
                  .join(' · ')}
              </dd>
            </div>
            <div>
              <dt>Enemies</dt>
              <dd>
                {diagnostic.runtime.enemies
                  .map(
                    (enemy) =>
                      `${enemy.id.replace('enemy.', '')}:${enemy.state}:${enemy.health.current}`,
                  )
                  .join(' · ')}
              </dd>
            </div>
            <div>
              <dt>Last hit</dt>
              <dd>
                {diagnostic.runtime.contact.lastHit
                  ? `${diagnostic.runtime.contact.lastHit.actionId} #${diagnostic.runtime.contact.lastHit.executionId}`
                  : 'none'}
              </dd>
            </div>
            <div>
              <dt>Incoming</dt>
              <dd>
                {diagnostic.runtime.incomingContact.lastHit
                  ? `${diagnostic.runtime.incomingContact.lastHit.attackerId} dmg ${diagnostic.runtime.incomingContact.lastHit.appliedDamage}`
                  : 'none'}
              </dd>
            </div>
            <div>
              <dt>Checkpoint</dt>
              <dd>
                {diagnostic.runtime.checkpoint.activated ? 'active' : 'inactive'} ·{' '}
                {diagnostic.runtime.checkpoint.currentCheckpointId ?? 'none'}
              </dd>
            </div>
            <div>
              <dt>Fixture</dt>
              <dd>
                training target retained for debug reset only (not in M5 play)
              </dd>
            </div>
          </dl>
          <div className="development-panel__actions">
            <button type="button" onClick={onRestorePlayerForDevelopment}>
              Restore player
            </button>
            <button type="button" onClick={onResetMeleeFixture}>
              Reset encounters
            </button>
            <button type="button" onClick={onResetTrainingTarget}>
              Reset training fixture
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
