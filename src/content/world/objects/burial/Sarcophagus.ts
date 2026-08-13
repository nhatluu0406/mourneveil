import { defineObject } from '../defineObject'

export const Sarcophagus = defineObject({
  id: 'ossuary.sarcophagus.body',
  family: 'burial',
  materialKey: 'darkStone',
  castShadow: true,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'floor',
  visualBounds: [0.72, 0.42, 1.25],
  collision: { kind: 'box', colliderKind: 'blocker', navigationBlocking: true },
  tags: ['burial'],
})
