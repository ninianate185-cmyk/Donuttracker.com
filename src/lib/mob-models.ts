/**
 * Vanilla Minecraft entity geometry (Java Edition 1.21.4 model layers), in model pixels:
 * y points down and the feet sit at y = 24, exactly as in the game's LayerDefinitions.
 * Paired with the untouched vanilla skins in public/assets/entity/.
 */

export type Box = {
  /** Texture offset of the box's UV net. */
  uv: [number, number]
  from: [number, number, number]
  size: [number, number, number]
  inflate?: number
  mirror?: boolean
}

export type Part = {
  name: string
  pivot: [number, number, number]
  /** Euler XYZ radians, applied Z then Y then X like ModelPart. */
  rot?: [number, number, number]
  boxes: Box[]
  children?: Part[]
}

export type MobModel = {
  texture: string
  texSize: [number, number]
  parts: Part[]
}

const QUARTER = Math.PI / 4
const box = (uv: [number, number], from: [number, number, number], size: [number, number, number], extra: Partial<Box> = {}): Box => ({ uv, from, size, ...extra })

function humanoid({ wide, skinny, legacy, armsForward }: { wide?: boolean; skinny?: boolean; legacy?: boolean; armsForward?: boolean }): Part[] {
  const limb: [number, number, number] = skinny ? [2, 12, 2] : [4, 12, 4]
  const armFrom: [number, number, number] = skinny ? [-1, -2, -1] : [-3, -2, -2]
  const legFrom: [number, number, number] = skinny ? [-1, 0, -1] : [-2, 0, -2]
  const legX = skinny ? 2 : 1.9
  const armRot: [number, number, number] | undefined = armsForward ? [-Math.PI / 2, 0, 0] : undefined
  const parts: Part[] = [
    { name: 'head', pivot: [0, 0, 0], boxes: [box([0, 0], [-4, -8, -4], [8, 8, 8]), box([32, 0], [-4, -8, -4], [8, 8, 8], { inflate: 0.5 })] },
    { name: 'body', pivot: [0, 0, 0], boxes: [box([16, 16], [-4, 0, -2], [8, 12, 4])] },
    { name: 'right_arm', pivot: [-5, 2, 0], rot: armRot, boxes: [box([40, 16], armFrom, limb)] },
    { name: 'left_arm', pivot: [5, 2, 0], rot: armRot, boxes: [legacy ? box([40, 16], skinny ? [-1, -2, -1] : [-1, -2, -2], limb, { mirror: true }) : box([32, 48], [-1, -2, -2], limb)] },
    { name: 'right_leg', pivot: [-legX, 12, 0], boxes: [box([0, 16], legFrom, limb)] },
    { name: 'left_leg', pivot: [legX, 12, 0], boxes: [legacy ? box([0, 16], legFrom, limb, { mirror: true }) : box([16, 48], legFrom, limb)] },
  ]
  if (wide) {
    // Player-style overlay layers used by the piglin family.
    parts[1].boxes.push(box([16, 32], [-4, 0, -2], [8, 12, 4], { inflate: 0.25 }))
    parts[2].boxes.push(box([40, 32], [-3, -2, -2], limb, { inflate: 0.25 }))
    parts[3].boxes.push(box([48, 48], [-1, -2, -2], limb, { inflate: 0.25 }))
    parts[4].boxes.push(box([0, 32], legFrom, limb, { inflate: 0.25 }))
    parts[5].boxes.push(box([0, 48], legFrom, limb, { inflate: 0.25 }))
  }
  return parts
}

function piglinHead(): Part {
  return {
    name: 'head',
    pivot: [0, 0, 0],
    boxes: [box([0, 0], [-5, -8, -4], [10, 8, 8]), box([31, 1], [-2, -4, -5], [4, 4, 1]), box([2, 4], [2, -2, -5], [1, 2, 1]), box([2, 0], [-3, -2, -5], [1, 2, 1])],
    children: [
      { name: 'left_ear', pivot: [4.5, -6, 0], rot: [0, 0, -Math.PI / 6], boxes: [box([51, 6], [0, 0, -2], [1, 5, 4])] },
      { name: 'right_ear', pivot: [-4.5, -6, 0], rot: [0, 0, Math.PI / 6], boxes: [box([39, 6], [-1, 0, -2], [1, 5, 4])] },
    ],
  }
}

function quadrupedLegs(height: number, y: number, x: number, zBack: number, zFront: number): Part[] {
  const size: [number, number, number] = [4, height, 4]
  return [
    { name: 'right_hind_leg', pivot: [-x, y, zBack], boxes: [box([0, 16], [-2, 0, -2], size)] },
    { name: 'left_hind_leg', pivot: [x, y, zBack], boxes: [box([0, 16], [-2, 0, -2], size, { mirror: true })] },
    { name: 'right_front_leg', pivot: [-x, y, zFront], boxes: [box([0, 16], [-2, 0, -2], size)] },
    { name: 'left_front_leg', pivot: [x, y, zFront], boxes: [box([0, 16], [-2, 0, -2], size, { mirror: true })] },
  ]
}

function spiderLegs(): Part[] {
  const middle = 0.58119464
  const yaw = [QUARTER, 0.3926991, -0.3926991, -QUARTER]
  const roll = [QUARTER, middle, middle, QUARTER]
  return [2, 1, 0, -1].flatMap((z, i) => [
    { name: `right_leg_${i}`, pivot: [-4, 15, z], rot: [0, yaw[i], -roll[i]], boxes: [box([18, 0], [-15, -1, -1], [16, 2, 2])] },
    { name: `left_leg_${i}`, pivot: [4, 15, z], rot: [0, -yaw[i], roll[i]], boxes: [box([18, 0], [-1, -1, -1], [16, 2, 2], { mirror: true })] },
  ]) as Part[]
}

