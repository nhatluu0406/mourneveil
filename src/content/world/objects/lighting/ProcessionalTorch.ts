import { defineObject } from '../defineObject'

export const ProcessionalTorch = defineObject({
  id: 'ossuary.light.processional-torch',
  family: 'lighting',
  materialKey: 'iron',
  castShadow: true,
  receiveShadow: false,
  renderMode: 'unique',
  anchorPolicy: 'floor',
  lighting: { kind: 'emissive' },
  tags: ['lighting'],
})
