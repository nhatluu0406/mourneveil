import { useState } from 'react'
import type { GameRuntime, GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import { ArmoryView } from './ArmoryView'
import { OathView } from './OathView'
import { PanelTabs, type OathArmoryMode } from './PanelTabs'

export const DEFAULT_OATH_ARMORY_MODE: OathArmoryMode = 'armory'

interface OathArmoryPanelProps {
  snapshot: GameRuntimeSnapshot
  runtime: GameRuntime
  open: boolean
  onClose: () => void
}

export function OathArmoryPanel({ snapshot, runtime, open, onClose }: OathArmoryPanelProps) {
  const [mode, setMode] = useState<OathArmoryMode>(DEFAULT_OATH_ARMORY_MODE)
  if (!open) return null

  return (
    <div className="inventory-overlay" role="presentation">
      <aside
        className="inventory-panel inventory-panel--build"
        aria-label={mode === 'armory' ? 'Armory' : 'Oath'}
        data-scrollbar-policy="contained"
        data-inventory-panel="1"
        data-panel-mode={mode}
      >
        <header className="inventory-panel__header">
          <div>
            <p className="inventory-panel__eyebrow">Veilbound Warden</p>
            <h2>Oath & Armory</h2>
          </div>
          <PanelTabs mode={mode} onChange={setMode} />
          <button type="button" className="inventory-panel__close" onClick={onClose}>Close · I</button>
        </header>
        {mode === 'armory' ? (
          <ArmoryView snapshot={snapshot} runtime={runtime} />
        ) : (
          <OathView snapshot={snapshot} runtime={runtime} />
        )}
      </aside>
    </div>
  )
}
