import type { GameRuntime, GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import {
  SKILL_DEFINITIONS,
  SKILL_INPUT_BINDING_LABEL,
} from '../../game/skills/skillDefinition'
import { SkillGlyph } from '../SkillGlyph'

interface SkillLoadoutProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly runtime: GameRuntime
}

export function SkillLoadout({ snapshot, runtime }: SkillLoadoutProps) {
  const { skills } = snapshot
  const unlocked = new Set(skills.unlockedSkillIds)
  return (
    <section className="inventory-skills" aria-label="Active oath skills" data-skill-loadout="1">
      <h3>
        <span>Active Oath</span>
        <small>
          {skills.equippedSkillId === null
            ? 'No oath bound'
            : skills.ready
              ? 'Equipped · Ready'
              : skills.cooldownRemainingSteps > 0
                ? `Equipped · ${skills.cooldownRemainingSteps} steps`
                : 'Equipped · Committed'}
        </small>
        <kbd>{SKILL_INPUT_BINDING_LABEL}</kbd>
      </h3>
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
                onClick={() => runtime.equipSkill(definition.id)}
              >
                {isEquipped ? 'Equipped' : isUnlocked ? 'Bind' : `L${definition.unlockLevel}`}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
