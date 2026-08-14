import type { OssuaryObjectId, WorldObjectDefinition } from '../worldObjectTypes'
import { FloorFoundation } from './architecture/FloorFoundation'
import { StoneWall } from './architecture/StoneWall'
import { ExteriorWall } from './architecture/ExteriorWall'
import { LowParapet } from './architecture/LowParapet'
import { Archway } from './architecture/Archway'
import { Buttress } from './architecture/Buttress'
import { WallSconce } from './lighting/WallSconce'
import { ProcessionalTorch } from './lighting/ProcessionalTorch'
import { Brazier } from './lighting/Brazier'
import { CandleCluster } from './lighting/CandleCluster'
import { VeilLamp } from './lighting/VeilLamp'
import { Sarcophagus } from './burial/Sarcophagus'
import { MemorialSlab } from './burial/MemorialSlab'
import { ShortcutGate } from './interactive/ShortcutGate'
import { FinalGate } from './interactive/FinalGate'
import { CheckpointShrine } from './interactive/CheckpointShrine'
import { VeilWisp } from './vfx/VeilWisp'
import { REMAINING_OBJECT_DEFINITIONS } from './remaining'

const PRODUCTION_MODULES: readonly WorldObjectDefinition[] = Object.freeze([
  FloorFoundation,
  StoneWall,
  ExteriorWall,
  LowParapet,
  Archway,
  Buttress,
  WallSconce,
  ProcessionalTorch,
  Brazier,
  CandleCluster,
  VeilLamp,
  Sarcophagus,
  MemorialSlab,
  ShortcutGate,
  FinalGate,
  CheckpointShrine,
  VeilWisp,
])

function register(
  definitions: readonly WorldObjectDefinition[],
): Readonly<Record<OssuaryObjectId, WorldObjectDefinition>> {
  const catalog = {} as Record<OssuaryObjectId, WorldObjectDefinition>
  for (const definition of definitions) {
    if (catalog[definition.id] !== undefined) {
      throw new Error(`Duplicate world object id: ${definition.id}`)
    }
    catalog[definition.id] = definition
  }
  return Object.freeze(catalog)
}

/** Immutable catalog. Index files only register modules; they do not duplicate definitions. */
export const OSSUARY_OBJECT_DEFINITIONS: Readonly<
  Record<OssuaryObjectId, WorldObjectDefinition>
> = register([...PRODUCTION_MODULES, ...REMAINING_OBJECT_DEFINITIONS])

export function getWorldObjectDefinition(objectId: string): WorldObjectDefinition {
  const definition = OSSUARY_OBJECT_DEFINITIONS[objectId as OssuaryObjectId]
  if (definition === undefined) {
    throw new Error(`Unknown world object id: "${objectId}"`)
  }
  return definition
}

export function listWorldObjectIds(): readonly OssuaryObjectId[] {
  return Object.freeze(Object.keys(OSSUARY_OBJECT_DEFINITIONS) as OssuaryObjectId[])
}
