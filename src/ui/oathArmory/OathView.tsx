import type { GameRuntime, GameRuntimeSnapshot } from '../../game/runtime/GameRuntime'
import { AttributeAllocation } from './AttributeAllocation'
import { ProgressionSummary } from './ProgressionSummary'
import { SkillLoadout } from './SkillLoadout'

interface OathViewProps {
  readonly snapshot: GameRuntimeSnapshot
  readonly runtime: GameRuntime
}

export function OathView({ snapshot, runtime }: OathViewProps) {
  return (
    <div className="oath-layout" data-oath-view="1">
      <ProgressionSummary snapshot={snapshot} />
      <div className="oath-layout__body">
        <AttributeAllocation snapshot={snapshot} runtime={runtime} />
        <SkillLoadout snapshot={snapshot} runtime={runtime} />
      </div>
    </div>
  )
}
