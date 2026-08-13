import { defineObject } from '../defineObject'

export const WallSconce = defineObject({
  id: 'ossuary.light.wall-sconce',
  family: 'lighting',
  materialKey: 'iron',
  castShadow: true,
  receiveShadow: false,
  renderMode: 'unique',
  anchorPolicy: 'wall',
  lighting: { kind: 'emissive' },
  tags: ['lighting'],
})
