import { compileOssuaryDungeon } from '../../../content/world/dungeons/ossuary/OssuaryDungeon'
import type { WorldObjectPlacement } from '../worldObjectTypes'

const SHELL_PREFIXES = ['foundation.', 'wall.', 'parapet.', 'arch.', 'slab.']

/** Dressing is compiled with the dungeon; this helper projects the non-shell instances. */
export function generateRoomDressing(): readonly WorldObjectPlacement[] {
  return compileOssuaryDungeon().renderInstances.filter(
    (entry) => !SHELL_PREFIXES.some((prefix) => entry.instanceId.startsWith(prefix)),
  )
}
