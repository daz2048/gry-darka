import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../world.js';
import { createPlayer } from '../player.js';
import {
  createSnapshot, WorldSaveStore, SaveConflictError, CorruptSaveError, SaveMigrationError,
  MAX_WORLDS, SAVE_DATABASE, LEGACY_SAVE_DATABASE, WORLD_STORE
} from '../saves.js';
import { FakeIndexedDB } from './fake-indexeddb.js';
import { readSaveStorageStatus } from '../diagnostics.js';

const world = new World(42);
const settings = { sensitivity: 1, lowQuality: false, musicEnabled: false, musicVolume: 0.35 };

function snapshot(material = 7, id = 'test-world') {
  return createSnapshot(world, createPlayer(world), 0, 0, material, settings, id);
}

function record(material, revision) {
  return { ...snapshot(material), revision, savedAt: 1000 + revision };
}

const quota = Object.assign(new Error('Quota exceeded'), { name: 'QuotaExceededError' });

test('first save creates revision 1 and a second keeps the first as the previous copy', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  const first = await store.load();
  assert.equal(first.status, 'empty');
  const saved = await store.save(snapshot(3), first.expected);
  assert.equal(saved.revision, 1);
  assert.equal((await readSaveStorageStatus(store, 'test-world', {})).backup, 'missing');
  const second = await store.save(snapshot(4), { exists: true, revision: 1 });
  assert.equal(second.revision, 2);
  assert.equal((await readSaveStorageStatus(store, 'test-world', {})).backup, 'available');
  const records = idb.records(SAVE_DATABASE, WORLD_STORE);
  assert.equal(records.get('world:test-world').selectedBlock, 4);
  assert.equal(records.get('previous:test-world').selectedBlock, 3);
});

test('a quota failure aborts the transaction and leaves current and previous untouched', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, { current: record(4, 2), previous: record(3, 1) });
  const store = new WorldSaveStore(idb);
  await store.load();
  idb.faults.commit = quota;
  await assert.rejects(store.save(snapshot(9), { exists: true, revision: 2 }), error => error.name === 'QuotaExceededError');
  const records = idb.records(SAVE_DATABASE, WORLD_STORE);
  assert.equal(records.get('world:test-world').selectedBlock, 4);
  assert.equal(records.get('world:test-world').revision, 2);
  assert.equal(records.get('previous:test-world').selectedBlock, 3);

  delete idb.faults.commit;
  const retry = await store.save(snapshot(9), { exists: true, revision: 2 });
  assert.equal(retry.revision, 3);
  assert.equal(records.get('previous:test-world').selectedBlock, 4);
});

test('an aborted first save leaves the slot empty and retryable', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  await store.load();
  idb.faults.commit = new Error('Transaction aborted');
  await assert.rejects(store.save(snapshot(), { exists: false, revision: null }), /aborted/);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).size, 0);
  delete idb.faults.commit;
  assert.equal((await store.save(snapshot(), { exists: false, revision: null })).revision, 1);
});

test('a read failure rejects loading instead of reporting an empty slot', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, { current: record(4, 1) });
  const store = new WorldSaveStore(idb);
  idb.faults.read = new Error('Read failed');
  await assert.rejects(store.load(), /Read failed/);
});

test('unavailable storage reports a coded error without throwing synchronously', async () => {
  await assert.rejects(new WorldSaveStore(null).load(), error => error.code === 'storage-unavailable');
  const idb = new FakeIndexedDB();
  idb.faults.open = new Error('Denied');
  await assert.rejects(new WorldSaveStore(idb).load(), /Denied/);
});

test('a save over a changed revision is rejected as a conflict and writes nothing', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, { current: record(4, 5) });
  const store = new WorldSaveStore(idb);
  await assert.rejects(store.save(snapshot(9), { exists: true, revision: 4 }), SaveConflictError);
  await assert.rejects(store.save(snapshot(9), { exists: false, revision: null }), SaveConflictError);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('world:test-world').selectedBlock, 4);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).has('previous:test-world'), false);
});

