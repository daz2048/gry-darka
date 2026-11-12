import test from 'node:test';
import assert from 'node:assert/strict';
import { World, SIZE, BLOCKS, VILLAGES, nearbyChunks, chunkGeometry, waterGeometry, pick } from '../world.js';
import { ATLAS_COLUMNS, ATLAS_ROWS } from '../textures.js';
import { createPlayer, collides, stepPlayer } from '../player.js';
import { createMobs, createMobModel, stepMobs } from '../mobs.js';
import * as THREE from '../vendor/three.module.js';

function empty() {
  const world = new World();
  world.blocks.fill(0);
  world.water.fill(0);
  world.dirty.clear();
  return world;
}

test('seeded lakes are shallow, deterministic and clear of villages and spawn', () => {
  for (let seed = 0; seed < 20; seed++) {
    const world = new World(seed);
    assert.deepEqual(world.water, new World(seed).water);
    for (const [x, z] of [[17, 14], [32, 51]]) {
      const levels = Array.from({ length: SIZE[1] }, (_, y) => y).filter(y => world.getWater(x, y, z));
      assert.equal(levels.length, 1);
      const y = levels[0];
      assert.equal(world.get(x, y - 1, z), 6);
      assert.equal(world.get(x, y + 1, z), 0);
      assert.equal(world.solid(x, y, z), false);
      const player = { x: x + 0.5, y, z: z + 0.5, vy: 0, grounded: false };
      for (let frame = 0; frame < 60; frame++) stepPlayer(world, player, {}, 0, 1 / 60);
      assert.equal(player.grounded, true);
      stepPlayer(world, player, { jump: true }, 0, 1 / 60);
      assert.ok(player.vy > 0);
      if (x === 32) {
        for (let frame = 0; frame < 240; frame++) {
          stepPlayer(world, player, { forward: true, jump: true }, 0, 1 / 60);
        }
        assert.ok(player.z < 45, `player can leave the lake in seed ${seed}`);
      }
    }
    for (let x = 5; x <= 58; x++) for (let z = 24; z <= 44; z++) {
      for (let y = 0; y < SIZE[1]; y++) assert.equal(world.getWater(x, y, z), false);
    }
    assert.equal(collides(world, createPlayer(world)), false);
  }
});

test('water faces cull across chunks and reappear when a placed block is removed', () => {
  const world = empty();
  world.water[world.index(15, 5, 5)] = 1;
  world.water[world.index(16, 5, 5)] = 1;
  assert.equal(waterGeometry(world, 0, 0, 0).indices.length / 6, 5);
  assert.equal(waterGeometry(world, 1, 0, 0).indices.length / 6, 5);
  assert.equal(world.edit(15, 5, 5, 3), null);
  assert.equal(world.getWater(15, 5, 5), false);
  assert.equal(waterGeometry(world, 0, 0, 0).indices.length, 0);
  assert.equal(waterGeometry(world, 1, 0, 0).indices.length / 6, 5);
  assert.ok(world.dirty.has('0,0,0'));
  assert.ok(world.dirty.has('1,0,0'));
  assert.equal(world.edit(15, 5, 5, 0), null);
  assert.equal(world.getWater(15, 5, 5), true);
  assert.equal(waterGeometry(world, 0, 0, 0).indices.length / 6, 5);
});

test('generation is deterministic, bounded and has a safe supported spawn for 20 seeds', () => {
  for (let seed = 0; seed < 20; seed++) {
    const world = new World(seed);
    assert.deepEqual(world.blocks, new World(seed).blocks);
    assert.equal(world.blocks.length, SIZE[0] * SIZE[1] * SIZE[2]);
    assert.ok(SIZE[0] >= 256 && SIZE[2] >= 256);
    assert.ok(world.blocks.every(id => id < BLOCKS.length));
    const player = createPlayer(world);
    assert.equal(collides(world, player), false);
    for (let i = 0; i < 120; i++) stepPlayer(world, player, {}, 0, 1 / 60);
    assert.ok(player.grounded);
    assert.ok(player.y >= 8 && player.y < 8.05);
  }
  assert.notDeepEqual(new World(1).blocks, new World(2).blocks);
});

