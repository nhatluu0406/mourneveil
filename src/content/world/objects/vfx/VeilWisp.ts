import { defineObject } from '../defineObject'

export const VeilWisp = defineObject({
  id: 'ossuary.wisp',
  family: 'vfx',
  materialKey: 'veil',
  castShadow: false,
  receiveShadow: false,
  renderMode: 'instanced',
  anchorPolicy: 'vfx',
  tags: ['vfx'],
})