test('a damaged current save recovers from previous and is not overwritten without consent', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, { current: { ...record(4, 2), blocks: new Uint8Array(10) }, previous: record(3, 1) });
  const store = new WorldSaveStore(idb);
  const loaded = await store.load();
  assert.equal(loaded.status, 'recovery');
  assert.equal(loaded.record.selectedBlock, 3);
  await assert.rejects(store.save(snapshot(9), loaded.expected), CorruptSaveError);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:test-world').selectedBlock, 3);

  const replaced = await store.save(snapshot(9), loaded.expected, { replaceCorrupt: true });
  assert.equal(replaced.revision, 3);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('world:test-world').selectedBlock, 9);
});

test('damaged current and previous report corrupt and stay protected', async () => {
  const idb = new FakeIndexedDB();
  const bad = { ...record(4, 2), seed: -1 };
  idb.seed(SAVE_DATABASE, { current: bad, previous: { ...record(3, 1), water: new Uint8Array(1) } });
  const store = new WorldSaveStore(idb);
  const loaded = await store.load();
  assert.equal(loaded.status, 'corrupt');
  await assert.rejects(store.save(snapshot(9), loaded.expected), CorruptSaveError);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('world:test-world').seed, -1);
});

test('a damaged previous copy is ignored while current stays valid', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, { current: record(4, 2), previous: { revision: 1 } });
  const store = new WorldSaveStore(idb);
  const loaded = await store.load();
  assert.equal(loaded.status, 'current');
  assert.equal(loaded.previousAvailable, false);
  assert.equal((await readSaveStorageStatus(store, 'test-world', {})).backup, 'missing');
});

test('legacy 0.3 save migrates into an empty slot and leaves the legacy database intact', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(LEGACY_SAVE_DATABASE, { current: record(6, 3), previous: record(5, 2) });
  const loaded = await new WorldSaveStore(idb).load();
  assert.equal(loaded.migrated, true);
  assert.equal(loaded.status, 'current');
  assert.equal(loaded.record.selectedBlock, 6);
  assert.equal(idb.records(LEGACY_SAVE_DATABASE).get('current').selectedBlock, 6);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:test-world').selectedBlock, 5);
});

test('legacy migration never overwrites an already populated 0.4 slot', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(LEGACY_SAVE_DATABASE, { current: record(6, 3) });
  idb.seed(SAVE_DATABASE, { current: record(2, 8) });
  const loaded = await new WorldSaveStore(idb).load();
  assert.equal(loaded.migrated, false);
  assert.equal(loaded.record.selectedBlock, 2);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('world:test-world').revision, 8);
});

test('a damaged legacy save becomes a protected marker, not a playable world', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(LEGACY_SAVE_DATABASE, { current: { ...record(6, 3), blocks: new Uint8Array(4) } });
  const store = new WorldSaveStore(idb);
  const loaded = await store.load();
  assert.equal(loaded.status, 'corrupt');
  assert.equal(loaded.expected.revision, 3);
  await assert.rejects(store.save(snapshot(9), loaded.expected), CorruptSaveError);
  assert.equal(idb.records(LEGACY_SAVE_DATABASE).get('current').blocks.length, 4);
});

test('an interrupted migration reports a retryable error and changes nothing', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(LEGACY_SAVE_DATABASE, { current: record(6, 3) });
  const store = new WorldSaveStore(idb);
  idb.faults.commit = quota;
  await assert.rejects(store.load(), SaveMigrationError);
  assert.equal(idb.records(SAVE_DATABASE).size, 0);
  assert.equal(idb.records(LEGACY_SAVE_DATABASE).get('current').selectedBlock, 6);
});

test('serialized rapid saves each build on the previous revision', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  let expected = (await store.load()).expected;
  for (let i = 1; i <= 5; i++) {
    const saved = await store.save(snapshot(1 + i), expected);
    assert.equal(saved.revision, i);
    expected = { exists: true, revision: saved.revision };
  }
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:test-world').revision, 4);
});

