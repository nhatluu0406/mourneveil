import { defineObject } from '../defineObject'

export const Brazier = defineObject({
  id: 'ossuary.light.brazier',
  family: 'lighting',
  materialKey: 'bronze',
  castShadow: true,
  receiveShadow: true,
  renderMode: 'unique',
  anchorPolicy: 'floor',
  lighting: { kind: 'actual' },
  tags: ['lighting'],
})
