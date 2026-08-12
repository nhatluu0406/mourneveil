import type { GameRuntime, GameRuntimeSnapshot } from '../game/runtime/GameRuntime'
import { getItemDefinition, type EquipSlot, type ItemId } from '../game/items/itemDefinition'
import { formatModifierSummary } from '../game/items/itemComparison'
import type { ProgressionAttributeId } from '../game/character/playerProgression'
import {
  SKILL_DEFINITIONS,
  SKILL_INPUT_BINDING_LABEL,
  type SkillId,
} from '../game/skills/skillDefinition'
import { ItemGlyph } from './ItemGlyph'
import { ProgressionGlyph } from './ProgressionGlyph'
import { SkillGlyph } from './SkillGlyph'

interface InventoryEquipmentPanelProps {
  snapshot: GameRuntimeSnapshot
  runtime: GameRuntime
  open: boolean
  onClose: () => void
}

const ATTRIBUTE_COPY: Readonly<Record<ProgressionAttributeId, { readonly title: string; readonly motif: string }>> = {
  vitality: { title: 'Vitality', motif: 'Vessel of the living oath' },
  resolve: { title: 'Resolve', motif: 'Ward against the breaking dark' },
  might: { title: 'Might', motif: 'Weight behind the oathblade' },
}

function itemLabel(itemId: ItemId | null): string {
  if (itemId === null) return 'Empty'
  return getItemDefinition(itemId)?.displayName ?? 'Unknown item'
}

function itemIcon(itemId: ItemId): 'oathblade' | 'vitality-charm' | 'ward-seal' | 'charm' | 'echo' {
  if (itemId.startsWith('item.weapon.')) return 'oathblade'
  if (itemId === 'item.charm.vitality') return 'vitality-charm'
  if (itemId === 'item.charm.ward-seal') return 'ward-seal'
  if (getItemDefinition(itemId)?.slot === 'charm') return 'charm'
  return 'echo'
}