test('generation includes two distinct houses with open doors and a clear spawn', () => {
  const world = new World();
  for (const house of [
    { minX: 24, maxX: 30, minZ: 35, maxZ: 41, floor: 17, wall: 10, roof: 8 },
    { minX: 35, maxX: 41, minZ: 35, maxZ: 41, floor: 16, wall: 9, roof: 20 }
  ]) {
    const doorX = Math.floor((house.minX + house.maxX) / 2);
    assert.equal(world.get(house.minX, 10, house.minZ), house.wall);
    assert.equal(world.get(doorX, 8, house.minZ + 1), house.floor);
    assert.equal(world.get(doorX, 15, house.minZ + 1), house.roof);
    for (let y = 9; y <= 11; y++) assert.equal(world.get(doorX, y, house.maxZ), 0);
  }
  assert.equal(collides(world, createPlayer(world)), false);
});

test('villages connect by roads and contain seeded mineable ore veins', () => {
  const world = new World();
  assert.deepEqual(world.blocks, new World().blocks);
  for (const [x, z, wall] of [[7, 25, 10], [14, 36, 9], [44, 25, 12], [51, 36, 10]]) {
    assert.equal(world.get(x, 10, z), wall);
  }
  for (const x of [6, 32, 56]) for (let z = 32; z <= 34; z++) {
    assert.equal(world.get(x, 7, z), 6);
  }
  assert.equal(world.get(9, 8, 38), 11);
  assert.equal(world.get(10, 8, 38), 6);
  for (let id = 25; id <= 29; id++) assert.ok(world.blocks.includes(id));
});

test('distant villages have distinct homes and continuous walkable roads', () => {
  const world = new World();
  for (const village of VILLAGES) {
    assert.equal(world.get(village.x - 10, 10, village.z - 10), village.wall);
    assert.equal(world.get(village.x - 7, 15, village.z - 9), village.roof);
    assert.equal(world.get(village.x + 6, 8, village.z + 7), 11);
  }
  assert.equal(new Set(VILLAGES.map(({ wall, roof }) => `${wall},${roof}`)).size, VILLAGES.length);
  assert.equal(world.get(124, 13, 68), 17);
  assert.equal(world.get(208, 18, 92), 20);
  assert.equal(world.get(112, 17, 180), 22);
  assert.equal(world.get(208, 17, 204), 22);
  const routes = [
    [58, 33, 112, 33], [112, 33, 112, 56], [112, 56, 196, 56],
    [196, 56, 196, 80], [112, 56, 112, 168], [100, 168, 112, 168],
    [100, 168, 196, 168], [196, 168, 196, 192]
  ];
  for (const [x1, z1, x2, z2] of routes) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(z2 - z1));
    for (let n = 0; n <= steps; n++) {
      const x = x1 + Math.sign(x2 - x1) * n, z = z1 + Math.sign(z2 - z1) * n;
      assert.ok(world.get(x, 7, z), `road supported at ${x},${z}`);
      assert.equal(collides(world, { x: x + 0.5, y: 8, z: z + 0.5 }), false, `road clear at ${x},${z}`);
    }
  }
});

test('forests and ore extend across the expanded world without trees growing on trees', () => {
  const world = new World();
  for (const [minX, minZ] of [[64, 0], [0, 64], [64, 64], [192, 192]]) {
    let logs = 0, ores = 0;
    for (let x = minX; x < Math.min(minX + 64, SIZE[0]); x++) {
      for (let z = minZ; z < Math.min(minZ + 64, SIZE[2]); z++) {
        for (let y = 0; y < SIZE[1]; y++) {
          const block = world.get(x, y, z);
          if (block === 4) {
            logs++;
            assert.ok(y <= 14, `tree trunk too high at ${x},${y},${z}`);
          }
          if (block >= 25) ores++;
        }
      }
    }
    assert.ok(logs > 20, `trees near ${minX},${minZ}`);
    assert.ok(ores > 20, `ores near ${minX},${minZ}`);
  }
});

test('nearby chunks are bounded and distant edits survive leaving and returning', () => {
  const world = new World();
  const initial = nearbyChunks(world.spawn.x, world.spawn.z);
  const distant = nearbyChunks(200, 200);
  assert.ok(initial.size <= 162 && distant.size <= 162);
  assert.ok(!initial.has('12,1,12'));
  assert.ok(distant.has('12,1,12'));
  assert.equal(world.edit(200, 20, 200, 7), null);
  assert.ok(world.dirty.has('12,1,12'));
  assert.equal(chunkGeometry(world, 12, 1, 12).indices.length, 36);
  assert.ok(!nearbyChunks(32, 39).has('12,1,12'));
  assert.ok(nearbyChunks(200, 200).has('12,1,12'));
  assert.equal(world.get(200, 20, 200), 7);
  assert.equal(chunkGeometry(world, 12, 1, 12).indices.length, 36);
  for (const key of nearbyChunks(0, 0)) {
    assert.ok(key.split(',').every(n => Number(n) >= 0));
  }
  for (const key of nearbyChunks(SIZE[0] - 1, SIZE[2] - 1)) {
    const [x, y, z] = key.split(',').map(Number);
    assert.ok(x < SIZE[0] / 16 && y < SIZE[1] / 16 && z < SIZE[2] / 16);
  }
});

