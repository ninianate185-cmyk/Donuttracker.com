import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { asset } from '@/data/catalog.ts'
import { MOB_MODELS, blazeRodPivot } from '@/lib/mob-models.ts'
import { buildMob, loadPixelTexture } from '@/lib/mob-mesh.ts'
import type { SpawnerType } from '@/lib/types.ts'

/** Vanilla entity hitboxes (width, height) in blocks; SpawnerRenderer scales the mob by 0.53125 / max(w, h). */
const HITBOX: Record<string, [number, number]> = {
  skeleton: [0.6, 1.99],
  zombie: [0.6, 1.95],
  zombified_piglin: [0.6, 1.95],
  spider: [1.4, 0.9],
  creeper: [0.6, 1.7],
  pig: [0.9, 0.9],
  cow: [0.9, 1.4],
  blaze: [0.6, 1.8],
  iron_golem: [1.4, 2.7],
}

const TARGET = new THREE.Vector3(0, 8, 0)

/**
 * A real-time 3D Minecraft spawner: the vanilla cage block with the vanilla entity model spinning inside,
 * posed the way SpawnerRenderer draws it. Drag or use arrow keys to orbit; click or Enter throws embers.
 */
export function SpawnerStage({ type }: { type: SpawnerType }) {
  const reduce = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const orbit = useRef({ azimuth: 0.62, elevation: 0.42, hoverX: 0, hoverY: 0, dragging: false, moved: 0, lastX: 0, lastY: 0 })
  const [bursts, setBursts] = useState<number[]>([])
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const el = host.current
    const model = MOB_MODELS[type.id]
    if (!el || !model) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFallback(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.className = 'absolute inset-0 size-full'
    el.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 400)
    scene.add(new THREE.AmbientLight(0xffffff, 1.9))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(20, 40, 30)
    scene.add(sun)
    const glow = new THREE.PointLight(0xffa040, 45, 30)
    glow.position.set(0, 5, 0)
    scene.add(glow)

    // The spawner block: one cube_all model with the cutout cage texture, back faces culled like chunk rendering.
    const cageTex = loadPixelTexture(asset('entity/spawner_block.png'))
    cageTex.flipY = true // BoxGeometry UVs are bottom-up, unlike the entity nets.
    const cageMat = new THREE.MeshLambertMaterial({ map: cageTex, alphaTest: 0.5 })
    const cageGeo = new THREE.BoxGeometry(16, 16, 16)
    const cage = new THREE.Mesh(cageGeo, cageMat)
    cage.position.y = 8
    scene.add(cage)

    const mobTex = loadPixelTexture(asset(model.texture))
    const mob = buildMob(model, mobTex)
    const [w, h] = HITBOX[type.id] ?? [1, 1]
    const spin = new THREE.Group()
    spin.position.y = 0.4 * 16
    const tilt = new THREE.Group()
    tilt.position.y = -0.2 * 16
    tilt.rotation.x = THREE.MathUtils.degToRad(-30)
    const s = Math.min(1, 0.53125 / Math.max(w, h))
    // Model pixels are 1/16 block, the scene is in pixels, so the in-game scale applies directly.
    mob.root.scale.setScalar(s)
    tilt.add(mob.root)
    spin.add(tilt)
    scene.add(spin)

    // Flame and smoke specks drifting up through the cage, as the block emits them in game.
    const specks = Array.from({ length: 10 }, (_, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xffb547 : 0x6b6b6b, transparent: true }))
      m.userData.seed = Math.random() * 10
      scene.add(m)
      return m
    })

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(1, height)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const clock = new THREE.Clock()
    let frame = 0
    let last = 0
    const tick = () => {
      const t = clock.getElapsedTime()
      const o = orbit.current
      // Slow turntable orbit; pauses while the viewer drags so their angle sticks.
      if (!reduce && !o.dragging) o.azimuth += (t - last) * 0.35
      last = t
      const az = o.azimuth + o.hoverX * 0.25
      const elev = THREE.MathUtils.clamp(o.elevation - o.hoverY * 0.15, -0.2, 1.3)
      const dist = 66
      camera.position.set(Math.sin(az) * Math.cos(elev) * dist, TARGET.y + Math.sin(elev) * dist, Math.cos(az) * Math.cos(elev) * dist)
      camera.lookAt(TARGET)

      if (!reduce) {
        // SpawnerBlockEntity spins the display mob at 1000 / (spawnDelay + 200) degrees per tick.
        spin.rotation.y = t * 2.2
        if (type.id === 'blaze') {
          for (let i = 0; i < 12; i++) mob.parts.get(`rod_${i}`)?.position.set(...blazeRodPivot(i, t * 20))
        }
        for (const sp of specks) {
          const k = (t * 0.35 + sp.userData.seed) % 1
          const seed = sp.userData.seed
          sp.position.set(Math.sin(seed * 7) * 6, 2 + k * 15, Math.cos(seed * 5) * 6)
          sp.quaternion.copy(camera.quaternion)
          ;(sp.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.9
        }
      } else {
        spin.rotation.y = 0.6
        if (type.id === 'blaze') for (let i = 0; i < 12; i++) mob.parts.get(`rod_${i}`)?.position.set(...blazeRodPivot(i, 0))
        for (const sp of specks) sp.visible = false
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          ;(obj.material as THREE.Material).dispose()
        }
      })
      cageTex.dispose()
      mobTex.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [type.id, reduce])

  const burst = () => {
    if (reduce) return
    const id = Date.now()
    setBursts((b) => [...b.slice(-2), id])
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 1400)
  }

  return (
    <div
      ref={host}
      role="group"
      tabIndex={0}
      aria-label={`${type.name} spawner, 3D. Drag or use arrow keys to rotate; press Enter for embers.`}
      className="relative grid h-full w-full cursor-grab touch-none place-items-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      onPointerDown={(e) => {
        const o = orbit.current
        o.dragging = true
        o.moved = 0
        o.lastX = e.clientX
        o.lastY = e.clientY
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerUp={() => (orbit.current.dragging = false)}
      onPointerMove={(e) => {
        const o = orbit.current
        if (o.dragging) {
          o.moved += Math.abs(e.clientX - o.lastX) + Math.abs(e.clientY - o.lastY)
          o.azimuth -= (e.clientX - o.lastX) * 0.01
          o.elevation = THREE.MathUtils.clamp(o.elevation + (e.clientY - o.lastY) * 0.008, -0.2, 1.3)
          o.lastX = e.clientX
          o.lastY = e.clientY
          return
        }
        const r = e.currentTarget.getBoundingClientRect()
        o.hoverX = ((e.clientX - r.left) / r.width) * 2 - 1
        o.hoverY = ((e.clientY - r.top) / r.height) * 2 - 1
      }}
      onPointerLeave={() => {
        orbit.current.hoverX = 0
        orbit.current.hoverY = 0
      }}
      onClick={() => orbit.current.moved < 6 && burst()}
      onKeyDown={(e) => {
        const o = orbit.current
        if (e.key === 'ArrowLeft') o.azimuth += 0.25
        else if (e.key === 'ArrowRight') o.azimuth -= 0.25
        else if (e.key === 'ArrowUp') o.elevation = Math.min(1.3, o.elevation + 0.15)
        else if (e.key === 'ArrowDown') o.elevation = Math.max(-0.2, o.elevation - 0.15)
        else if (e.key === 'Enter' || e.key === ' ') burst()
        else return
        e.preventDefault()
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-[22%] rounded-full bg-[radial-gradient(circle,#ffb54744,#ff7aa822_45%,transparent_70%)] blur-xl" />
      {fallback && <img src={asset('renders/spawner.png')} alt={`${type.name} spawner`} width={256} height={256} draggable={false} className="pixelated relative w-56" />}
      {bursts.map((id) => (
        <div key={id} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[30%] flex justify-center">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="absolute size-1.5 rounded-[1px] bg-ember shadow-[0_0_8px_var(--ember)]"
              style={{ left: `calc(50% + ${(i - 7) * 9}px)`, animation: `ember-rise ${0.8 + (i % 4) * 0.15}s ease-out forwards`, ['--dx' as string]: `${(i - 7) * 6}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