test('worlds keep independent snapshots, revisions, backups, and recent selection', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  await store.load();
  await store.save(snapshot(3, 'world-a'), { exists: false, revision: null, worldId: 'world-a' });
  await store.save(snapshot(7, 'world-b'), { exists: false, revision: null, worldId: 'world-b' });
  await store.save(snapshot(4, 'world-a'), { exists: true, revision: 1, worldId: 'world-a' });

  const worlds = await store.listWorlds();
  assert.deepEqual(new Set(worlds.map(world => world.worldId)), new Set(['world-a', 'world-b']));
  assert.equal((await store.load('world-a')).record.selectedBlock, 4);
  assert.equal((await store.load('world-a')).record.revision, 2);
  assert.equal((await store.load('world-b')).record.selectedBlock, 7);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:world-a').selectedBlock, 3);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).has('previous:world-b'), false);

  await store.activateWorld('world-b');
  assert.equal((await store.load()).record.worldId, 'world-b');
});

test('soundtrack assignments survive storage reloads without leaking between worlds', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  await store.load();
  for (const [worldId, musicSelection] of [
    ['world-a', 'track:a.mp3'], ['world-b', 'track:b.ogg'],
    ['world-random', 'random'], ['world-original', 'original']
  ]) {
    const saved = createSnapshot(world, createPlayer(world), 0, 0, 1,
      { ...settings, musicSelection }, worldId);
    await store.save(saved, { exists: false, revision: null, worldId });
  }
  const reloaded = new WorldSaveStore(idb);
  assert.equal((await reloaded.load('world-a')).record.settings.musicSelection, 'track:a.mp3');
  assert.equal((await reloaded.load('world-b')).record.settings.musicSelection, 'track:b.ogg');
  assert.equal((await reloaded.load('world-random')).record.settings.musicSelection, 'random');
  assert.equal((await reloaded.load('world-original')).record.settings.musicSelection, 'original');
});

test('new worlds are capped transactionally and deleting one frees a slot', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  await store.load();
  const baseSnapshot = snapshot();
  for (let index = 0; index < MAX_WORLDS; index++) {
    const worldId = `world-${index}`;
    await store.save({ ...baseSnapshot, worldId }, {
      exists: false, revision: null, worldId
    });
  }
  const overflowId = 'world-overflow';
  await assert.rejects(
    store.save({ ...baseSnapshot, worldId: overflowId }, {
      exists: false, revision: null, worldId: overflowId
    }),
    error => error.code === 'world-limit'
  );
  assert.equal((await store.listWorlds()).length, MAX_WORLDS);

  assert.equal(await store.deleteWorld('world-0'), true);
  await store.save({ ...baseSnapshot, worldId: overflowId }, {
    exists: false, revision: null, worldId: overflowId
  });
  assert.equal((await store.listWorlds()).length, MAX_WORLDS);
});

test('repeated imports create independent revision-one worlds without changing the active save', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  const source = snapshot(3);
  await store.save(source, { exists: false, revision: null });
  await store.save(snapshot(4), { exists: true, revision: 1 });
  const first = await store.importWorld(source);
  const second = await store.importWorld(source);
  assert.equal(first.revision, 1);
  assert.equal(second.revision, 1);
  assert.notEqual(first.worldId, source.worldId);
  assert.notEqual(first.worldId, second.worldId);
  assert.deepEqual(first.blocks, source.blocks);
  assert.deepEqual(first.water, source.water);
  assert.equal(first.worldName, source.worldName);
  assert.equal((await store.load()).record.worldId, source.worldId);
  assert.equal((await store.load(source.worldId)).record.revision, 2);
  assert.equal((await store.load(source.worldId)).record.selectedBlock, 4);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:test-world').selectedBlock, 3);
  assert.equal((await store.listWorlds()).length, 3);
});

