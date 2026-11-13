import { BLOCKS, CHUNK, SIZE } from './world.js';

export const SAVE_SCHEMA_VERSION = 1;
export const WORLD_GENERATOR_VERSION = 1;
export const SAVE_DATABASE = 'minecraft-0.3';
export const LEGACY_SAVE_DATABASE = 'minecraft-0.4';
export const SAVE_STORE = 'worlds';
const CELL_COUNT = SIZE[0] * SIZE[1] * SIZE[2];
const MAX_SEED = 0xffffffff;

export class SaveConflictError extends Error {
  constructor() {
    super('The save changed in another tab. Load the latest version before saving.');
    this.name = 'SaveConflictError';
    this.code = 'conflict';
  }
}

export class CorruptSaveError extends Error {
  constructor(message = 'The world save is damaged or incompatible with this version.') {
    super(message);
    this.name = 'CorruptSaveError';
    this.code = 'corrupt';
  }
}

export class SaveMigrationError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'SaveMigrationError';
    this.code = 'migration';
  }
}

function storageError(message, code) {
  return Object.assign(new Error(message), { code });
}

function assert(condition, message) {
  if (!condition) throw new CorruptSaveError(message);
}

export function createSnapshot(world, player, yaw, pitch, selectedBlock, settings, worldId, worldName = 'Łąka') {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    generatorVersion: WORLD_GENERATOR_VERSION,
    dimensions: [...SIZE],
    seed: world.seed,
    blocks: world.blocks.slice(),
    water: world.water.slice(),
    player: { x: player.x, y: player.y, z: player.z, yaw, pitch },
    selectedBlock,
    settings: {
      sensitivity: settings.sensitivity,
      lowQuality: settings.lowQuality,
      musicEnabled: settings.musicEnabled,
      musicVolume: settings.musicVolume
    },
    worldId,
    worldName
  };
}

export function saveDataSize(record) {
  const { blocks, water, ...metadata } = record;
  return blocks.byteLength + water.byteLength +
    new TextEncoder().encode(JSON.stringify(metadata)).byteLength;
}

export function validateSnapshot(snapshot) {
  assert(snapshot && typeof snapshot === 'object', 'The save contains no world data.');
  assert(snapshot.schemaVersion === SAVE_SCHEMA_VERSION, 'Unsupported save format version.');
  assert(snapshot.generatorVersion === WORLD_GENERATOR_VERSION, 'Unsupported world generator version.');
  assert(Array.isArray(snapshot.dimensions) &&
    snapshot.dimensions.length === SIZE.length &&
    snapshot.dimensions.every((size, axis) => size === SIZE[axis]),
  'Saved world dimensions do not match.');
  assert(Number.isInteger(snapshot.seed) && snapshot.seed >= 0 && snapshot.seed <= MAX_SEED,
    'Invalid world seed.');
  assert(snapshot.blocks instanceof Uint8Array && snapshot.blocks.length === CELL_COUNT,
    'Invalid block data length.');
  assert(snapshot.water instanceof Uint8Array && snapshot.water.length === CELL_COUNT,
    'Invalid water data length.');
  for (let index = 0; index < CELL_COUNT; index++) {
    assert(snapshot.blocks[index] < BLOCKS.length, 'The save contains an unknown material.');
    assert(snapshot.water[index] <= 1, 'The save contains invalid water data.');
  }
  for (let z = 0; z < SIZE[2]; z++) for (let x = 0; x < SIZE[0]; x++) {
    assert(snapshot.blocks[x + SIZE[0] * z] !== 0, 'The save breaks the protected world floor.');
  }
  const { player } = snapshot;
  assert(player && [player.x, player.y, player.z, player.yaw, player.pitch].every(Number.isFinite),
    'The save contains an invalid player position or direction.');
  assert(player.x >= 0.3 && player.x <= SIZE[0] - 0.3 &&
    player.y >= 0 && player.y <= SIZE[1] - 1.75 &&
    player.z >= 0.3 && player.z <= SIZE[2] - 0.3 &&
    Math.abs(player.yaw) <= 1e6 && player.pitch >= -1.47 && player.pitch <= 1.47,
  'The player position is outside the world.');
  assert(Number.isInteger(snapshot.selectedBlock) &&
    snapshot.selectedBlock > 0 && snapshot.selectedBlock < BLOCKS.length,
  'Invalid selected material.');
  const { settings } = snapshot;
  assert(settings && Number.isFinite(settings.sensitivity) &&
    settings.sensitivity >= 0.4 && settings.sensitivity <= 2 &&
    typeof settings.lowQuality === 'boolean' &&
    typeof settings.musicEnabled === 'boolean' &&
    Number.isFinite(settings.musicVolume) &&
    settings.musicVolume >= 0 && settings.musicVolume <= 1,
  'The save contains invalid settings.');
  assert(typeof snapshot.worldId === 'string' &&
    snapshot.worldId.length > 0 && snapshot.worldId.length <= 128,
  'Invalid world identifier.');
  assert(snapshot.worldName === undefined ||
    (typeof snapshot.worldName === 'string' && snapshot.worldName.trim().length > 0 &&
      snapshot.worldName.length <= 32),
  'Invalid world name.');
  return snapshot;
}

