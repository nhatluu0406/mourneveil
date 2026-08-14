import { defineObject } from '../defineObject'

export const Buttress = defineObject({
  id: 'ossuary.buttress',
  family: 'architecture',
  materialKey: 'darkStone',
  castShadow: false,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'structural',
  visualBounds: [0.42, 2.04, 0.4],
  collision: { kind: 'box', colliderKind: 'blocker', navigationBlocking: true },
  tags: ['architecture', 'support'],
})
