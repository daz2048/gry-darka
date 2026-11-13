import { BLOCKS, CHUNK, SIZE } from './world.js';

export const SAVE_SCHEMA_VERSION = 1;
export const WORLD_GENERATOR_VERSION = 1;
export const SAVE_DATABASE = 'minecraft-0.4';
export const SAVE_STORE = 'worlds';
const CELL_COUNT = SIZE[0] * SIZE[1] * SIZE[2];
const MAX_SEED = 0xffffffff;

export class SaveConflictError extends Error {
  constructor() {
    super('Zapis zmienił się w innej karcie. Wczytaj najnowszą wersję przed zapisem.');
    this.name = 'SaveConflictError';
    this.code = 'conflict';
  }
}

export class CorruptSaveError extends Error {
  constructor(message = 'Zapis świata jest uszkodzony lub niezgodny z tą wersją.') {
    super(message);
    this.name = 'CorruptSaveError';
    this.code = 'corrupt';
  }
}

function assert(condition, message) {
  if (!condition) throw new CorruptSaveError(message);
}

export function createSnapshot(world, player, yaw, pitch, selectedBlock, settings, worldId) {
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
    worldId
  };
}

export function validateSnapshot(snapshot) {
  assert(snapshot && typeof snapshot === 'object', 'Zapis nie zawiera danych świata.');
  assert(snapshot.schemaVersion === SAVE_SCHEMA_VERSION, 'Nieobsługiwana wersja formatu zapisu.');
  assert(snapshot.generatorVersion === WORLD_GENERATOR_VERSION, 'Nieobsługiwana wersja generatora świata.');
  assert(Array.isArray(snapshot.dimensions) &&
    snapshot.dimensions.length === SIZE.length &&
    snapshot.dimensions.every((size, axis) => size === SIZE[axis]),
  'Wymiary zapisanego świata są niezgodne.');
  assert(Number.isInteger(snapshot.seed) && snapshot.seed >= 0 && snapshot.seed <= MAX_SEED,
    'Nieprawidłowe ziarno świata.');
  assert(snapshot.blocks instanceof Uint8Array && snapshot.blocks.length === CELL_COUNT,
    'Nieprawidłowa długość danych bloków.');
  assert(snapshot.water instanceof Uint8Array && snapshot.water.length === CELL_COUNT,
    'Nieprawidłowa długość danych wody.');
  for (let index = 0; index < CELL_COUNT; index++) {
    assert(snapshot.blocks[index] < BLOCKS.length, 'Zapis zawiera nieznany materiał.');
    assert(snapshot.water[index] <= 1, 'Zapis zawiera nieprawidłowe dane wody.');
  }
  for (let z = 0; z < SIZE[2]; z++) for (let x = 0; x < SIZE[0]; x++) {
    assert(snapshot.blocks[x + SIZE[0] * z] !== 0, 'Zapis narusza chronioną granicę świata.');
  }
  const { player } = snapshot;
  assert(player && [player.x, player.y, player.z, player.yaw, player.pitch].every(Number.isFinite),
    'Zapis zawiera nieprawidłową pozycję lub kierunek gracza.');
  assert(player.x >= 0.3 && player.x <= SIZE[0] - 0.3 &&
    player.y >= 0 && player.y <= SIZE[1] - 1.75 &&
    player.z >= 0.3 && player.z <= SIZE[2] - 0.3 &&
    Math.abs(player.yaw) <= 1e6 && player.pitch >= -1.47 && player.pitch <= 1.47,
  'Pozycja gracza wykracza poza granice świata.');
  assert(Number.isInteger(snapshot.selectedBlock) &&
    snapshot.selectedBlock > 0 && snapshot.selectedBlock < BLOCKS.length,
  'Nieprawidłowy wybrany materiał.');
  const { settings } = snapshot;
  assert(settings && Number.isFinite(settings.sensitivity) &&
    settings.sensitivity >= 0.4 && settings.sensitivity <= 2 &&
    typeof settings.lowQuality === 'boolean' &&
    typeof settings.musicEnabled === 'boolean' &&
    Number.isFinite(settings.musicVolume) &&
    settings.musicVolume >= 0 && settings.musicVolume <= 1,
  'Zapis zawiera nieprawidłowe ustawienia.');
  assert(typeof snapshot.worldId === 'string' &&
    snapshot.worldId.length > 0 && snapshot.worldId.length <= 128,
  'Nieprawidłowy identyfikator świata.');
  return snapshot;
}

function validateRecord(record) {
  assert(record && Number.isSafeInteger(record.revision) && record.revision > 0 &&
    Number.isFinite(record.savedAt) && record.savedAt > 0,
  'Brak prawidłowej wersji lub daty zapisu.');
  return validateSnapshot(record);
}

function openDatabase(factory) {
  if (!factory) throw new Error('Przeglądarka nie udostępnia IndexedDB.');
  return new Promise((resolve, reject) => {
    const request = factory.open(SAVE_DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(SAVE_STORE);
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || new Error('Nie można otworzyć bazy zapisów.'));
    request.onblocked = () => reject(new Error('Baza zapisów jest zajęta przez inną kartę.'));
  });
}

function readRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Nie można odczytać zapisu.'));
  });
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
  }

  async db() {
    if (!this.database) this.database = await openDatabase(this.factory);
    return this.database;
  }

  async load() {
    const db = await this.db();
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
      return { status: 'current', record: currentStatus.value, expected, previousAvailable: previousStatus.valid };
    }
    if (previousStatus.valid) {
      return { status: 'recovery', record: previousStatus.value, expected, previousAvailable: true };
    }
    if (current !== undefined || previous !== undefined) {
      return { status: 'corrupt', record: null, expected, previousAvailable: false };
    }
    return { status: 'empty', record: null, expected, previousAvailable: false };
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
          failure = new Error('Licznik wersji zapisu osiągnął limit.');
          transaction.abort();
          return;
        }
        if (currentStatus.valid) store.put(current, 'previous');
        savedRecord = { ...snapshot, revision: nextRevision, savedAt: Date.now() };
        store.put(savedRecord, 'current');
      };
      transaction.oncomplete = () => resolve(savedRecord);
      transaction.onabort = () => reject(failure || transaction.error || new Error('Zapis został przerwany.'));
      transaction.onerror = () => {
        if (!failure) failure = transaction.error || new Error('Nie można zapisać świata.');
      };
      request.onerror = () => {
        failure = request.error || new Error('Nie można sprawdzić aktualnej wersji zapisu.');
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