function validateRecord(record) {
  assert(record && Number.isSafeInteger(record.revision) && record.revision > 0 &&
    Number.isFinite(record.savedAt) && record.savedAt > 0,
  'Missing a valid save revision or date.');
  return validateSnapshot(record);
}

function openDatabase(factory) {
  if (!factory) throw storageError('This browser does not provide IndexedDB.', 'storage-unavailable');
  return new Promise((resolve, reject) => {
    const request = factory.open(SAVE_DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(SAVE_STORE);
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || storageError('Cannot open the save database.', 'storage-unavailable'));
    request.onblocked = () => reject(storageError('The save database is busy in another tab.', 'storage-busy'));
  });
}

function openExistingDatabase(factory, name) {
  return new Promise((resolve, reject) => {
    const request = factory.open(name);
    request.onupgradeneeded = () => request.transaction.abort();
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || new Error('Cannot open the previous save database.'));
    request.onblocked = () => reject(new Error('The previous save database is busy in another tab.'));
  });
}

function readRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || storageError('Cannot read the save.', 'save-failed'));
  });
}

function migrationMarker(record) {
  return {
    revision: Number.isSafeInteger(record?.revision) && record.revision > 0 ? record.revision : 0,
    savedAt: Number.isFinite(record?.savedAt) && record.savedAt > 0 ? record.savedAt : 1,
    schemaVersion: 0
  };
}

function importLegacyRecords(db, legacyCurrent, legacyPrevious) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SAVE_STORE, 'readwrite');
    const store = transaction.objectStore(SAVE_STORE);
    const currentRequest = store.get('current');
    const previousRequest = store.get('previous');
    let remaining = 2;
    let targetHasRecords = false;
    let imported = false;
    let failure = null;
    const onTargetRead = request => {
      request.onsuccess = () => {
        targetHasRecords ||= request.result !== undefined;
        remaining--;
        if (remaining !== 0 || targetHasRecords) return;
        const currentStatus = recordStatus(legacyCurrent);
        const previousStatus = recordStatus(legacyPrevious);
        if (legacyCurrent !== undefined) {
          store.put(currentStatus.valid ? legacyCurrent : migrationMarker(legacyCurrent), 'current');
          imported = true;
        } else if (legacyPrevious !== undefined && !previousStatus.valid) {
          store.put(migrationMarker(legacyPrevious), 'previous');
          imported = true;
        }
        if (previousStatus.valid) {
          store.put(legacyPrevious, 'previous');
          imported = true;
        }
      };
      request.onerror = () => {
        failure = request.error || new Error('Cannot check the target save.');
      };
    };
    onTargetRead(currentRequest);
    onTargetRead(previousRequest);
    transaction.oncomplete = () => resolve(imported);
    transaction.onabort = () => reject(failure || transaction.error || new Error('Importing the previous save was interrupted.'));
    transaction.onerror = () => {
      if (!failure) failure = transaction.error || new Error('Cannot move the previous save.');
    };
  });
}

async function migrateLegacySave(factory, db) {
  if (!factory || typeof factory.databases !== 'function') {
    throw new SaveMigrationError('This browser cannot safely migrate existing saves.');
  }
  let legacyDatabase;
  try {
    const databases = await factory.databases();
    if (!databases.some(database => database.name === LEGACY_SAVE_DATABASE)) return false;
    legacyDatabase = await openExistingDatabase(factory, LEGACY_SAVE_DATABASE);
    const transaction = legacyDatabase.transaction(SAVE_STORE, 'readonly');
    const store = transaction.objectStore(SAVE_STORE);
    const [current, previous] = await Promise.all([
      readRequest(store.get('current')),
      readRequest(store.get('previous'))
    ]);
    return await importLegacyRecords(db, current, previous);
  } catch (error) {
    if (error instanceof SaveMigrationError) throw error;
    throw new SaveMigrationError(
      'Cannot move the previous save. Its database was not changed; reload the page to try again.',
      error
    );
  } finally {
    legacyDatabase?.close();
  }
}

