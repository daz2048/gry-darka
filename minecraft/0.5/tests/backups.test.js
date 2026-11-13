import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../world.js';
import { createPlayer } from '../player.js';
import { createSnapshot, CorruptSaveError } from '../saves.js?v=16';
import {
  backupFileName, decodeWorldBackup, encodeWorldBackup, MAX_BACKUP_BYTES, readWorldBackup
} from '../backups.js';
import { encodeWorldBackup as encodePreviousWorldBackup } from '../../../klocki-podlasia-0.4/backups.js';

const world = new World(123);
const original = createSnapshot(world, createPlayer(world), 0.5, -0.3, 12, {
  sensitivity: 1.2, lowQuality: true, musicEnabled: false, musicVolume: 0.6
}, 'original-id', 'Domek Łąka');
const encoded = await encodeWorldBackup({ ...original, revision: 42, savedAt: 12345 });

test('0.5 imports a compatible backup exported by 0.4', async () => {
  const previousBackup = await encodePreviousWorldBackup(original);
  assert.deepEqual(await decodeWorldBackup(previousBackup), original);
});

test('portable backup restores all snapshot bytes and state without database revision metadata', async () => {
  const envelope = JSON.parse(encoded);
  assert.equal(envelope.format, 'minecraft-world-backup');
  assert.match(envelope.checksum, /^[a-f0-9]{64}$/);
  assert.ok(new TextEncoder().encode(encoded).byteLength < MAX_BACKUP_BYTES);
  const restored = await decodeWorldBackup(encoded);
  assert.deepEqual(restored, original);
  assert.notEqual(restored.blocks, original.blocks);
  assert.notEqual(restored.water, original.water);
  assert.equal(restored.revision, undefined);
  assert.equal(restored.savedAt, undefined);
});

test('imports support unnamed worlds and ignore unrecognized JSON fields', async () => {
  const unnamed = { ...original, worldName: undefined };
  const envelope = JSON.parse(await encodeWorldBackup(unnamed));
  envelope.snapshot.revision = 100;
  envelope.snapshot.player.untrusted = 'ignored';
  envelope.snapshot.settings.untrusted = 'ignored';
  envelope.snapshot.__proto__ = { untrusted: true };
  const restored = await decodeWorldBackup(JSON.stringify(envelope));
  assert.deepEqual(restored, unnamed);
  assert.equal(restored.untrusted, undefined);
});

test('backup round trips preserve soundtrack assignments and accept backups without a choice', async () => {
  for (const musicSelection of ['track:a #1.ogg', 'random', 'original']) {
    const snapshot = { ...original, settings: { ...original.settings, musicSelection } };
    const restored = await decodeWorldBackup(await encodeWorldBackup(snapshot));
    assert.equal(restored.settings.musicSelection, musicSelection);
  }
  const restored = await decodeWorldBackup(encoded);
  assert.equal(restored.settings.musicSelection, undefined);
  const cursed = await decodeWorldBackup(await encodeWorldBackup({
    ...original, cursed: true, curseHouse: '105,63'
  }));
  assert.equal(cursed.cursed, true);
  assert.equal(cursed.curseHouse, '105,63');
  const cured = await decodeWorldBackup(await encodeWorldBackup({ ...original, curseLifted: true }));
  assert.equal(cured.curseLifted, true);
  const nightmare = await decodeWorldBackup(await encodeWorldBackup({
    ...original, curseLifted: true, curseHouse: '105,63', nightmare: true
  }));
  assert.equal(nightmare.nightmare, true);
  const overpowered = await decodeWorldBackup(await encodeWorldBackup({
    ...original, curseLifted: true, curseHouse: '105,63', hauntedVisits: 4, opMode: true
  }));
  assert.equal(overpowered.opMode, true);
  assert.equal(overpowered.hauntedVisits, 4);
});

test('malformed, truncated, and unsupported backups are rejected', async () => {
  await assert.rejects(decodeWorldBackup(encoded.slice(0, -20)), error => error.code === 'backup-invalid');
  for (const change of [
    envelope => { envelope.format = 'another-game'; },
    envelope => { envelope.version = 2; },
    envelope => { envelope.snapshot.schemaVersion = 2; },
    envelope => { envelope.snapshot.generatorVersion = 2; },
    envelope => { envelope.snapshot.dimensions[0]++; }
  ]) {
    const envelope = JSON.parse(encoded);
    change(envelope);
    await assert.rejects(decodeWorldBackup(JSON.stringify(envelope)),
      error => error.code === 'backup-incompatible');
  }
  for (const text of ['null', '{}', '[]', 'not json']) {
    await assert.rejects(decodeWorldBackup(text), CorruptSaveError);
  }
});

test('invalid Base64, lengths, and padding are rejected before restore', async () => {
  for (const change of [
    data => data.slice(0, -4),
    data => `!${data.slice(1)}`,
    data => `${data.slice(0, -1)}A`,
    data => `${data.slice(0, -2)}B=`
  ]) {
    const envelope = JSON.parse(encoded);
    envelope.snapshot.water = change(envelope.snapshot.water);
    await assert.rejects(decodeWorldBackup(JSON.stringify(envelope)),
      error => error.code === 'backup-invalid');
  }
});

test('checksum catches valid-looking changes to bytes and metadata', async () => {
  for (const change of [
    envelope => { envelope.snapshot.worldName = 'Changed'; },
    envelope => { envelope.snapshot.player.x += 1; },
    envelope => {
      const water = atob(envelope.snapshot.water);
      envelope.snapshot.water = btoa(String.fromCharCode(water.charCodeAt(0) ^ 1) + water.slice(1));
    },
    envelope => { envelope.checksum = '0'.repeat(64); }
  ]) {
    const envelope = JSON.parse(encoded);
    change(envelope);
    await assert.rejects(decodeWorldBackup(JSON.stringify(envelope)),
      error => error.code === 'backup-checksum');
  }
});

test('valid checksums cannot bypass existing world validation', async () => {
  for (const change of [
    snapshot => { snapshot.settings.sensitivity = 100; },
    snapshot => { snapshot.player.x = -1; },
    snapshot => {
      const blocks = atob(snapshot.blocks);
      snapshot.blocks = btoa('\0' + blocks.slice(1));
    },
    snapshot => {
      const water = atob(snapshot.water);
      snapshot.water = btoa('\x02' + water.slice(1));
    }
  ]) {
    const envelope = JSON.parse(encoded);
    change(envelope.snapshot);
    const hash = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(JSON.stringify(envelope.snapshot)));
    envelope.checksum = Buffer.from(hash).toString('hex');
    await assert.rejects(decodeWorldBackup(JSON.stringify(envelope)), CorruptSaveError);
  }
});

test('oversized files are rejected before reading; unreadable files propagate errors', async () => {
  await assert.rejects(readWorldBackup({
    size: MAX_BACKUP_BYTES + 1,
    text() { assert.fail('Oversized file must not be read'); }
  }), error => error.code === 'backup-size');
  await assert.rejects(decodeWorldBackup(' '.repeat(MAX_BACKUP_BYTES + 1)),
    error => error.code === 'backup-size');
  await assert.rejects(readWorldBackup({
    size: 1, text() { throw new Error('Read denied'); }
  }), /Read denied/);
});

test('download filename cannot contain paths and identifies its backup format', () => {
  const date = new Date('2026-11-13T10:00:00Z');
  assert.equal(backupFileName('../My / world:?', date),
    'My-world-2026-11-13T10-00-00-000Z.minecraft-world.json');
  assert.equal(backupFileName('///', date), backupFileName(undefined, date));
});
