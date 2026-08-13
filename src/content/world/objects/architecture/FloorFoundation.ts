import { defineObject } from '../defineObject'

export const FloorFoundation = defineObject({
  id: 'ossuary.floor.foundation',
  family: 'architecture',
  materialKey: 'floorSlab',
  castShadow: false,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'structural',
  visualBounds: [1, 0.055, 1],
  collision: { kind: 'box', colliderKind: 'floor', navigationBlocking: false },
  tags: ['architecture', 'floor'],
})
