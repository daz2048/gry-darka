import test from 'node:test';
import assert from 'node:assert/strict';
import { World, SIZE } from '../world.js';
import { createPlayer } from '../player.js';
import {
  applySnapshot, createSnapshot, CorruptSaveError, saveDataSize, suggestUniqueWorldName, validateSnapshot
} from '../saves.js';

function makeSnapshot() {
  const world = new World(42);
  return createSnapshot(world, createPlayer(world), -0.5, 0.2, 7, {
    sensitivity: 1,
    lowQuality: false,
    musicEnabled: true,
    musicVolume: 0.35
  }, 'test-world');
}

test('snapshot copies the full seeded world, water, player, material and settings', () => {
  const snapshot = makeSnapshot();
  assert.equal(validateSnapshot(snapshot), snapshot);
  assert.equal(snapshot.seed, 42);
  assert.equal(snapshot.blocks.length, SIZE[0] * SIZE[1] * SIZE[2]);
  assert.equal(snapshot.water.length, snapshot.blocks.length);
  assert.deepEqual(snapshot.player, { ...snapshot.player, x: 32.5, y: 9, z: 39.5, yaw: -0.5, pitch: 0.2 });
  assert.equal(snapshot.selectedBlock, 7);
  assert.equal(snapshot.cursed ?? false, false);
  assert.equal(snapshot.worldName, 'Łąka');
  assert.deepEqual(snapshot.settings, {
    sensitivity: 1,
    lowQuality: false,
    musicEnabled: true,
    musicVolume: 0.35
  });
});

test('snapshot stores a chosen world name and accepts older saves without one', () => {
  const world = new World(42);
  const named = createSnapshot(world, createPlayer(world), 0, 0, 1, {
    sensitivity: 1, lowQuality: false, musicEnabled: true, musicVolume: 0.35
  }, 'named-world', 'My Meadow');
  assert.equal(validateSnapshot(named).worldName, 'My Meadow');

  const olderSave = { ...named };
  delete olderSave.worldName;
  assert.equal(validateSnapshot(olderSave), olderSave);
});

test('snapshot validation rejects blank or oversized world names', () => {
  const snapshot = makeSnapshot();
  for (const worldName of ['', '   ', 'x'.repeat(33)]) {
    assert.throws(() => validateSnapshot({ ...snapshot, worldName }), CorruptSaveError);
  }
});

test('new-world proposals use local date and time and avoid existing names', () => {
  const date = new Date(2026, 10, 13, 9, 17);
  const first = suggestUniqueWorldName([], date, 'new world');
  assert.equal(first, '261113 new world 0917');
  assert.equal(suggestUniqueWorldName([first], date, 'new world'), `${first} (2)`);
  assert.equal(suggestUniqueWorldName([first, `${first} (2)`], date, 'new world'), `${first} (3)`);
  assert.equal(suggestUniqueWorldName([first.toUpperCase()], date, 'new world'), `${first} (2)`);
  assert.ok(first.length <= 32);
});

test('save size counts binary world data and UTF-8 metadata without expanding arrays to JSON', () => {
  const record = {
    blocks: new Uint8Array([0, 255, 12]),
    water: new Uint8Array([1, 0]),
    worldName: 'Łąka 🌳',
    revision: 3,
    savedAt: 12345
  };
  const metadata = { worldName: record.worldName, revision: 3, savedAt: 12345 };
  assert.equal(saveDataSize(record), 5 + Buffer.byteLength(JSON.stringify(metadata), 'utf8'));
  assert.equal(saveDataSize({ ...record, blocks: new Uint8Array(13) }), saveDataSize(record) + 10);
});

test('snapshot arrays are independent and restore exact block and water bytes', () => {
  const original = new World(42);
  const snapshot = createSnapshot(original, createPlayer(original), 0, 0, 1, {
    sensitivity: 1, lowQuality: true, musicEnabled: false, musicVolume: 0
  }, 'test-world');
  const expectedBlocks = snapshot.blocks.slice();
  const expectedWater = snapshot.water.slice();
  original.blocks.fill(0);
  original.water.fill(0);
  const restored = applySnapshot(new World(1), snapshot);
  assert.deepEqual(restored.blocks, expectedBlocks);
  assert.deepEqual(restored.water, expectedWater);
  assert.equal(restored.seed, 42);
  assert.equal(restored.cursed, false);
  assert.equal(restored.dirty.size, (SIZE[0] / 16) * (SIZE[1] / 16) * (SIZE[2] / 16));
});

