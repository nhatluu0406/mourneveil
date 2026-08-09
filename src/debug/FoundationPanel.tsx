import type { FoundationDiagnostic } from '../game/core/foundationDiagnostic'
import type { CameraDiagnostic } from '../render/followCamera'

interface FoundationPanelProps {
  diagnostic: FoundationDiagnostic
  camera: CameraDiagnostic | null
  onResetTrainingTarget: () => void
  onResetMeleeFixture: () => void
  onRestorePlayerForDevelopment: () => void
}

function readinessLabel(ready: boolean): string {
  return ready ? 'ready' : 'initializing'
}

export function FoundationPanel({
  diagnostic,
  camera,
  onResetTrainingTarget,
  onResetMeleeFixture,
  onRestorePlayerForDevelopment,
}: FoundationPanelProps) {
  return (
    <aside className="foundation-panel" aria-label="Foundation diagnostic">
      <p className="foundation-panel__eyebrow">Working title</p>
      <h1>{diagnostic.workingTitle}</h1>
      <dl>
        <div>
          <dt>Milestone</dt>
          <dd>{diagnostic.milestone}</dd>
        </div>
        <div>
          <dt>Renderer</dt>
          <dd data-ready={diagnostic.rendererReady}>
            {readinessLabel(diagnostic.rendererReady)}
          </dd>
        </div>
        <div>
          <dt>Physics</dt>
          <dd data-ready={diagnostic.physicsReady}>
            {readinessLabel(diagnostic.physicsReady)}
          </dd>
        </div>
        <div>
          <dt>Camera</dt>
          <dd>
            {camera
              ? `${camera.mode} · look (${camera.followLookAt.x.toFixed(1)}, ${camera.followLookAt.z.toFixed(1)})`
              : 'starting'}
          </dd>
        </div>
        <div>
          <dt>Simulation</dt>
          <dd data-running={diagnostic.runtime.simulation.stepCount > 0}>
            {diagnostic.runtime.simulation.stepCount > 0 ? 'running' : 'starting'} · tick{' '}
            {diagnostic.runtime.simulation.stepCount} ·{' '}
            {diagnostic.runtime.simulation.simulationTimeSeconds.toFixed(2)} s
          </dd>
        </div>
        <div>
          <dt>Movement intent</dt>
          <dd>
            ({diagnostic.runtime.movementIntent.horizontal.toFixed(2)},{' '}
            {diagnostic.runtime.movementIntent.forward.toFixed(2)}) ·{' '}
            {diagnostic.runtime.activeInputSource}
          </dd>
        </div>
        <div>
          <dt>Player position</dt>
          <dd>
            ({diagnostic.runtime.player.position.x.toFixed(2)},{' '}
            {diagnostic.runtime.player.position.y.toFixed(2)},{' '}
            {diagnostic.runtime.player.position.z.toFixed(2)})
          </dd>
        </div>
        <div>
          <dt>Player velocity</dt>
          <dd>
            ({diagnostic.runtime.player.velocity.x.toFixed(2)},{' '}
            {diagnostic.runtime.player.velocity.y.toFixed(2)},{' '}
            {diagnostic.runtime.player.velocity.z.toFixed(2)})
          </dd>
        </div>
        <div>
          <dt>Grounded</dt>
          <dd>{diagnostic.runtime.player.grounded ? 'yes' : 'no'}</dd>
        </div>
        <div>
          <dt>Live facing</dt>
          <dd>
            ({diagnostic.runtime.player.facing.x.toFixed(2)},{' '}
            {diagnostic.runtime.player.facing.z.toFixed(2)})
          </dd>
        </div>
        <div>
          <dt>Combat input</dt>
          <dd>
            LMB {diagnostic.runtime.combatInput.primaryButtonHeld ? 'held' : 'up'} · RMB{' '}
            {diagnostic.runtime.combatInput.guardHeld ? 'held' : 'up'} · Space{' '}
            {diagnostic.runtime.combatInput.dodgeKeyHeld ? 'held' : 'up'}
          </dd>
        </div>
        <div>
          <dt>Combat action</dt>
          <dd>
            {diagnostic.runtime.combat.actionId ?? 'idle'} ·{' '}
            {diagnostic.runtime.combat.phase}
          </dd>
        </div>
        <div>
          <dt>Combat phase timing</dt>
          <dd>
            {diagnostic.runtime.combat.phaseElapsedSteps}/
            {diagnostic.runtime.combat.phaseDurationSteps} steps
          </dd>
        </div>
        <div>
          <dt>Combat contact</dt>
          <dd>
            {diagnostic.runtime.combat.contact.enabled
              ? diagnostic.runtime.combat.contact.windowId
              : 'disabled'}
          </dd>
        </div>
        <div>
          <dt>Attack shape</dt>
          <dd>
            {diagnostic.runtime.attack.contactShapeId ?? 'none'} ·{' '}
            {diagnostic.runtime.attack.activeContactShape
              ? 'active'
              : 'inactive'}
          </dd>
        </div>
        <div>
          <dt>Contact center</dt>
          <dd>
            {diagnostic.runtime.attack.activeContactShape
              ? `(${diagnostic.runtime.attack.activeContactShape.center.x.toFixed(2)}, ${diagnostic.runtime.attack.activeContactShape.center.z.toFixed(2)})`
              : 'none'}
          </dd>
        </div>
        <div>
          <dt>Attack movement</dt>
          <dd>
            {diagnostic.runtime.attack.movementConstrained
              ? 'constrained'
              : 'free'}
          </dd>
        </div>
        <div>
          <dt>Execution facing</dt>
          <dd>
            {diagnostic.runtime.attack.executionFacing
              ? `(${diagnostic.runtime.attack.executionFacing.x.toFixed(2)}, ${diagnostic.runtime.attack.executionFacing.z.toFixed(2)})`
              : 'none'}
          </dd>
        </div>
        <div>
          <dt>Dodge</dt>
          <dd>
            {diagnostic.runtime.defense.dodgeExecutionId === null
              ? 'inactive'
              : `#${diagnostic.runtime.defense.dodgeExecutionId}`} ·{' '}
            {diagnostic.runtime.defense.invulnerable ? 'invulnerable' : 'vulnerable'}
          </dd>
        </div>
        <div>
          <dt>Guard</dt>
          <dd>
            {diagnostic.runtime.defense.guarding ? 'guarding' : 'inactive'} · movement{' '}
            {diagnostic.runtime.defense.movementScale.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt>Training target</dt>
          <dd>{diagnostic.runtime.trainingTarget.id}</dd>
        </div>
        <div>
          <dt>Target health</dt>
          <dd>
            {diagnostic.runtime.trainingTarget.health.current}/
            {diagnostic.runtime.trainingTarget.health.maximum} ·{' '}
            {diagnostic.runtime.trainingTarget.health.alive ? 'alive' : 'defeated'}
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
          <dt>Target hit count</dt>
          <dd>{diagnostic.runtime.trainingTarget.hitCount}</dd>
        </div>
        <div>
          <dt>Player health</dt>
          <dd>
            {diagnostic.runtime.playerHealth.health.current}/
            {diagnostic.runtime.playerHealth.health.maximum} ·{' '}
            {diagnostic.runtime.playerHealth.lifeState}
          </dd>
        </div>
        <div>
          <dt>Enemy</dt>
          <dd>
            {diagnostic.runtime.enemy.id} · {diagnostic.runtime.enemy.state} · tgt{' '}
            {diagnostic.runtime.enemy.targetId ?? 'none'} ·{' '}
            {diagnostic.runtime.enemy.health.current}/
            {diagnostic.runtime.enemy.health.maximum}
            {diagnostic.runtime.enemy.alive ? '' : ' · dead'}
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
          <dt>Encounter</dt>
          <dd>
            {diagnostic.runtime.encounter.phase} · defeated{' '}
            {diagnostic.runtime.encounter.defeatedEnemyIds.length}/
            {diagnostic.runtime.encounter.enemyIds.length}
          </dd>
        </div>
        <div>
          <dt>Enemy distance/facing</dt>
          <dd>
            {diagnostic.runtime.enemyDistanceToPlayer.toFixed(2)} · live (
            {diagnostic.runtime.enemy.facing.x.toFixed(2)},{' '}
            {diagnostic.runtime.enemy.facing.z.toFixed(2)}) · exec{' '}
            {diagnostic.runtime.enemy.attackExecutionFacing
              ? `(${diagnostic.runtime.enemy.attackExecutionFacing.x.toFixed(2)}, ${diagnostic.runtime.enemy.attackExecutionFacing.z.toFixed(2)})`
              : 'none'}
          </dd>
        </div>
        <div>
          <dt>Enemy action</dt>
          <dd>
            {diagnostic.runtime.enemy.action.actionId ?? 'none'} ·{' '}
            {diagnostic.runtime.enemy.action.phase} · step{' '}
            {diagnostic.runtime.enemy.action.phaseElapsedSteps}/
            {diagnostic.runtime.enemy.action.phaseRemainingSteps} · contact{' '}
            {diagnostic.runtime.enemyAttack.contactEnabled ? 'enabled' : 'disabled'}
          </dd>
        </div>
        <div>
          <dt>Last incoming</dt>
          <dd>
            {diagnostic.runtime.incomingContact.lastHit
              ? `${diagnostic.runtime.incomingContact.lastHit.outcome} · ${diagnostic.runtime.incomingContact.lastHit.appliedDamage} damage`
              : 'none'}
          </dd>
        </div>
      </dl>
      <button type="button" onClick={onResetTrainingTarget}>
        Reset training target
      </button>
      <button type="button" onClick={onRestorePlayerForDevelopment}>
        Restore player (development)
      </button>
      <button type="button" onClick={onResetMeleeFixture}>
        Reset melee fixture
      </button>
    </aside>
  )
}
