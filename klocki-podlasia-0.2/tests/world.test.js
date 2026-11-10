import test from 'node:test';
import assert from 'node:assert/strict';
import { World, SIZE, BLOCKS, chunkGeometry, pick } from '../world.js';
import { createPlayer, collides, stepPlayer } from '../player.js';
import { createMobs, stepMobs } from '../mobs.js';

function empty() {
  const world = new World();
  world.blocks.fill(0);
  world.dirty.clear();
  return world;
}

test('generation is deterministic, bounded and has a safe supported spawn for 20 seeds', () => {
  for (let seed = 0; seed < 20; seed++) {
    const world = new World(seed);
    assert.deepEqual(world.blocks, new World(seed).blocks);
    assert.equal(world.blocks.length, 131072);
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
  assert.equal(world.get(10, 8, 38), 11);
  for (let id = 25; id <= 29; id++) assert.ok(world.blocks.includes(id));
});

test('farm animals and village golems spawn safely and wander deterministically', () => {
  const world = new World();
  const comparisonWorld = new World();
  const mobs = createMobs(world);
  const comparison = createMobs(comparisonWorld);
  assert.deepEqual(mobs.map(mob => mob.kind), [
    'cow', 'sheep', 'pig', 'chicken', 'ironGolem', 'ironGolem', 'ironGolem'
  ]);
  assert.equal(mobs.filter(mob => mob.kind === 'ironGolem').length, 3);
  for (const mob of mobs) {
    assert.ok(Math.hypot(mob.x - world.spawn.x, mob.z - world.spawn.z) > 7);
    assert.ok(world.get(Math.floor(mob.x), mob.groundY - 1, Math.floor(mob.z)));
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

test('coordinates never alias another row, column or layer', () => {
  const world = empty();
  world.write(0, 1, 1, 3);
  assert.equal(world.get(64, 1, 0), 0);
  assert.equal(world.get(-1, 1, 1), 0);
  assert.equal(world.inside(1.2, 1, 1), false);
  assert.ok(world.solid(64, 1, 0));
  assert.ok(world.solid(0, 32, 0));
});

test('edit rejects floor, invalid IDs, occupied cells and player overlap', () => {
  const world = empty();
  const player = { x: 4.5, y: 3, z: 4.5 };
  for (const args of [[1, 0, 1, 0], [64, 2, 2, 1], [2, 2, 2, BLOCKS.length], [2, 2, 2, 1.5]]) {
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
