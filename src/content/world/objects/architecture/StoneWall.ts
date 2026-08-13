import { defineObject } from '../defineObject'

export const StoneWall = defineObject({
  id: 'ossuary.wall.bay',
  family: 'architecture',
  materialKey: 'darkStone',
  castShadow: true,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'structural',
  visualBounds: [0.16, 1.25, 1.2],
  collision: { kind: 'box', colliderKind: 'wall', navigationBlocking: true },
  tags: ['architecture', 'wall'],
})
