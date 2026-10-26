# Spawner models

Spawners render in real-time 3D with three.js (`src/components/spawner-stage.tsx`). Nothing is AI-generated:

- **Cage:** the vanilla `cube_all` spawner block with the unmodified `block/spawner.png` cutout texture.
- **Mobs:** vanilla Java Edition 1.21.4 entity geometry, with box sizes, pivots and UV offsets ported from the game's model layers into `src/lib/mob-models.ts`. Each mob is skinned with its unmodified vanilla texture.
- **Pose:** matches `SpawnerRenderer`: the mob is scaled by `0.53125 / max(hitbox width, height)`, tilted 30° and spun inside the cage.

Textures in `public/assets/entity/` come from the versioned mcasset.cloud mirror of Minecraft 1.21.4 (`https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/…`): `block/spawner`, `entity/skeleton/skeleton`, `entity/zombie/zombie`, `entity/spider/spider`, `entity/creeper/creeper`, `entity/pig/pig`, `entity/cow/cow`, `entity/blaze`, `entity/piglin/zombified_piglin` and `entity/iron_golem/iron_golem`.

# Item art

All 1,505 vanilla registry entries use inventory images rendered natively in Minecraft by [Owen1212055/mc-assets](https://github.com/Owen1212055/mc-assets), pinned to commit `798494f03c20bbb577dd7fcd10e8737dbc0dfc0a`. Original 256×256 PNGs are hosted locally in `public/assets/renders/`. Provenance is in `data/native-render-source.json`.

Fallback textures from the versioned mcasset.cloud public collection and legacy custom SVG head icons remain in `public/assets/` for compatibility. `renders/spawner.png` is shown in place of the 3D stage when WebGL is unavailable.