export function InventoryEquipmentPanel({ snapshot, runtime, open, onClose }: InventoryEquipmentPanelProps) {
  const { inventory, equipment, resolvedAttackDamage, playerHealth, defense, progression, skills } = snapshot
  if (!open) return null

  const xpTotal = progression.experienceIntoLevel + (progression.experienceToNextLevel ?? 0)
  const xpRatio = progression.atMaxLevel ? 1 : xpTotal <= 0 ? 0 : progression.experienceIntoLevel / xpTotal
  const contribution = snapshot.resolvedProgressionContributions
  const effectCopy: Readonly<Record<ProgressionAttributeId, string>> = {
    vitality: `+${contribution.maxHealth} Max HP from allocation`,
    resolve: `+${contribution.guardImpactThreshold} Guard Threshold from allocation`,
    might: `+${contribution.lightDamage} Light · +${contribution.heavyDamage} Heavy from allocation`,
  }
  const unlocked = new Set(skills.unlockedSkillIds)

  const allocate = (attribute: ProgressionAttributeId): void => { runtime.allocateProgression(attribute) }
  const equip = (itemId: ItemId): void => { runtime.equipItem(itemId) }
  const unequip = (slot: EquipSlot): void => { runtime.unequipSlot(slot) }
  const equipSkill = (skillId: SkillId): void => { runtime.equipSkill(skillId) }

  return (
    <div className="inventory-overlay" role="presentation">
      <aside className="inventory-panel inventory-panel--build" aria-label="Inventory, equipment, and progression" data-scrollbar-policy="contained" data-inventory-panel="1">
        <header className="inventory-panel__header">
          <div><p className="inventory-panel__eyebrow">Veilbound Warden</p><h2>Oath & Armory</h2></div>
          <button type="button" className="inventory-panel__close" onClick={onClose}>Close · I</button>
        </header>

        <section className="progression-summary" data-progression-panel="1">
          <div className="progression-summary__level"><ProgressionGlyph id="level"/><span>Level</span><strong>{progression.level}</strong></div>
          <div className="progression-summary__xp">
            <div><span>Veil experience</span><strong>{progression.atMaxLevel ? 'Mastered' : `${progression.experienceIntoLevel} / ${xpTotal}`}</strong></div>
            <div className="progression-summary__track"><span style={{ width: `${Math.max(0, Math.min(1, xpRatio)) * 100}%` }}/></div>
          </div>
          <div className={`progression-summary__points${progression.unspentPoints > 0 ? ' has-points' : ''}`}><ProgressionGlyph id="point"/><span>Unspent</span><strong>{progression.unspentPoints}</strong></div>
        </section>

        <div className="inventory-panel__body">
          <div className="inventory-panel__columns">
            <section className="progression-attributes" aria-label="Progression attributes">
              <h3>Oath Attributes</h3>
              {(['vitality', 'resolve', 'might'] as const).map((attribute) => (
                <article key={attribute} className={`progression-attribute progression-attribute--${attribute}`} data-attribute={attribute}>
                  <span className="progression-attribute__glyph"><ProgressionGlyph id={attribute}/></span>
                  <div className="progression-attribute__copy"><span>{ATTRIBUTE_COPY[attribute].motif}</span><strong>{ATTRIBUTE_COPY[attribute].title}</strong><small>{effectCopy[attribute]}</small></div>
                  <strong className="progression-attribute__rank">{progression.allocation[attribute]}</strong>
                  <button type="button" aria-label={`Allocate point to ${attribute}`} disabled={progression.unspentPoints <= 0} onClick={() => allocate(attribute)}>+</button>
                </article>
              ))}
              <div className="progression-resolved"><span>Resolved now</span><strong>{playerHealth.health.maximum} HP · {defense.guardImpactThreshold} Guard</strong><small>{resolvedAttackDamage.light} Light · {resolvedAttackDamage.heavy} Heavy</small></div>
            </section>

            <div className="inventory-panel__side">
              <section className="inventory-loadout" aria-label="Equipped build">
                <h3>Bound Relics</h3>
                {(['weapon', 'charm'] as const).map((slot) => {
                  const itemId = slot === 'weapon' ? equipment.weaponItemId : equipment.charmItemId
                  return <div key={slot} className={`inventory-equipped-card${itemId === null ? '' : ' is-equipped'}`}>
                    <span className="inventory-item-glyph">{itemId === null ? <span>—</span> : <ItemGlyph icon={itemIcon(itemId)}/>}</span>
                    <div><span>{slot}</span><strong>{itemLabel(itemId)}</strong>{itemId === null ? <small>Socket unbound</small> : formatModifierSummary(getItemDefinition(itemId)!.modifiers).map((line) => <small key={line}>{line}</small>)}</div>
                    {itemId === null ? null : <button type="button" onClick={() => unequip(slot)}>Unbind</button>}
                  </div>
                })}
              </section>

              <section className="inventory-skills" aria-label="Active oath skills" data-skill-loadout="1">
                <h3><span>Active Oath</span><small>{skills.equippedSkillId === null ? 'No oath bound' : skills.ready ? 'Equipped · Ready' : skills.cooldownRemainingSteps > 0 ? `Equipped · ${skills.cooldownRemainingSteps} steps` : 'Equipped · Committed'}</small><kbd>{SKILL_INPUT_BINDING_LABEL}</kbd></h3>
                <ul>
                  {SKILL_DEFINITIONS.map((definition) => {
                    const isUnlocked = unlocked.has(definition.id)
                    const isEquipped = skills.equippedSkillId === definition.id
                    return (
                      <li
                        key={definition.id}
                        className={`inventory-skill-card${isEquipped ? ' is-equipped' : ''}${isUnlocked ? '' : ' is-locked'}`}
                        data-skill-id={definition.id}
                      >
                        <span className="inventory-item-glyph"><SkillGlyph id={definition.id} /></span>
                        <div>
                          <span>{definition.category} · {definition.action.cooldownSteps} step cooldown</span>
                          <strong>{definition.displayName}</strong>
                          <small>{isUnlocked ? definition.shortDescription : `Unlocks at level ${definition.unlockLevel}`}</small>
                        </div>
                        <button
                          type="button"
                          disabled={!isUnlocked || isEquipped}
                          onClick={() => equipSkill(definition.id)}
                        >
                          {isEquipped ? 'Equipped' : isUnlocked ? 'Bind' : `L${definition.unlockLevel}`}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </div>
          </div>

          <section className="inventory-owned" data-inventory-scroll="1">
            <h3>Relics in Keeping</h3>
            {inventory.entries.length === 0 ? <p className="inventory-panel__empty">No relics recovered</p> : (
              <ul>{inventory.entries.map((entry) => {
                const definition = getItemDefinition(entry.itemId)
                if (definition === null) return null
                const equipped = equipment.weaponItemId === entry.itemId || equipment.charmItemId === entry.itemId
                const comparison = runtime.compareItem(entry.itemId)
                const comparisonRows = comparison === null
                  ? []
                  : [
                      ...comparison.gains.map((gain) => ({ text: `${gain.delta > 0 ? '+' : ''}${gain.delta} ${gain.label}`, gain: true })),
                      ...comparison.losses.map((loss) => ({ text: `${loss.delta} ${loss.label}`, gain: false })),
                    ]
                return <li key={entry.itemId} className={`inventory-item-card inventory-item-card--${itemIcon(entry.itemId)}${equipped ? ' is-equipped' : ''}`} data-item-id={entry.itemId} data-item-slot={definition.slot ?? 'none'} data-item-rarity={definition.rarity}>
                  <span className="inventory-item-glyph"><ItemGlyph icon={itemIcon(entry.itemId)}/></span>
                  <div className="inventory-item-card__copy"><span>{definition.slot ?? definition.type} · {definition.rarity}</span><strong>{definition.displayName} {entry.quantity > 1 ? `×${entry.quantity}` : ''}</strong>{formatModifierSummary(definition.modifiers).map((line) => <small key={line}>{line}</small>)}{comparisonRows.length > 0 && !equipped ? <div className="inventory-item-card__comparison" data-item-comparison="1">{comparisonRows.map((line) => <em key={line.text} className={line.gain ? 'is-gain' : 'is-loss'}>{line.text}</em>)}</div> : null}</div>
                  {definition.slot === null ? null : <button type="button" disabled={equipped} onClick={() => equip(entry.itemId)}>{equipped ? 'Bound' : 'Equip'}</button>}
                </li>
              })}</ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}