test('failed imports leave catalog, active world, and recovery generation untouched', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  const source = snapshot();
  await store.save(source, { exists: false, revision: null });
  await store.save(snapshot(4), { exists: true, revision: 1 });
  idb.faults.commit = quota;
  await assert.rejects(store.importWorld(source), error => error.name === 'QuotaExceededError');
  delete idb.faults.commit;
  assert.equal((await store.listWorlds()).length, 1);
  for (let index = 1; index < MAX_WORLDS; index++) await store.importWorld(source);
  await assert.rejects(store.importWorld(source), error => error.code === 'world-limit');
  assert.equal((await store.listWorlds()).length, MAX_WORLDS);
  assert.equal((await store.load()).record.worldId, source.worldId);
  assert.equal((await store.load()).record.revision, 2);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:test-world').selectedBlock, 7);
});

test('rename and delete update only the selected world and its recovery copy', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  await store.load();
  await store.save(snapshot(3, 'world-a'), { exists: false, revision: null, worldId: 'world-a' });
  await store.save(snapshot(7, 'world-b'), { exists: false, revision: null, worldId: 'world-b' });
  await store.save(snapshot(4, 'world-a'), { exists: true, revision: 1, worldId: 'world-a' });

  const renamed = await store.renameWorld('world-a', 'Home', { worldId: 'world-a', revision: 2 });
  assert.equal(renamed.worldName, 'Home');
  assert.equal(renamed.revision, 3);
  assert.equal((await store.load('world-a')).record.worldName, 'Home');
  assert.equal((await store.load('world-b')).record.worldName, 'Łąka');
  await assert.rejects(store.renameWorld('world-a', 'Stale', { worldId: 'world-a', revision: 2 }), SaveConflictError);

  await store.activateWorld('world-a');
  assert.equal(await store.deleteWorld('world-a'), true);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).has('world:world-a'), false);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).has('previous:world-a'), false);
  assert.equal((await store.load()).record.worldId, 'world-b');
  assert.equal((await store.listWorlds()).length, 1);
});

test('single-slot migration preserves distinct current and previous worlds', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, {
    current: record(6, 3),
    previous: { ...record(2, 2), worldId: 'older-world' }
  });
  const store = new WorldSaveStore(idb);
  const worlds = await store.listWorlds();
  assert.deepEqual(new Set(worlds.map(world => world.worldId)), new Set(['test-world', 'older-world']));
  assert.equal((await store.load('test-world')).record.selectedBlock, 6);
  assert.equal((await store.load('older-world')).record.selectedBlock, 2);
  assert.equal(idb.records(SAVE_DATABASE).has('current'), false);
  assert.equal(idb.records(SAVE_DATABASE).has('previous'), false);
});

test('a failed world deletion leaves its current and previous generations intact', async () => {
  const idb = new FakeIndexedDB();
  const store = new WorldSaveStore(idb);
  await store.load();
  await store.save(snapshot(3, 'world-a'), { exists: false, revision: null, worldId: 'world-a' });
  await store.save(snapshot(4, 'world-a'), { exists: true, revision: 1, worldId: 'world-a' });
  idb.faults.commit = quota;
  await assert.rejects(store.deleteWorld('world-a'), error => error.name === 'QuotaExceededError');
  assert.equal((await store.load('world-a')).record.selectedBlock, 4);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).get('previous:world-a').selectedBlock, 3);
});

test('an interrupted single-slot migration preserves both legacy slots and can retry', async () => {
  const idb = new FakeIndexedDB();
  idb.seed(SAVE_DATABASE, { current: record(6, 3), previous: record(2, 2) });
  idb.faults.commit = quota;
  await assert.rejects(new WorldSaveStore(idb).load(), error => error.name === 'QuotaExceededError');
  assert.equal(idb.records(SAVE_DATABASE).get('current').selectedBlock, 6);
  assert.equal(idb.records(SAVE_DATABASE).get('previous').selectedBlock, 2);
  assert.equal(idb.records(SAVE_DATABASE, WORLD_STORE).size, 0);

  delete idb.faults.commit;
  const loaded = await new WorldSaveStore(idb).load();
  assert.equal(loaded.status, 'current');
  assert.equal(loaded.record.selectedBlock, 6);
  assert.equal(idb.records(SAVE_DATABASE).has('current'), false);
});
