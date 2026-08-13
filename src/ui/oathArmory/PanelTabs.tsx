export type OathArmoryMode = 'armory' | 'oath'

interface PanelTabsProps {
  readonly mode: OathArmoryMode
  readonly onChange: (mode: OathArmoryMode) => void
}

export function PanelTabs({ mode, onChange }: PanelTabsProps) {
  return (
    <div className="panel-tabs" role="tablist" aria-label="Oath and Armory">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'armory'}
        data-panel-tab="armory"
        onClick={() => onChange('armory')}
      >
        Armory
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'oath'}
        data-panel-tab="oath"
        onClick={() => onChange('oath')}
      >
        Oath
      </button>
    </div>
  )
}
