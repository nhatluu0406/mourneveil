import { defineObject } from '../defineObject'

export const LowParapet = defineObject({
  id: 'ossuary.wall.parapet',
  family: 'architecture',
  materialKey: 'darkStone',
  defaultScale: [1, 0.34, 1],
  castShadow: false,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'structural',
  visualBounds: [0.16, 1.25, 1.2],
  collision: { kind: 'box', colliderKind: 'wall', navigationBlocking: true },
  tags: ['architecture', 'parapet'],
})
