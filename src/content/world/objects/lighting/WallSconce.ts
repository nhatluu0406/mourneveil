import { defineObject } from '../defineObject'

export const WallSconce = defineObject({
  id: 'ossuary.light.wall-sconce',
  family: 'lighting',
  materialKey: 'iron',
  castShadow: false,
  receiveShadow: false,
  renderMode: 'instanced',
  anchorPolicy: 'wall',
  lighting: { kind: 'emissive' },
  tags: ['lighting'],
})