test('haunted-world curse persists in saves and missing legacy curse state defaults to clear', () => {
  const original = new World(42);
  original.cursed = true;
  original.curseHouse = '105,63';
  const snapshot = createSnapshot(original, createPlayer(original), 0, 0, 1, {
    sensitivity: 1, lowQuality: true, musicEnabled: false, musicVolume: 0
  }, 'cursed-world');
  assert.equal(snapshot.cursed, true);
  const restoredCurse = applySnapshot(new World(1), snapshot);
  assert.equal(restoredCurse.cursed, true);
  assert.equal(restoredCurse.curseHouse, '105,63');

  const oldCurseSnapshot = { ...snapshot };
  delete oldCurseSnapshot.curseHouse;
  assert.equal(validateSnapshot(oldCurseSnapshot), oldCurseSnapshot);
  assert.equal(applySnapshot(new World(1), oldCurseSnapshot).cursed, true);

  const legacySnapshot = { ...snapshot };
  delete legacySnapshot.cursed;
  delete legacySnapshot.curseHouse;
  delete legacySnapshot.curseLifted;
  assert.equal(validateSnapshot(legacySnapshot), legacySnapshot);
  assert.equal(applySnapshot(new World(1), legacySnapshot).cursed, false);
  assert.equal(new World(42).cursed, false);

  const clearedWorld = new World(42);
  clearedWorld.curseLifted = true;
  const clearedSnapshot = createSnapshot(clearedWorld, createPlayer(clearedWorld), 0, 0, 1, {
    sensitivity: 1, lowQuality: true, musicEnabled: false, musicVolume: 0
  }, 'cleared-world');
  const restoredClear = applySnapshot(new World(1), clearedSnapshot);
  assert.equal(restoredClear.cursed, false);
  assert.equal(restoredClear.curseLifted, true);

  const nightmareWorld = new World(42);
  nightmareWorld.curseLifted = true;
  nightmareWorld.curseHouse = '105,63';
  nightmareWorld.nightmare = true;
  const nightmareSnapshot = createSnapshot(nightmareWorld, createPlayer(nightmareWorld), 0, 0, 1, {
    sensitivity: 1, lowQuality: true, musicEnabled: false, musicVolume: 0
  }, 'nightmare-world');
  const restoredNightmare = applySnapshot(new World(1), nightmareSnapshot);
  assert.equal(restoredNightmare.cursed, false);
  assert.equal(restoredNightmare.nightmare, true);
});

test('snapshot validation rejects incompatible schemas, dimensions, and payload lengths', () => {
  const snapshot = makeSnapshot();
  for (const invalid of [
    { ...snapshot, schemaVersion: 2 },
    { ...snapshot, generatorVersion: 2 },
    { ...snapshot, dimensions: [64, 32, 64] },
    { ...snapshot, cursed: 'forever' },
    { ...snapshot, curseHouse: '1,1' },
    { ...snapshot, curseLifted: 'forever' },
    { ...snapshot, nightmare: true },
    { ...snapshot, blocks: snapshot.blocks.slice(1) },
    { ...snapshot, water: snapshot.water.slice(1) }
  ]) assert.throws(() => validateSnapshot(invalid), CorruptSaveError);
});

test('snapshot validation rejects invalid cells, protected floor, player state, and settings', () => {
  const snapshot = makeSnapshot();
  const invalidBlock = { ...snapshot, blocks: snapshot.blocks.slice() };
  invalidBlock.blocks[100] = 255;
  const invalidWater = { ...snapshot, water: snapshot.water.slice() };
  invalidWater.water[100] = 2;
  const missingFloor = { ...snapshot, blocks: snapshot.blocks.slice() };
  missingFloor.blocks[0] = 0;
  for (const invalid of [
    invalidBlock,
    invalidWater,
    missingFloor,
    { ...snapshot, player: { ...snapshot.player, x: NaN } },
    { ...snapshot, player: { ...snapshot.player, y: SIZE[1] } },
    { ...snapshot, selectedBlock: 0 },
    { ...snapshot, settings: { ...snapshot.settings, sensitivity: 10 } },
    { ...snapshot, settings: { ...snapshot.settings, musicVolume: -1 } }
  ]) assert.throws(() => validateSnapshot(invalid), CorruptSaveError);
});
