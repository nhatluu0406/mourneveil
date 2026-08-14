import { defineObject } from '../defineObject'

/** Heavy outer shell; interior partitions continue to use the lighter wall bay. */
export const ExteriorWall = defineObject({
  id: 'ossuary.wall.exterior',
  family: 'architecture',
  materialKey: 'darkStone',
  castShadow: false,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'structural',
  visualBounds: [0.28, 1.72, 2.4],
  collision: { kind: 'box', colliderKind: 'wall', navigationBlocking: true },
  tags: ['architecture', 'exterior-wall', 'hard-physical'],
})