function recordStatus(record) {
  if (!record) return { valid: false, value: null };
  try {
    return { valid: true, value: validateRecord(record) };
  } catch (error) {
    if (!(error instanceof CorruptSaveError)) throw error;
    return { valid: false, value: null, error };
  }
}

export class WorldSaveStore {
  constructor(factory = globalThis.indexedDB) {
    this.factory = factory;
    this.database = null;
    this.migration = null;
  }

  async db() {
    if (!this.database) this.database = await openDatabase(this.factory);
    return this.database;
  }

  async load() {
    const db = await this.db();
    if (!this.migration) this.migration = migrateLegacySave(this.factory, db);
    const migrated = await this.migration;
    const transaction = db.transaction(SAVE_STORE, 'readonly');
    const store = transaction.objectStore(SAVE_STORE);
    const [current, previous] = await Promise.all([
      readRequest(store.get('current')),
      readRequest(store.get('previous'))
    ]);
    const [currentStatus, previousStatus] = [recordStatus(current), recordStatus(previous)];
    const expected = {
      exists: current !== undefined,
      revision: Number.isSafeInteger(current?.revision) ? current.revision : null
    };
    if (currentStatus.valid) {
      return { status: 'current', record: currentStatus.value, expected, previousAvailable: previousStatus.valid, migrated };
    }
    if (previousStatus.valid) {
      return { status: 'recovery', record: previousStatus.value, expected, previousAvailable: true, migrated };
    }
    if (current !== undefined || previous !== undefined) {
      return { status: 'corrupt', record: null, expected, previousAvailable: false, migrated };
    }
    return { status: 'empty', record: null, expected, previousAvailable: false, migrated };
  }

  async save(snapshot, expected, { replaceCorrupt = false } = {}) {
    validateSnapshot(snapshot);
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SAVE_STORE, 'readwrite');
      const store = transaction.objectStore(SAVE_STORE);
      let failure = null;
      let savedRecord = null;
      const request = store.get('current');
      request.onsuccess = () => {
        const current = request.result;
        const exists = current !== undefined;
        const revision = Number.isSafeInteger(current?.revision) ? current.revision : null;
        if (exists !== expected.exists || (exists && revision !== expected.revision)) {
          failure = new SaveConflictError();
          transaction.abort();
          return;
        }
        const currentStatus = recordStatus(current);
        if (exists && !currentStatus.valid && !replaceCorrupt) {
          failure = currentStatus.error || new CorruptSaveError();
          transaction.abort();
          return;
        }
        const nextRevision = exists ? (revision ?? 0) + 1 : 1;
        if (!Number.isSafeInteger(nextRevision)) {
          failure = storageError('The save revision counter reached its limit.', 'save-failed');
          transaction.abort();
          return;
        }
        if (currentStatus.valid) store.put(current, 'previous');
        savedRecord = { ...snapshot, revision: nextRevision, savedAt: Date.now() };
        store.put(savedRecord, 'current');
      };
      transaction.oncomplete = () => resolve(savedRecord);
      transaction.onabort = () => reject(failure || transaction.error || storageError('Saving was interrupted.', 'save-failed'));
      transaction.onerror = () => {
        if (!failure) failure = transaction.error || storageError('Cannot save the world.', 'save-failed');
      };
      request.onerror = () => {
        failure = request.error || storageError('Cannot check the current save revision.', 'save-failed');
      };
    });
  }
}

export function applySnapshot(world, snapshot) {
  validateSnapshot(snapshot);
  world.seed = snapshot.seed;
  world.blocks.set(snapshot.blocks);
  world.water.set(snapshot.water);
  world.dirty.clear();
  for (let x = 0; x < SIZE[0] / CHUNK; x++) {
    for (let y = 0; y < SIZE[1] / CHUNK; y++) {
      for (let z = 0; z < SIZE[2] / CHUNK; z++) world.dirty.add(`${x},${y},${z}`);
    }
  }
  return world;
}
