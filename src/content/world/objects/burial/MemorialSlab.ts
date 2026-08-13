import { defineObject } from '../defineObject'

export const MemorialSlab = defineObject({
  id: 'ossuary.memorial.cluster',
  family: 'burial',
  materialKey: 'darkStone',
  castShadow: true,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'floor',
  visualBounds: [0.8, 0.85, 0.28],
  collision: { kind: 'none' },
  tags: ['burial'],
})
