import * as THREE from 'three'
import type { Box, MobModel, Part } from '@/lib/mob-models.ts'

/** One textured cuboid laid out exactly like ModelPart.Cube: same vertex order, UV net and mirroring. */
function cuboid({ uv: [u, v], from, size: [w, h, d], inflate = 0, mirror = false }: Box, [tw, th]: [number, number]) {
  let x0 = from[0] - inflate
  let x1 = from[0] + w + inflate
  const y0 = from[1] - inflate
  const y1 = from[1] + h + inflate
  const z0 = from[2] - inflate
  const z1 = from[2] + d + inflate
  if (mirror) [x0, x1] = [x1, x0]

  const p = [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ]
  const faces: [number[], number, number, number, number][] = [
    [[5, 4, 0, 1], u + d, v, u + d + w, v + d],
    [[2, 3, 7, 6], u + d + w, v + d, u + d + w + w, v],
    [[0, 4, 7, 3], u, v + d, u + d, v + d + h],
    [[1, 0, 3, 2], u + d, v + d, u + d + w, v + d + h],
    [[5, 1, 2, 6], u + d + w, v + d, u + d + w + d, v + d + h],
    [[4, 5, 6, 7], u + d + w + d, v + d, u + d + w + d + w, v + d + h],
  ]

  const positions: number[] = []
  const uvs: number[] = []
  for (const [idx, u0, v0, u1, v1] of faces) {
    let quad = [
      { pos: p[idx[0]], uv: [u1, v0] },
      { pos: p[idx[1]], uv: [u0, v0] },
      { pos: p[idx[2]], uv: [u0, v1] },
      { pos: p[idx[3]], uv: [u1, v1] },
    ]
    if (mirror) quad = quad.reverse()
    for (const i of [0, 1, 2, 0, 2, 3]) {
      positions.push(...quad[i].pos)
      uvs.push(quad[i].uv[0] / tw, quad[i].uv[1] / th)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.computeVertexNormals()
  return geo
}

export function loadPixelTexture(url: string) {
  const tex = new THREE.TextureLoader().load(url)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function buildPart(part: Part, model: MobModel, material: THREE.Material, parts: Map<string, THREE.Object3D>) {
  const group = new THREE.Group()
  group.name = part.name
  group.position.set(...part.pivot)
  if (part.rot) group.rotation.set(part.rot[0], part.rot[1], part.rot[2], 'ZYX')
  for (const b of part.boxes) group.add(new THREE.Mesh(cuboid(b, model.texSize), material))
  for (const child of part.children ?? []) group.add(buildPart(child, model, material, parts))
  parts.set(part.name, group)
  return group
}

/**
 * Builds the mob in model space, then flips it upright (the game renders with scale(-1, -1, 1)).
 * Returns a group whose origin is at the mob's feet, sized in pixels (16 = one block).
 */
export function buildMob(model: MobModel, texture: THREE.Texture) {
  const material = new THREE.MeshLambertMaterial({ map: texture, alphaTest: 0.1, side: THREE.DoubleSide })
  const parts = new Map<string, THREE.Object3D>()
  const inner = new THREE.Group()
  for (const part of model.parts) inner.add(buildPart(part, model, material, parts))
  inner.scale.set(-1, -1, 1)
  inner.position.y = 24
  // Face the viewer: model space looks toward -z.
  inner.rotation.y = Math.PI
  const root = new THREE.Group()
  root.add(inner)
  const bounds = new THREE.Box3().setFromObject(root)
  return { root, parts, bounds, material }
}
