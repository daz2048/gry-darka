import { BLOCKS, CHUNK, SIZE } from './world.js';

export const SAVE_SCHEMA_VERSION = 1;
export const WORLD_GENERATOR_VERSION = 1;
export const SAVE_DATABASE = 'minecraft-0.4';
export const LEGACY_SAVE_DATABASE = 'minecraft-0.3';
export const SAVE_STORE = 'worlds';
export const WORLD_STORE = 'world-records';
export const CATALOG_STORE = 'world-catalog';
export const MAX_WORLDS = 10;
const WORLD_KEY = id => `world:${id}`;
const BACKUP_KEY = id => `previous:${id}`;
const CATALOG_KEY = id => `world:${id}`;
const ACTIVE_KEY = 'meta:active';
const MIGRATED_KEY = 'meta:migrated';
const CELL_COUNT = SIZE[0] * SIZE[1] * SIZE[2];
const MAX_SEED = 0xffffffff;

export function suggestUniqueWorldName(existingNames, date = new Date(), label = 'new world') {
  const pad = value => String(value).padStart(2, '0');
  const dateStamp = `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const timeStamp = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  const base = `${dateStamp} ${label} ${timeStamp}`;
  const existing = new Set(existingNames.map(name => name.trim().toLowerCase()));
  let candidate = base;
  for (let suffix = 2; existing.has(candidate.toLowerCase()); suffix++) {
    const discriminator = ` (${suffix})`;
    candidate = `${base.slice(0, 32 - discriminator.length)}${discriminator}`;
  }
  return candidate;
}

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

export class WorldLimitError extends Error {
  constructor() {
    super(`The maximum of ${MAX_WORLDS} saved worlds has been reached.`);
    this.name = 'WorldLimitError';
    this.code = 'world-limit';
  }
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
    const request = factory.open(SAVE_DATABASE, 2);
    request.onupgradeneeded = () => {
      const { objectStoreNames } = request.result;
      if (!objectStoreNames.contains(SAVE_STORE)) request.result.createObjectStore(SAVE_STORE);
      if (!objectStoreNames.contains(WORLD_STORE)) request.result.createObjectStore(WORLD_STORE);
      if (!objectStoreNames.contains(CATALOG_STORE)) request.result.createObjectStore(CATALOG_STORE);
    };
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

function writeTransaction(db, stores, execute, fallbackMessage) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite');
    let result;
    let failure = null;
    try {
      execute(transaction, value => { result = value; }, error => {
        failure = error;
        transaction.abort();
      });
    } catch (error) {
      failure = error;
      transaction.abort();
    }
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure || transaction.error || storageError(fallbackMessage, 'save-failed'));
    transaction.onerror = () => {
      if (!failure) failure = transaction.error || storageError(fallbackMessage, 'save-failed');
    };
  });
}

function migrationMarker(record) {
  return {
    revision: Number.isSafeInteger(record?.revision) && record.revision > 0 ? record.revision : 0,
    savedAt: Number.isFinite(record?.savedAt) && record.savedAt > 0 ? record.savedAt : 1,
    schemaVersion: 0,
    ...(typeof record?.worldId === 'string' ? { worldId: record.worldId } : {}),
    ...(typeof record?.worldName === 'string' ? { worldName: record.worldName } : {})
  };
}

function migrationWorldId(record, slot) {
  return typeof record?.worldId === 'string' && record.worldId.length > 0 &&
    record.worldId.length <= 128 ? record.worldId : `__damaged_${slot}__`;
}

function catalogEntry(record, worldId, corrupt = false) {
  return {
    worldId,
    worldName: typeof record?.worldName === 'string' ? record.worldName : '',
    revision: Number.isSafeInteger(record?.revision) ? record.revision : 0,
    savedAt: Number.isFinite(record?.savedAt) ? record.savedAt : 1,
    lastPlayedAt: 0,
    corrupt
  };
}

function migrateSingleSlot(db) {
  return writeTransaction(db, [SAVE_STORE, WORLD_STORE, CATALOG_STORE], (transaction, setResult, fail) => {
    const legacy = transaction.objectStore(SAVE_STORE);
    const records = transaction.objectStore(WORLD_STORE);
    const catalog = transaction.objectStore(CATALOG_STORE);
    const currentRequest = legacy.get('current');
    const previousRequest = legacy.get('previous');
    const migratedRequest = catalog.get(MIGRATED_KEY);
    const keysRequest = catalog.getAllKeys();
    let remaining = 4;
    let current;
    let previous;
    let migrated;
    let catalogHasWorlds = false;
    const complete = () => {
      remaining--;
      if (remaining !== 0 || migrated) return;
      if (catalogHasWorlds) {
        catalog.put(true, MIGRATED_KEY);
        setResult(false);
        return;
      }

      const currentStatus = recordStatus(current);
      const previousStatus = recordStatus(previous);
      const currentId = current === undefined ? null : migrationWorldId(current, 'current');
      const previousId = previous === undefined ? null : migrationWorldId(previous, 'previous');

      if (current !== undefined) {
        records.put(current, WORLD_KEY(currentId));
        catalog.put(catalogEntry(current, currentId,
          !currentStatus.valid && !(previousStatus.valid && currentId === previousId)), CATALOG_KEY(currentId));
      }
      if (previous !== undefined) {
        if (previousStatus.valid && currentId === previousId) {
          records.put(previous, BACKUP_KEY(previousId));
        } else if (previousId !== currentId) {
          records.put(previous, WORLD_KEY(previousId));
          catalog.put(catalogEntry(previous, previousId, !previousStatus.valid), CATALOG_KEY(previousId));
        }
      }

      legacy.delete('current');
      legacy.delete('previous');
      catalog.put(true, MIGRATED_KEY);
      setResult(current !== undefined || previous !== undefined);
    };

    currentRequest.onsuccess = () => { current = currentRequest.result; complete(); };
    previousRequest.onsuccess = () => { previous = previousRequest.result; complete(); };
    migratedRequest.onsuccess = () => { migrated = migratedRequest.result === true; complete(); };
    keysRequest.onsuccess = () => {
      catalogHasWorlds = keysRequest.result.some(key => typeof key === 'string' && key.startsWith('world:'));
      complete();
    };
    for (const request of [currentRequest, previousRequest, migratedRequest, keysRequest]) {
      request.onerror = () => fail(request.error || new Error('Cannot read the previous world save.'));
    }
  }, 'Moving the previous world save was interrupted.');
}

function catalogInitialized(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CATALOG_STORE, 'readonly');
    const store = transaction.objectStore(CATALOG_STORE);
    const keysRequest = store.getAllKeys();
    const migratedRequest = store.get(MIGRATED_KEY);
    let remaining = 2;
    let initialized = false;
    const complete = () => {
      remaining--;
      if (remaining === 0) resolve(initialized);
    };
    keysRequest.onsuccess = () => {
      initialized ||= keysRequest.result.some(key =>
        typeof key === 'string' && key.startsWith('world:'));
      complete();
    };
    migratedRequest.onsuccess = () => {
      initialized ||= migratedRequest.result === true;
      complete();
    };
    for (const request of [keysRequest, migratedRequest]) {
      request.onerror = () => reject(request.error || storageError('Cannot read the world catalog.', 'save-failed'));
    }
    transaction.onerror = () => reject(transaction.error || storageError('Cannot read the world catalog.', 'save-failed'));
  });
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

  async prepareCatalog(db) {
    if (await catalogInitialized(db)) return false;
    const migratedLegacy = await migrateLegacySave(this.factory, db);
    await migrateSingleSlot(db);
    return migratedLegacy;
  }

  async listWorlds() {
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    await this.migration;
    const transaction = db.transaction(CATALOG_STORE, 'readonly');
    const request = transaction.objectStore(CATALOG_STORE).getAll();
    const worlds = await readRequest(request);
    return worlds.filter(entry => entry && typeof entry.worldId === 'string')
      .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt || b.savedAt - a.savedAt);
  }

  async load(worldId = null) {
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    const migrated = await this.migration;
    if (worldId === null) {
      const active = await readRequest(db.transaction(CATALOG_STORE, 'readonly')
        .objectStore(CATALOG_STORE).get(ACTIVE_KEY));
      const worlds = await this.listWorlds();
      const selectedId = worlds.some(entry => entry.worldId === active) ? active : worlds[0]?.worldId;
      if (selectedId) return this.loadWorld(selectedId, migrated);
      return {
        status: 'empty',
        record: null,
        expected: { exists: false, revision: null, worldId: null },
        previousAvailable: false,
        migrated
      };
    }
    return this.loadWorld(worldId, migrated);
  }

  async loadWorld(worldId, migrated = null) {
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    if (migrated === null) migrated = await this.migration;
    const transaction = db.transaction([WORLD_STORE, CATALOG_STORE], 'readonly');
    const records = transaction.objectStore(WORLD_STORE);
    const catalog = transaction.objectStore(CATALOG_STORE);
    const [current, previous, metadata] = await Promise.all([
      readRequest(records.get(WORLD_KEY(worldId))),
      readRequest(records.get(BACKUP_KEY(worldId))),
      readRequest(catalog.get(CATALOG_KEY(worldId)))
    ]);
    const [currentStatus, previousStatus] = [recordStatus(current), recordStatus(previous)];
    const expected = {
      exists: metadata !== undefined || current !== undefined || previous !== undefined,
      revision: Number.isSafeInteger(metadata?.revision) && metadata.revision > 0
        ? metadata.revision
        : Number.isSafeInteger(current?.revision) && current.revision > 0 ? current.revision : null,
      worldId
    };
    if (currentStatus.valid) {
      return {
        status: 'current', record: currentStatus.value, expected,
        previousAvailable: previousStatus.valid, migrated
      };
    }
    if (previousStatus.valid) {
      return { status: 'recovery', record: previousStatus.value, expected, previousAvailable: true, migrated };
    }
    if (current !== undefined || previous !== undefined || metadata?.corrupt) {
      return { status: 'corrupt', record: null, expected, previousAvailable: false, migrated };
    }
    return {
      status: 'empty',
      record: null,
      expected: { exists: false, revision: null, worldId },
      previousAvailable: false,
      migrated
    };
  }

  async importWorld(snapshot) {
    validateSnapshot(snapshot);
    const worldId = crypto.randomUUID();
    return this.save({ ...snapshot, worldId }, {
      exists: false, revision: null, worldId
    }, { activate: false });
  }

  async save(snapshot, expected, { replaceCorrupt = false, activate = true } = {}) {
    validateSnapshot(snapshot);
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    await this.migration;
    const worldId = snapshot.worldId;
    return writeTransaction(db, [WORLD_STORE, CATALOG_STORE], (transaction, setResult, fail) => {
      const records = transaction.objectStore(WORLD_STORE);
      const catalog = transaction.objectStore(CATALOG_STORE);
      const currentRequest = records.get(WORLD_KEY(worldId));
      const metadataRequest = catalog.get(CATALOG_KEY(worldId));
      const worldsRequest = expected.exists ? null : catalog.getAll();
      let current;
      let metadata;
      let worlds;
      let remaining = worldsRequest ? 3 : 2;
      const complete = () => {
        remaining--;
        if (remaining !== 0) return;
        const exists = metadata !== undefined || current !== undefined;
        const revision = Number.isSafeInteger(metadata?.revision) && metadata.revision > 0
          ? metadata.revision
          : Number.isSafeInteger(current?.revision) && current.revision > 0 ? current.revision : null;
        const expectedWorldId = expected.worldId ?? worldId;
        if (expectedWorldId !== worldId || exists !== expected.exists ||
            (exists && revision !== expected.revision)) {
          fail(new SaveConflictError());
          return;
        }
        if (!exists && worlds.filter(entry => typeof entry?.worldId === 'string').length >= MAX_WORLDS) {
          fail(new WorldLimitError());
          return;
        }
        const currentStatus = recordStatus(current);
        if (current !== undefined && !currentStatus.valid && !replaceCorrupt) {
          fail(currentStatus.error || new CorruptSaveError());
          return;
        }
        const nextRevision = exists ? (revision ?? 0) + 1 : 1;
        if (!Number.isSafeInteger(nextRevision)) {
          fail(storageError('The save revision counter reached its limit.', 'save-failed'));
          return;
        }
        if (currentStatus.valid) records.put(current, BACKUP_KEY(worldId));
        const savedRecord = { ...snapshot, revision: nextRevision, savedAt: Date.now() };
        const entry = {
          worldId,
          worldName: savedRecord.worldName ?? '',
          revision: savedRecord.revision,
          savedAt: savedRecord.savedAt,
          lastPlayedAt: Date.now(),
          corrupt: false
        };
        records.put(savedRecord, WORLD_KEY(worldId));
        catalog.put(entry, CATALOG_KEY(worldId));
        if (activate) catalog.put(worldId, ACTIVE_KEY);
        setResult(savedRecord);
      };
      currentRequest.onsuccess = () => { current = currentRequest.result; complete(); };
      metadataRequest.onsuccess = () => { metadata = metadataRequest.result; complete(); };
      if (worldsRequest) {
        worldsRequest.onsuccess = () => { worlds = worldsRequest.result; complete(); };
        worldsRequest.onerror = () => fail(worldsRequest.error ||
          storageError('Cannot check the world limit.', 'save-failed'));
      }
      for (const request of [currentRequest, metadataRequest]) {
        request.onerror = () => fail(request.error || storageError('Cannot check the current world revision.', 'save-failed'));
      }
    }, 'Saving the world was interrupted.');
  }

  async activateWorld(worldId) {
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    await this.migration;
    return writeTransaction(db, CATALOG_STORE, (transaction, setResult, fail) => {
      const store = transaction.objectStore(CATALOG_STORE);
      const request = store.get(CATALOG_KEY(worldId));
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          fail(storageError('The selected world no longer exists.', 'world-not-found'));
          return;
        }
        entry.lastPlayedAt = Date.now();
        store.put(entry, CATALOG_KEY(worldId));
        store.put(worldId, ACTIVE_KEY);
        setResult(entry);
      };
      request.onerror = () => fail(request.error || storageError('Cannot select the world.', 'save-failed'));
    }, 'Selecting the world was interrupted.');
  }

  async renameWorld(worldId, worldName, expected = null) {
    if (typeof worldName !== 'string' || !worldName.trim() || worldName.length > 32) {
      throw new CorruptSaveError('Invalid world name.');
    }
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    await this.migration;
    return writeTransaction(db, [WORLD_STORE, CATALOG_STORE], (transaction, setResult, fail) => {
      const records = transaction.objectStore(WORLD_STORE);
      const catalog = transaction.objectStore(CATALOG_STORE);
      const currentRequest = records.get(WORLD_KEY(worldId));
      const metadataRequest = catalog.get(CATALOG_KEY(worldId));
      let current;
      let metadata;
      let remaining = 2;
      const complete = () => {
        remaining--;
        if (remaining !== 0) return;
        if (!metadata || !recordStatus(current).valid) {
          fail(new CorruptSaveError('The selected world cannot be renamed.'));
          return;
        }
        if (expected && (expected.worldId !== worldId || expected.revision !== metadata.revision)) {
          fail(new SaveConflictError());
          return;
        }
        const renamed = {
          ...current,
          worldName: worldName.trim(),
          revision: metadata.revision + 1,
          savedAt: Date.now()
        };
        records.put(current, BACKUP_KEY(worldId));
        records.put(renamed, WORLD_KEY(worldId));
        catalog.put({ ...metadata, worldName: renamed.worldName, revision: renamed.revision, savedAt: renamed.savedAt },
          CATALOG_KEY(worldId));
        setResult(renamed);
      };
      currentRequest.onsuccess = () => { current = currentRequest.result; complete(); };
      metadataRequest.onsuccess = () => { metadata = metadataRequest.result; complete(); };
      for (const request of [currentRequest, metadataRequest]) {
        request.onerror = () => fail(request.error || storageError('Cannot rename the world.', 'save-failed'));
      }
    }, 'Renaming the world was interrupted.');
  }

  async deleteWorld(worldId) {
    const db = await this.db();
    if (!this.migration) this.migration = this.prepareCatalog(db);
    await this.migration;
    return writeTransaction(db, [WORLD_STORE, CATALOG_STORE], (transaction, setResult, fail) => {
      const records = transaction.objectStore(WORLD_STORE);
      const catalog = transaction.objectStore(CATALOG_STORE);
      const activeRequest = catalog.get(ACTIVE_KEY);
      const metadataRequest = catalog.get(CATALOG_KEY(worldId));
      let active;
      let metadata;
      let remaining = 2;
      const complete = () => {
        remaining--;
        if (remaining !== 0) return;
        if (!metadata) {
          setResult(false);
          return;
        }
        records.delete(WORLD_KEY(worldId));
        records.delete(BACKUP_KEY(worldId));
        catalog.delete(CATALOG_KEY(worldId));
        if (active === worldId) catalog.delete(ACTIVE_KEY);
        setResult(true);
      };
      activeRequest.onsuccess = () => { active = activeRequest.result; complete(); };
      metadataRequest.onsuccess = () => { metadata = metadataRequest.result; complete(); };
      for (const request of [activeRequest, metadataRequest]) {
        request.onerror = () => fail(request.error || storageError('Cannot delete the world.', 'save-failed'));
      }
    }, 'Deleting the world was interrupted.');
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
