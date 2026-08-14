import { defineObject } from '../defineObject'

export const Brazier = defineObject({
  id: 'ossuary.light.brazier',
  family: 'lighting',
  materialKey: 'bronze',
  castShadow: false,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'floor',
  visualBounds: [0.72, 1.05, 0.72],
  collision: { kind: 'box', colliderKind: 'blocker', navigationBlocking: true, offset: [0, 0.525, 0] },
  lighting: { kind: 'actual' },
  tags: ['lighting'],
})