test('farm animals, village golems and residents wander safely and deterministically', () => {
  const world = new World();
  const comparisonWorld = new World();
  const mobs = createMobs(world);
  const comparison = createMobs(comparisonWorld);
  assert.deepEqual(mobs.slice(0, 7).map(mob => mob.kind),
    ['cow', 'sheep', 'pig', 'chicken', 'ironGolem', 'ironGolem', 'ironGolem']);
  assert.equal(mobs.filter(mob => mob.kind === 'ironGolem').length, 3);
  assert.equal(mobs.filter(mob => mob.kind === 'villager').length, 19);
  assert.equal(mobs.filter(mob => mob.kind === 'fox').length, 4);
  assert.equal(mobs.filter(mob => mob.kind === 'rabbit').length, 4);
  for (const mob of mobs) {
    if (mob.kind === 'ironGolem') assert.ok(Math.hypot(mob.x - world.spawn.x, mob.z - world.spawn.z) > 7);
    assert.ok(world.get(Math.floor(mob.x), mob.groundY - 1, Math.floor(mob.z)));
    if (mob.kind === 'villager') assert.equal(mob.groundY, 9);
    assert.ok(mob.x >= mob.bounds.minX && mob.x <= mob.bounds.maxX);
    assert.ok(mob.z >= mob.bounds.minZ && mob.z <= mob.bounds.maxZ);
  }
  for (let frame = 0; frame < 600; frame++) {
    stepMobs(world, mobs, 1 / 30);
    stepMobs(comparisonWorld, comparison, 1 / 30);
  }
  assert.deepEqual(mobs.map(({ x, z }) => [x, z]), comparison.map(({ x, z }) => [x, z]));
  assert.ok(Math.hypot(mobs[0].x - 25.4, mobs[0].z - 28.2) > 0.2);
  for (const mob of mobs) {
    assert.ok(mob.x >= mob.bounds.minX && mob.x <= mob.bounds.maxX);
    assert.ok(mob.z >= mob.bounds.minZ && mob.z <= mob.bounds.maxZ);
    for (let x = Math.floor(mob.x - mob.radius); x <= Math.floor(mob.x + mob.radius); x++) {
      for (let z = Math.floor(mob.z - mob.radius); z <= Math.floor(mob.z + mob.radius); z++) {
        assert.ok(world.get(x, mob.groundY - 1, z));
        for (let y = mob.groundY; y < mob.groundY + mob.height; y++) {
          assert.equal(world.get(x, y, z), 0);
        }
      }
    }
  }
});

test('every mob kind has textured surfaces and usable animated limbs', () => {
  const mobs = createMobs(new World());
  const kinds = new Set();
  for (const mob of mobs) {
    if (kinds.has(mob.kind)) continue;
    kinds.add(mob.kind);
    const model = createMobModel(THREE, mob);
    const maps = [...model.materials.values()].map(material => material.map).filter(Boolean);
    assert.ok(maps.length > 0, `${mob.kind} has a textured surface`);
    for (const map of maps) {
      const pixels = map.image.data;
      const colors = new Set();
      for (let i = 0; i < pixels.length; i += 4) {
        assert.equal(pixels[i + 3], 255);
        colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      }
      assert.ok(colors.size > 1, `${mob.kind} texture is not a flat color`);
      map.dispose();
    }
    assert.equal(model.legs.length, ['villager', 'ironGolem', 'chicken'].includes(mob.kind) ? 2 : 4);
    assert.equal(model.arms.length, ['villager', 'ironGolem'].includes(mob.kind) ? 2 : 0);
    model.group.traverse(object => { if (object.geometry) object.geometry.dispose(); });
    for (const material of model.materials.values()) material.dispose();
  }
  assert.deepEqual([...kinds].sort(), ['chicken', 'cow', 'fox', 'ironGolem', 'pig', 'rabbit', 'sheep', 'villager']);
});

