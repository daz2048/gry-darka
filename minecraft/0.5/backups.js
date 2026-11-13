import { CorruptSaveError, SAVE_SCHEMA_VERSION, WORLD_GENERATOR_VERSION, validateSnapshot } from './saves.js?v=11';
import { SIZE } from './world.js';

export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
const CELL_COUNT = SIZE[0] * SIZE[1] * SIZE[2];
const ENCODED_LENGTH = 4 * Math.ceil(CELL_COUNT / 3);
const FORMAT = 'minecraft-world-backup';

function requireValid(condition, message, code = 'backup-invalid') {
  if (!condition) throw Object.assign(new CorruptSaveError(message), { code });
}

function snapshotFields(value) {
  return {
    schemaVersion: value?.schemaVersion,
    generatorVersion: value?.generatorVersion,
    dimensions: value?.dimensions,
    seed: value?.seed,
    blocks: value?.blocks,
    water: value?.water,
    player: {
      x: value?.player?.x, y: value?.player?.y, z: value?.player?.z,
      yaw: value?.player?.yaw, pitch: value?.player?.pitch
    },
    selectedBlock: value?.selectedBlock,
    settings: {
      sensitivity: value?.settings?.sensitivity,
      lowQuality: value?.settings?.lowQuality,
      musicEnabled: value?.settings?.musicEnabled,
      musicVolume: value?.settings?.musicVolume,
      ...(value?.settings?.musicSelection === undefined ? {} : {
        musicSelection: value.settings.musicSelection
      })
    },
    worldId: value?.worldId,
    worldName: value?.worldName
  };
}

function encodeBytes(bytes) {
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
  }
  return btoa(chunks.join(''));
}

function decodeBytes(encoded) {
  requireValid(typeof encoded === 'string' && encoded.length === ENCODED_LENGTH &&
    /^[A-Za-z0-9+/]+=$/.test(encoded), 'Invalid backup Base64 data.');
  const binary = atob(encoded);
  requireValid(binary.length === CELL_COUNT && btoa(binary) === encoded,
    'Invalid backup data length or non-canonical Base64.');
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function checksum(snapshot) {
  if (!globalThis.crypto?.subtle) {
    throw Object.assign(new Error('Backups require Web Crypto on HTTPS or localhost.'), {
      code: 'backup-crypto'
    });
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(snapshot)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function encodeWorldBackup(snapshot) {
  validateSnapshot(snapshot);
  const payload = snapshotFields(snapshot);
  payload.blocks = encodeBytes(snapshot.blocks);
  payload.water = encodeBytes(snapshot.water);
  return JSON.stringify({
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    snapshot: payload,
    checksum: await checksum(payload)
  });
}

export async function decodeWorldBackup(text) {
  requireValid(typeof text === 'string' && text.length <= MAX_BACKUP_BYTES &&
    new TextEncoder().encode(text).byteLength <= MAX_BACKUP_BYTES,
  'The backup exceeds 8 MiB.', 'backup-size');
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch (cause) {
    throw Object.assign(new CorruptSaveError(`Invalid backup JSON: ${cause.message}`), {
      code: 'backup-invalid'
    });
  }
  requireValid(envelope?.format === FORMAT && envelope.version === 1,
    'Unsupported world backup format.', 'backup-incompatible');
  requireValid(typeof envelope.exportedAt === 'string' &&
    envelope.exportedAt.length <= 64 && Number.isFinite(Date.parse(envelope.exportedAt)) &&
    typeof envelope.checksum === 'string' && /^[a-f0-9]{64}$/.test(envelope.checksum),
  'Invalid backup metadata.');
  const payload = snapshotFields(envelope.snapshot);
  requireValid(payload.schemaVersion === SAVE_SCHEMA_VERSION &&
    payload.generatorVersion === WORLD_GENERATOR_VERSION &&
    Array.isArray(payload.dimensions) && payload.dimensions.length === SIZE.length &&
    payload.dimensions.every((size, axis) => size === SIZE[axis]),
  'Unsupported backup schema, generator, or dimensions.', 'backup-incompatible');
  const snapshot = {
    ...payload, blocks: decodeBytes(payload.blocks), water: decodeBytes(payload.water)
  };
  validateSnapshot(snapshot);
  requireValid(await checksum(payload) === envelope.checksum,
    'The backup checksum does not match.', 'backup-checksum');
  return snapshot;
}

export async function readWorldBackup(file) {
  requireValid(file.size <= MAX_BACKUP_BYTES, 'The backup exceeds 8 MiB.', 'backup-size');
  return decodeWorldBackup(await file.text());
}

export function backupFileName(name, date = new Date()) {
  const safeName = (name || 'world').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 40) || 'world';
  return `${safeName}-${date.toISOString().replace(/[:.]/g, '-')}.minecraft-world.json`;
}