/** Blaze rods orbit in three rings; positions are recomputed each frame by `animateBlaze`. */
const blazeRods = (): Part[] => Array.from({ length: 12 }, (_, i) => ({ name: `rod_${i}`, pivot: [0, 0, 0], boxes: [box([0, 16], [0, 0, 0], [2, 8, 2])] }))

export const MOB_MODELS: Record<string, MobModel> = {
  skeleton: { texture: 'entity/skeleton.png', texSize: [64, 32], parts: humanoid({ skinny: true, legacy: true }) },
  zombie: { texture: 'entity/zombie.png', texSize: [64, 64], parts: humanoid({ armsForward: true }) },
  zombified_piglin: {
    texture: 'entity/zombified_piglin.png',
    texSize: [64, 64],
    parts: humanoid({ wide: true, armsForward: true }).map((p) => (p.name === 'head' ? piglinHead() : p)),
  },
  creeper: {
    texture: 'entity/creeper.png',
    texSize: [64, 32],
    parts: [
      { name: 'head', pivot: [0, 6, 0], boxes: [box([0, 0], [-4, -8, -4], [8, 8, 8])] },
      { name: 'body', pivot: [0, 6, 0], boxes: [box([16, 16], [-4, 0, -2], [8, 12, 4])] },
      ...quadrupedLegs(6, 18, 2, 4, -4).map((p) => ({ ...p, boxes: p.boxes.map((b) => ({ ...b, mirror: false })) })),
    ],
  },
  spider: {
    texture: 'entity/spider.png',
    texSize: [64, 32],
    parts: [
      { name: 'head', pivot: [0, 15, -3], boxes: [box([32, 4], [-4, -4, -8], [8, 8, 8])] },
      { name: 'neck', pivot: [0, 15, 0], boxes: [box([0, 0], [-3, -3, -3], [6, 6, 6])] },
      { name: 'body', pivot: [0, 15, 9], boxes: [box([0, 12], [-5, -4, -6], [10, 8, 12])] },
      ...spiderLegs(),
    ],
  },
  pig: {
    texture: 'entity/pig.png',
    texSize: [64, 32],
    parts: [
      { name: 'head', pivot: [0, 12, -6], boxes: [box([0, 0], [-4, -4, -8], [8, 8, 8]), box([16, 16], [-2, 0, -9], [4, 3, 1])] },
      { name: 'body', pivot: [0, 11, 2], rot: [Math.PI / 2, 0, 0], boxes: [box([28, 8], [-5, -10, -7], [10, 16, 8])] },
      ...quadrupedLegs(6, 18, 3, 7, -5),
    ],
  },
  cow: {
    texture: 'entity/cow.png',
    texSize: [64, 32],
    parts: [
      { name: 'head', pivot: [0, 4, -8], boxes: [box([0, 0], [-4, -4, -6], [8, 8, 6]), box([22, 0], [-5, -5, -4], [1, 3, 1]), box([22, 0], [4, -5, -4], [1, 3, 1])] },
      { name: 'body', pivot: [0, 5, 2], rot: [Math.PI / 2, 0, 0], boxes: [box([18, 4], [-6, -10, -7], [12, 18, 10]), box([52, 0], [-2, 2, -8], [4, 6, 1])] },
      ...quadrupedLegs(12, 12, 4, 7, -6),
    ],
  },
  blaze: {
    texture: 'entity/blaze.png',
    texSize: [64, 32],
    parts: [{ name: 'head', pivot: [0, 0, 0], boxes: [box([0, 0], [-4, -4, -4], [8, 8, 8])] }, ...blazeRods()],
  },
  iron_golem: {
    texture: 'entity/iron_golem.png',
    texSize: [128, 128],
    parts: [
      { name: 'head', pivot: [0, -7, -2], boxes: [box([0, 0], [-4, -12, -5.5], [8, 10, 8]), box([24, 0], [-1, -5, -7.5], [2, 4, 2])] },
      { name: 'body', pivot: [0, -7, 0], boxes: [box([0, 40], [-9, -2, -6], [18, 12, 11]), box([0, 70], [-4.5, 10, -3], [9, 5, 6], { inflate: 0.5 })] },
      { name: 'right_arm', pivot: [0, -7, 0], boxes: [box([60, 21], [-13, -2.5, -3], [4, 30, 6])] },
      { name: 'left_arm', pivot: [0, -7, 0], boxes: [box([60, 58], [9, -2.5, -3], [4, 30, 6])] },
      { name: 'right_leg', pivot: [-4, 11, 0], boxes: [box([37, 0], [-3.5, -3, -3], [6, 16, 5])] },
      { name: 'left_leg', pivot: [5, 11, 0], boxes: [box([60, 0], [-3.5, -3, -3], [6, 16, 5], { mirror: true })] },
    ],
  },
}

/** BlazeModel.setupAnim: three rings of four rods bobbing around the head. */
export function blazeRodPivot(i: number, t: number): [number, number, number] {
  const ring = Math.floor(i / 4)
  const k = i % 4
  const [radius, baseY, speed, phaseScale, bob] = [
    [9, -2, -0.05, 2, 0.25],
    [7, 2, 0.02, 2, 0.25],
    [5, 11, -0.0375, 1.5, 0.5],
  ][ring]
  const angle = t * Math.PI * speed + (k * Math.PI) / 2 + (ring === 1 ? QUARTER : 0)
  return [Math.cos(angle) * radius, baseY + Math.cos((k * phaseScale + t) * bob), Math.sin(angle) * radius]
}