test('coordinates never alias another row, column or layer', () => {
  const world = empty();
  world.write(0, 1, 1, 3);
  assert.equal(world.get(SIZE[0], 1, 0), 0);
  assert.equal(world.get(-1, 1, 1), 0);
  assert.equal(world.inside(1.2, 1, 1), false);
  assert.ok(world.solid(SIZE[0], 1, 0));
  assert.ok(world.solid(0, 32, 0));
});

test('edit rejects floor, invalid IDs, occupied cells and player overlap', () => {
  const world = empty();
  const player = { x: 4.5, y: 3, z: 4.5 };
  for (const args of [[1, 0, 1, 0], [SIZE[0], 2, 2, 1], [2, 2, 2, BLOCKS.length], [2, 2, 2, 1.5]]) {
    assert.equal(typeof world.edit(...args, player), 'string');
  }
  assert.equal(typeof world.edit(4, 3, 4, 1, player), 'string');
  assert.equal(typeof world.edit(4, 4, 4, 1, player), 'string');
  assert.equal(world.edit(4, 5, 4, 1, player), null);
  assert.equal(typeof world.edit(4, 5, 4, 2, player), 'string');
  assert.equal(world.edit(4, 5, 4, 0, player), null);
});

test('all 29 building materials can be placed, rendered, picked and removed', () => {
  const world = empty();
  assert.equal(BLOCKS.length - 1, 29);
  assert.equal(new Set(BLOCKS.slice(1).map(block => block.name)).size, 29);
  assert.equal(new Set(BLOCKS.slice(1).map(block => block.color)).size, 29);
  for (let id = 1; id < BLOCKS.length; id++) {
    assert.match(BLOCKS[id].color, /^#[0-9a-f]{6}$/i);
    assert.equal(world.edit(4, 4, 4, id), null);
    assert.equal(world.get(4, 4, 4), id);
    assert.equal(world.solid(4, 4, 4), true);
    const data = chunkGeometry(world, 0, 0, 0);
    assert.equal(data.indices.length, 36);
    assert.ok(data.colors.every(color => Number.isFinite(color) && color >= 0 && color <= 1));
    assert.deepEqual(pick(world, { x: 4.5, y: 4.5, z: 8 }, { x: 0, y: 0, z: -1 }).cell, [4, 4, 4]);
    assert.equal(world.edit(4, 4, 4, 0), null);
    assert.equal(world.get(4, 4, 4), 0);
  }
});

test('block faces select their material texture, including grass and log end grain', () => {
  const world = empty();
  for (let id = 1; id < BLOCKS.length; id++) {
    world.blocks.fill(0);
    world.write(4, 4, 4, id);
    const data = chunkGeometry(world, 0, 0, 0);
    assert.equal(data.uvs.length, data.positions.length / 3 * 2);
    for (let face = 0; face < 6; face++) {
      const normalY = data.normals[face * 12 + 1];
      const uvs = data.uvs.slice(face * 8, face * 8 + 8);
      assert.ok(uvs.every(uv => uv > 0 && uv < 1));
      const u = (uvs[0] + uvs[2]) / 2;
      const v = (uvs[1] + uvs[5]) / 2;
      const tile = Math.floor(u * ATLAS_COLUMNS) + Math.floor((1 - v) * ATLAS_ROWS) * ATLAS_COLUMNS;
      const expected = id === 1 ? normalY > 0 ? 1 : normalY < 0 ? 2 : 30 :
        id === 4 && normalY !== 0 ? 31 : id;
      assert.equal(tile, expected, `${BLOCKS[id].name}, face ${face}`);
    }
  }
});

test('chunk faces cull neighbours and use outward winding', () => {
  const world = empty();
  world.write(2, 2, 2, 3);
  const data = chunkGeometry(world, 0, 0, 0);
  assert.equal(data.indices.length / 6, 6);
  for (let i = 0; i < data.indices.length; i += 3) {
    const vectors = data.indices.slice(i, i + 3).map(index => data.positions.slice(index * 3, index * 3 + 3));
    const a = vectors[1].map((n, axis) => n - vectors[0][axis]);
    const b = vectors[2].map((n, axis) => n - vectors[0][axis]);
    const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const normal = data.normals.slice(data.indices[i] * 3, data.indices[i] * 3 + 3);
    assert.ok(cross.reduce((sum, n, axis) => sum + n * normal[axis], 0) > 0);
  }
  world.write(3, 2, 2, 1);
  assert.equal(chunkGeometry(world, 0, 0, 0).indices.length / 6, 10);
  world.blocks.fill(0);
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
    for (let z = 0; z < 16; z++) world.write(x, y, z, 3);
  }
  assert.equal(chunkGeometry(world, 0, 0, 0).indices.length / 6, 1536);
});

