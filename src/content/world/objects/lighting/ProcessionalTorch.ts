import { defineObject } from '../defineObject'

export const ProcessionalTorch = defineObject({
  id: 'ossuary.light.processional-torch',
  family: 'lighting',
  materialKey: 'iron',
  castShadow: false,
  receiveShadow: false,
  renderMode: 'instanced',
  anchorPolicy: 'floor',
  lighting: { kind: 'emissive' },
  tags: ['lighting'],
})
