import { defineObject } from '../defineObject'

export const Archway = defineObject({
  id: 'ossuary.arch.full',
  family: 'architecture',
  materialKey: 'darkStone',
  castShadow: false,
  receiveShadow: true,
  renderMode: 'instanced',
  anchorPolicy: 'structural',
  visualBounds: [1.92, 1.1, 0.22],
  collision: { kind: 'none' },
  tags: ['architecture', 'opening'],
})