test('boundary edits dirty neighbours and cross-chunk hidden faces are removed', () => {
  const world = empty();
  assert.equal(world.edit(15, 15, 15, 3), null);
  assert.deepEqual([...world.dirty].sort(), ['0,0,0', '0,0,1', '0,1,0', '1,0,0']);
  world.write(16, 15, 15, 3);
  assert.equal(chunkGeometry(world, 0, 0, 0).indices.length / 6, 5);
  assert.equal(chunkGeometry(world, 1, 0, 0).indices.length / 6, 5);
});

test('grid picking handles zero/negative rays, range and placement normals', () => {
  const world = empty();
  world.write(4, 4, 4, 3);
  const hit = pick(world, { x: 4.5, y: 4.5, z: 8 }, { x: 0, y: 0, z: -1 });
  assert.deepEqual(hit.cell, [4, 4, 4]);
  assert.deepEqual(hit.normal, [0, 0, 1]);
  assert.equal(hit.distance, 3);
  assert.equal(pick(world, { x: 4.5, y: 4.5, z: 11 }, { x: 0, y: 0, z: -1 }), null);
  assert.equal(pick(world, { x: 4, y: 4, z: 4 }, { x: 0, y: 0, z: 0 }), null);
  assert.deepEqual(pick(world, { x: 0, y: 4.5, z: 4.5 }, { x: 1, y: 0, z: 0 }).normal, [-1, 0, 0]);
});

function flat() {
  const world = empty();
  for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) world.write(x, 0, z, 3);
  return world;
}

test('player lands, jumps and cannot tunnel through a wall at 30 FPS', () => {
  const world = flat();
  const player = { x: 10.5, y: 5, z: 10.5, vy: 0, grounded: false };
  for (let i = 0; i < 180; i++) stepPlayer(world, player, {}, 0, 1 / 30);
  assert.ok(player.grounded);
  assert.ok(player.y >= 1 && player.y < 1.2);
  stepPlayer(world, player, { jump: true }, 0, 1 / 60);
  const initialVelocity = player.vy;
  stepPlayer(world, player, { jump: true }, 0, 1 / 60);
  assert.ok(player.vy < initialVelocity, 'airborne jump must not reset velocity');
  for (let y = 1; y < 10; y++) for (let x = 0; x < 64; x++) world.write(x, y, 8, 3);
  for (let i = 0; i < 180; i++) stepPlayer(world, player, { forward: true }, 0, 1 / 30);
  assert.ok(player.z >= 9.3);
  assert.equal(collides(world, player), false);
});

test('diagonal movement is normalized and the world edge blocks movement', () => {
  const world = flat();
  const a = { x: 10, y: 1, z: 10, vy: 0, grounded: true };
  const b = { ...a };
  for (let i = 0; i < 60; i++) {
    stepPlayer(world, a, { forward: true }, 0, 1 / 60);
    stepPlayer(world, b, { forward: true, right: true }, 0, 1 / 60);
  }
  assert.ok(Math.abs(Math.hypot(a.x - 10, a.z - 10) - Math.hypot(b.x - 10, b.z - 10)) < 0.001);
  for (let i = 0; i < 600; i++) stepPlayer(world, a, { forward: true }, 0, 1 / 30);
  assert.ok(a.z >= 0.3);
  assert.equal(collides(world, a), false);
});

test('ceiling stops a jump and a removed support allows falling', () => {
  const world = flat();
  const player = { x: 10.5, y: 1, z: 10.5, vy: 0, grounded: true };
  world.write(10, 3, 10, 3);
  for (let i = 0; i < 10; i++) stepPlayer(world, player, { jump: i === 0 }, 0, 1 / 60);
  assert.ok(player.y + 1.75 <= 3.00001);
  assert.equal(collides(world, player), false);
  world.write(10, 3, 10, 0);
  world.write(10, 0, 10, 0);
  const before = player.y;
  for (let i = 0; i < 20; i++) stepPlayer(world, player, {}, 0, 1 / 60);
  assert.ok(player.y < before);
});
