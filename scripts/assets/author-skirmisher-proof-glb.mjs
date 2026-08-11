class FileReaderPolyfill {
  result = null
  onloadend = null
  onload = null
  onerror = null
  readyState = 0
  error = null
  readAsArrayBuffer(blob) {
    Promise.resolve(blob.arrayBuffer())
      .then((buffer) => {
        this.result = buffer
        this.readyState = 2
        this.onload?.({ target: this })
        this.onloadend?.({ target: this })
      })
      .catch((error) => {
        this.error = error
        this.onerror?.({ target: this })
        this.onloadend?.({ target: this })
      })
  }
}
globalThis.FileReader = FileReaderPolyfill

﻿/**
 * Deterministic project-authored skinned skirmisher proof GLB.
 * Generates source under assets/source; import copies to public/assets.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sourcePath = path.join(
  repoRoot,
  'assets/source/enemies/skirmisher/skirmisher-proof.glb',
)

function bone(name, y) {
  const result = new THREE.Bone()
  result.name = name
  result.position.y = y
  return result
}

function buildRig() {
  const hips = bone('Hips', 0.42)
  const spine = bone('Spine', 0.28)
  const chest = bone('Chest', 0.22)
  const head = bone('Head', 0.22)
  const leftArm = bone('LeftArm', 0.16)
  leftArm.position.x = -0.16
  const rightArm = bone('RightArm', 0.16)
  rightArm.position.x = 0.16
  const leftLeg = bone('LeftLeg', -0.22)
  leftLeg.position.x = -0.08
  const rightLeg = bone('RightLeg', -0.22)
  rightLeg.position.x = 0.08

  hips.add(spine)
  spine.add(chest)
  chest.add(head, leftArm, rightArm)
  hips.add(leftLeg, rightLeg)

  return new THREE.Skeleton([hips, spine, chest, head, leftArm, rightArm, leftLeg, rightLeg])
}

function buildSkinnedMesh(skeleton) {
  const geometry = new THREE.BoxGeometry(0.34, 0.95, 0.28, 1, 4, 1)
  geometry.translate(0, 0.48, 0)
  const position = geometry.getAttribute('position')
  const skinIndex = []
  const skinWeight = []
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i)
    if (y < 0.28) {
      skinIndex.push(0, y < 0.18 ? (position.getX(i) < 0 ? 6 : 7) : 1, 0, 0)
      skinWeight.push(0.55, 0.45, 0, 0)
    } else if (y < 0.62) {
      skinIndex.push(1, 2, 0, 0)
      skinWeight.push(0.45, 0.55, 0, 0)
    } else if (y < 0.82) {
      skinIndex.push(
        2,
        Math.abs(position.getX(i)) > 0.1 ? (position.getX(i) < 0 ? 4 : 5) : 3,
        0,
        0,
      )
      skinWeight.push(0.5, 0.5, 0, 0)
    } else {
      skinIndex.push(3, 2, 0, 0)
      skinWeight.push(0.75, 0.25, 0, 0)
    }
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4))

  const material = new THREE.MeshStandardMaterial({
    color: 0x5f8f78,
    roughness: 0.78,
    metalness: 0.04,
    name: 'SkirmisherProofBody',
  })
  const mesh = new THREE.SkinnedMesh(geometry, material)
  mesh.name = 'SkirmisherProofMesh'
  mesh.add(skeleton.bones[0])
  mesh.bind(skeleton)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function trackQuaternion(nodeName, times, values) {
  return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values)
}

function trackPosition(nodeName, times, values) {
  return new THREE.VectorKeyframeTrack(`${nodeName}.position`, times, values)
}

function quatAxis(axis, radians) {
  const q = new THREE.Quaternion().setFromAxisAngle(axis, radians)
  return [q.x, q.y, q.z, q.w]
}

function quatX(radians) {
  return quatAxis(new THREE.Vector3(1, 0, 0), radians)
}

function quatY(radians) {
  return quatAxis(new THREE.Vector3(0, 1, 0), radians)
}

function quatZ(radians) {
  return quatAxis(new THREE.Vector3(0, 0, 1), radians)
}

function buildClips() {
  return [
    new THREE.AnimationClip('Clip_Skirm_Idle', 1.6, [
      trackPosition('Hips', [0, 0.8, 1.6], [0, 0.42, 0, 0, 0.432, 0, 0, 0.42, 0]),
      trackQuaternion('Chest', [0, 0.8, 1.6], [...quatX(0.02), ...quatX(-0.02), ...quatX(0.02)]),
    ]),
    new THREE.AnimationClip('Clip_Skirm_Walk', 0.8, [
      trackQuaternion('LeftLeg', [0, 0.4, 0.8], [...quatX(0.35), ...quatX(-0.35), ...quatX(0.35)]),
      trackQuaternion('RightLeg', [0, 0.4, 0.8], [...quatX(-0.35), ...quatX(0.35), ...quatX(-0.35)]),
      trackQuaternion('LeftArm', [0, 0.4, 0.8], [...quatX(-0.25), ...quatX(0.25), ...quatX(-0.25)]),
      trackQuaternion('RightArm', [0, 0.4, 0.8], [...quatX(0.25), ...quatX(-0.25), ...quatX(0.25)]),
      trackPosition('Hips', [0, 0.4, 0.8], [0, 0.42, 0, 0, 0.445, 0, 0, 0.42, 0]),
    ]),
    new THREE.AnimationClip('Clip_Skirm_Strike', 0.7, [
      trackQuaternion('RightArm', [0, 0.25, 0.4, 0.7], [
        ...quatX(-0.55),
        ...quatX(-0.9),
        ...quatX(0.85),
        ...quatX(0.15),
      ]),
      trackQuaternion('Chest', [0, 0.25, 0.4, 0.7], [
        ...quatY(-0.15),
        ...quatY(-0.35),
        ...quatY(0.45),
        ...quatY(0),
      ]),
      trackPosition('Hips', [0, 0.4, 0.7], [0, 0.42, 0, 0, 0.4, -0.04, 0, 0.42, 0]),
    ]),
    new THREE.AnimationClip('Clip_Skirm_Hit', 0.35, [
      trackQuaternion('Chest', [0, 0.12, 0.35], [...quatX(0), ...quatX(-0.35), ...quatX(-0.05)]),
      trackPosition('Hips', [0, 0.12, 0.35], [0, 0.42, 0, 0, 0.4, 0.05, 0, 0.42, 0]),
    ]),
    new THREE.AnimationClip('Clip_Skirm_Death', 0.9, [
      trackQuaternion('Hips', [0, 0.45, 0.9], [...quatZ(0), ...quatZ(1.1), ...quatZ(1.35)]),
      trackPosition('Hips', [0, 0.45, 0.9], [0, 0.42, 0, 0, 0.22, 0.08, 0, 0.12, 0.12]),
    ]),
  ]
}

const skeleton = buildRig()
const mesh = buildSkinnedMesh(skeleton)
const root = new THREE.Group()
root.name = 'SkirmisherProofRoot'
root.add(mesh)

const exporter = new GLTFExporter()
const arrayBuffer = await new Promise((resolve, reject) => {
  exporter.parse(
    root,
    (result) => resolve(result),
    (error) => reject(error),
    {
      binary: true,
      animations: buildClips(),
      onlyVisible: false,
    },
  )
})

await mkdir(path.dirname(sourcePath), { recursive: true })
await writeFile(sourcePath, Buffer.from(arrayBuffer))
console.log(`[assets] authored ${path.relative(repoRoot, sourcePath)} (${arrayBuffer.byteLength} bytes)`)
