import type { FoundationDiagnostic } from '../game/core/foundationDiagnostic'
import type { CameraDiagnostic } from '../render/followCamera'

interface FoundationPanelProps {
  diagnostic: FoundationDiagnostic
  camera: CameraDiagnostic | null
}

function readinessLabel(ready: boolean): string {
  return ready ? 'ready' : 'initializing'
}

export function FoundationPanel({ diagnostic, camera }: FoundationPanelProps) {
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
      </dl>
    </aside>
  )
}
