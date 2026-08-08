import type { FoundationDiagnostic } from '../game/core/foundationDiagnostic'

interface FoundationPanelProps {
  diagnostic: FoundationDiagnostic
}

function readinessLabel(ready: boolean): string {
  return ready ? 'ready' : 'initializing'
}

export function FoundationPanel({ diagnostic }: FoundationPanelProps) {
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
      </dl>
    </aside>
  )
}
