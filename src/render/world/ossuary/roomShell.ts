import { compileOssuaryDungeon } from '../../../content/world/dungeons/ossuary/OssuaryDungeon'
import { instance } from '../../../content/world/instance'
import type { WorldObjectPlacement } from '../worldObjectTypes'

export const place = instance

export function generateDungeonShell(): readonly WorldObjectPlacement[] {
  return compileOssuaryDungeon().renderInstances.filter((entry) =>
    entry.instanceId.startsWith('foundation.') ||
    entry.instanceId.startsWith('wall.') ||
    entry.instanceId.startsWith('parapet.') ||
    entry.instanceId.startsWith('arch.') ||
    entry.instanceId.startsWith('slab.'),
  )
}
